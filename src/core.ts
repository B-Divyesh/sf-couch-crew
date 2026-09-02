export const TICK_RATE = 60;
export const STEP = 1 / TICK_RATE;

export const roles = [
  { id: 'driver', name: 'Driver', color: 'cyan', actions: ['Veer left', 'Veer right'], keys: ['1', '2'] },
  { id: 'lookout', name: 'Lookout', color: 'amber', actions: ['Scan near', 'Scan far'], keys: ['3', '4'] },
  { id: 'hacker', name: 'Hacker', color: 'lime', actions: ['Patch blue', 'Patch gold'], keys: ['5', '6'] },
  { id: 'loader', name: 'Loader', color: 'paper', actions: ['Lift case', 'Lock case'], keys: ['7', '8'] },
  { id: 'dispatcher', name: 'Dispatcher', color: 'coral', actions: ['Route A', 'Route B'], keys: ['9', '0'] },
] as const;

export type RoleId = (typeof roles)[number]['id'];
export type Phase = 'briefing' | 'active' | 'won' | 'lost';

export interface Mission {
  name: string;
  objective: string;
  target: number;
  promptSeconds: number;
  pressurePerSecond: number;
}

export const missions: Mission[] = [
  { name: 'Garage exit', objective: 'Clear the shutters before they lock.', target: 12, promptSeconds: 24, pressurePerSecond: 0.24 },
  { name: 'Skybridge', objective: 'Cross while the patrol turns away.', target: 16, promptSeconds: 22, pressurePerSecond: 0.34 },
  { name: 'Vault run', objective: 'Move the case through the final route.', target: 20, promptSeconds: 20, pressurePerSecond: 0.48 },
];

export interface Prompt {
  roleIndex: number;
  actionIndex: number;
  serial: number;
}

export interface GameState {
  seed: number;
  code: string;
  playerCount: number;
  demo: boolean;
  phase: Phase;
  missionIndex: number;
  missionProgress: number;
  pressure: number;
  prompt: Prompt;
  promptTime: number;
  elapsed: number;
  hits: number;
  misses: number;
  streak: number;
  bestStreak: number;
  paused: boolean;
  calmMode: boolean;
}

function mix(value: number): number {
  let x = value | 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b);
  return (x ^ (x >>> 16)) >>> 0;
}

export function codeFromSeed(seed: number): string {
  const alphabet = 'BCDFGHJKLMNPQRSTVWXYZ23456789';
  let value = mix(seed);
  let code = '';
  for (let i = 0; i < 4; i += 1) {
    code += alphabet[value % alphabet.length];
    value = Math.floor(value / alphabet.length);
  }
  return code;
}

export function promptFor(seed: number, serial: number): Prompt {
  const value = mix(seed + Math.imul(serial + 1, 2654435761));
  return {
    roleIndex: value % roles.length,
    actionIndex: (value >>> 8) % 2,
    serial,
  };
}

export function createGame(playerCount: number, options: { seed?: number; demo?: boolean; active?: boolean } = {}): GameState {
  const seed = options.seed ?? Math.floor(Math.random() * 0x7fffffff);
  const demo = options.demo ?? false;
  const state: GameState = {
    seed,
    code: demo ? 'DEMO' : codeFromSeed(seed),
    playerCount: Math.max(3, Math.min(6, playerCount)),
    demo,
    phase: options.active ? 'active' : 'briefing',
    missionIndex: 0,
    missionProgress: demo ? 4 : 0,
    pressure: demo ? 18 : 0,
    prompt: promptFor(seed, 0),
    promptTime: demo ? 8 : missions[0].promptSeconds,
    elapsed: 0,
    hits: demo ? 4 : 0,
    misses: 0,
    streak: demo ? 2 : 0,
    bestStreak: demo ? 2 : 0,
    paused: false,
    calmMode: false,
  };
  return state;
}

function nextPrompt(state: GameState): void {
  state.prompt = promptFor(state.seed, state.prompt.serial + 1);
  const base = missions[state.missionIndex].promptSeconds;
  state.promptTime = state.demo ? Math.min(8, base) : base;
}

export function startMission(state: GameState): GameState {
  if (state.phase === 'briefing') {
    state.phase = 'active';
    state.promptTime = state.demo ? 8 : missions[state.missionIndex].promptSeconds;
  }
  return state;
}

export function tickGame(state: GameState, seconds: number): GameState {
  if (state.phase !== 'active' || state.paused) return state;
  const mission = missions[state.missionIndex];
  state.elapsed += seconds;
  state.promptTime -= seconds;
  const calmFactor = state.calmMode ? 0.55 : 1;
  state.pressure = Math.min(100, state.pressure + seconds * mission.pressurePerSecond * calmFactor);
  if (state.promptTime <= 0) {
    state.misses += 1;
    state.streak = 0;
    state.pressure = Math.min(100, state.pressure + (state.calmMode ? 5 : 9));
    nextPrompt(state);
  }
  if (state.pressure >= 100) state.phase = 'lost';
  return state;
}

export function dispatchAction(state: GameState, roleIndex: number, actionIndex: number): GameState {
  if (state.phase !== 'active' || state.paused) return state;
  if (state.prompt.roleIndex !== roleIndex || state.prompt.actionIndex !== actionIndex) {
    state.misses += 1;
    state.streak = 0;
    state.pressure = Math.min(100, state.pressure + (state.calmMode ? 3 : 6));
    if (state.pressure >= 100) state.phase = 'lost';
    return state;
  }

  state.hits += 1;
  state.streak += 1;
  state.bestStreak = Math.max(state.bestStreak, state.streak);
  state.pressure = Math.max(0, state.pressure - 2.5);
  state.missionProgress += 1;

  if (state.missionProgress >= missions[state.missionIndex].target) {
    if (state.missionIndex === missions.length - 1) {
      state.phase = 'won';
    } else {
      state.missionIndex += 1;
      state.missionProgress = 0;
      state.phase = 'briefing';
      state.pressure = Math.max(0, state.pressure - 12);
      nextPrompt(state);
    }
  } else {
    nextPrompt(state);
  }
  return state;
}

export function assignmentFor(playerCount: number, roleIndex: number): string {
  const assignments: Record<number, string[]> = {
    3: ['Player 1', 'Player 2', 'Player 2', 'Player 1', 'Player 3'],
    4: ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 4'],
    5: ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5'],
    6: ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Players 5 + 6'],
  };
  return assignments[Math.max(3, Math.min(6, playerCount))][roleIndex];
}

export function totalPrompts(): number {
  return missions.reduce((sum, mission) => sum + mission.target, 0);
}
