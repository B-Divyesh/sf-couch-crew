import { describe, expect, it } from 'vitest';
import {
  BRIEFING_TARGET_SECONDS,
  MIN_PROMPT_CADENCE_SECONDS,
  REPRESENTATIVE_RESPONSE_SECONDS,
  STEP,
  TICK_RATE,
  createGame,
  dispatchAction,
  missions,
  promptFor,
  startMission,
  tickGame,
  totalPrompts,
  type GameState,
} from '../src/core';

function playTimedRun(responseSeconds: number, lockBeforeWaiting = false): GameState {
  const game = createGame(5, { seed: 77, active: true });
  let moves = 0;
  while (game.phase !== 'won' && moves < totalPrompts()) {
    if (game.phase === 'briefing') startMission(game);
    if (lockBeforeWaiting) {
      dispatchAction(game, game.prompt.roleIndex, game.prompt.actionIndex);
      tickGame(game, responseSeconds);
    } else {
      tickGame(game, responseSeconds);
      dispatchAction(game, game.prompt.roleIndex, game.prompt.actionIndex);
    }
    moves += 1;
  }
  return game;
}

describe('deterministic game core', () => {
  it('returns the same prompt sequence for one seed', () => {
    const first = Array.from({ length: 10 }, (_, serial) => promptFor(42, serial));
    expect(first).toEqual(Array.from({ length: 10 }, (_, serial) => promptFor(42, serial)));
    expect(first).not.toEqual(Array.from({ length: 10 }, (_, serial) => promptFor(43, serial)));
  });

  it('plays all three missions to a win', () => {
    const game = playTimedRun(MIN_PROMPT_CADENCE_SECONDS, true);
    expect(game.phase).toBe('won');
    expect(game.hits).toBe(totalPrompts());
    expect(game.missionIndex).toBe(missions.length - 1);
  });

  it('completes a paced representative 18-minute session @claim:session-length', () => {
    const fastestRun = playTimedRun(MIN_PROMPT_CADENCE_SECONDS, true);
    const representativeRun = playTimedRun(REPRESENTATIVE_RESPONSE_SECONDS);
    const couchSessionSeconds = representativeRun.elapsed + missions.length * BRIEFING_TARGET_SECONDS;

    expect(fastestRun.phase).toBe('won');
    expect(fastestRun.elapsed).toBeGreaterThanOrEqual(14 * 60);
    expect(representativeRun.phase).toBe('won');
    expect(representativeRun.hits).toBe(48);
    expect(couchSessionSeconds).toBeGreaterThanOrEqual(17 * 60);
    expect(couchSessionSeconds).toBeLessThanOrEqual(18 * 60);
  });

  it('locks an early correct move until the real-game cadence', () => {
    const game = createGame(5, { seed: 5, active: true });
    dispatchAction(game, game.prompt.roleIndex, game.prompt.actionIndex);
    expect(game.answerLocked).toBe(true);
    expect(game.missionProgress).toBe(0);
    tickGame(game, MIN_PROMPT_CADENCE_SECONDS - 0.01);
    expect(game.missionProgress).toBe(0);
    tickGame(game, 0.01);
    expect(game.missionProgress).toBe(1);
  });

  it('calm pressure reduces alarm growth @claim:assist-mode', () => {
    const regular = createGame(5, { seed: 5, active: true });
    const calm = createGame(5, { seed: 5, active: true });
    calm.calmMode = true;
    tickGame(regular, 5);
    tickGame(calm, 5);
    expect(calm.pressure).toBeLessThan(regular.pressure);
  });

  it('raises pressure for late and wrong moves', () => {
    const game = createGame(3, { seed: 12 });
    startMission(game);
    dispatchAction(game, (game.prompt.roleIndex + 1) % 5, game.prompt.actionIndex);
    const afterWrong = game.pressure;
    tickGame(game, missions[0].promptSeconds + 0.1);
    expect(afterWrong).toBeGreaterThan(0);
    expect(game.pressure).toBeGreaterThan(afterWrong);
    expect(game.misses).toBe(2);
  });

  it('pauses the fixed-step simulation', () => {
    const game = createGame(4, { seed: 4, active: true });
    game.paused = true;
    tickGame(game, 10);
    expect(game.elapsed).toBe(0);
    expect(game.pressure).toBe(0);
  });

  it('uses a 60 Hz fixed timestep @claim:fixed-timestep', () => {
    expect(TICK_RATE).toBe(60);
    expect(STEP).toBe(1 / 60);
  });
});
