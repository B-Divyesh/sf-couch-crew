import './style.css';
import {
  MIN_PROMPT_CADENCE_SECONDS,
  STEP,
  assignmentFor,
  createGame,
  dispatchAction,
  missions,
  roles,
  startMission,
  tickGame,
  type GameState,
} from './core';

const app = document.querySelector<HTMLDivElement>('#app')!;
const RUN_KEY = 'couch-crew:v1:run';
const SETTINGS_KEY = 'couch-crew:v1:settings';
const PROGRESS_KEY = 'couch-crew:v1:progress';
const REALTIME_URL = import.meta.env.VITE_REALTIME_URL
  ?? (location.hostname === '127.0.0.1' || location.hostname === 'localhost'
    ? 'ws://127.0.0.1:8787'
    : 'wss://sf-couch-crew-realtime.sociobot.in');

interface Settings {
  muted: boolean;
  shake: boolean;
  calm: boolean;
}

const settings: Settings = loadJson(SETTINGS_KEY, { muted: false, shake: true, calm: false });
let game: GameState | null = null;
let gameHost: HTMLElement | null = null;
let lastPromptSerial = -1;
let lastPhase = '';
let audioContext: AudioContext | null = null;
let lastFrame = performance.now();
let accumulator = 0;
let lastSavedSecond = -1;
let realtime: WebSocket | null = null;
let controller: { code: string; playerId: number; roleIndexes: number[]; snapshot: GameState | null } | null = null;
let returnFocus: HTMLElement | null = null;

function loadJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveSettings(): void {
  if (game?.demo) return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function persistRun(): void {
  if (!game || game.demo || game.phase === 'won' || game.phase === 'lost') return;
  localStorage.setItem(RUN_KEY, JSON.stringify(game));
}

function shell(content: string, demoBanner = false): string {
  return `
    <a class="skip-link" href="#main">Skip to the game</a>
    ${demoBanner ? demoNotice() : ''}
    <header class="site-header">
      <a class="wordmark" href="/" data-link aria-label="Couch Crew home"><span aria-hidden="true">▰</span> COUCH CREW</a>
      <nav aria-label="Main navigation">
        <a href="/demo" data-link>Demo</a>
        <a href="/#how" data-home-anchor>How it works</a>
        <a href="/privacy" data-link>Privacy</a>
      </nav>
    </header>
    ${content}
    <footer class="site-footer">
      <p>Couch Crew is a cooperative heist for 3–6 friends and family members.</p>
      <div class="footer-links"><a href="/privacy" data-link>Privacy</a><a href="/terms" data-link>Terms</a><a href="https://hello-factory.sociobot.in" rel="external">Built by Param Factory <span class="sr-only">(external site)</span></a></div>
      <p class="footer-note">Version 1.0.0 · Scene generated for this game.</p>
    </footer>
    <div class="route-status sr-only" aria-live="polite"></div>
    <div id="offline-status" class="offline-status" hidden role="status">You’re offline. This run still works.</div>`;
}

function demoNotice(): string {
  return `<aside class="demo-banner" aria-label="Demo mode"><strong>Demo — sample data, nothing is saved</strong><span class="demo-actions"><button type="button" data-demo-reset>Reset demo</button><button type="button" data-start-real>Start for real</button></span></aside>`;
}

function homePage(): string {
  return shell(`
    <main id="main" class="host-main">
      <section class="host-intro" aria-labelledby="home-title">
        <div><p class="eyebrow">3–6 players · 3 missions · about 18 minutes</p><h1 id="home-title" tabindex="-1">Coordinate a heist from every phone</h1><ul class="host-facts" aria-label="Game facts"><li>Anonymous rooms</li><li>Free, with no account</li><li>Keyboard fallback</li></ul></div>
        <p>For 3–6 friends or family members in one room, each phone gets one role from a shared room code.</p>
        <div><a class="button secondary" href="/demo" data-link>Try it with sample data</a><form class="host-crew" data-host-crew><label for="host-size">Crew</label><select id="host-size" name="players"><option value="3">3</option><option value="4">4</option><option value="5" selected>5</option><option value="6">6</option></select><button type="submit">Set crew</button></form></div>
      </section>
      <div id="host-game" class="game-mount"></div>
      <section id="how" class="how-section" aria-labelledby="how-title">
        <div class="section-heading"><p class="eyebrow">How it works</p><h2 id="how-title">Coordinate three missions</h2></div>
        <ol class="steps">
          <li><span>01</span><div><h3>Assign the five jobs</h3><p>Smaller crews take two jobs. A sixth player becomes the dispatcher’s wildcard.</p></div></li>
          <li><span>02</span><div><h3>Lock the next move</h3><p>The screen names one job and action. That player locks the matching control for the next 18-second beat.</p></div></li>
          <li><span>03</span><div><h3>Keep pressure below 100</h3><p>Correct moves clear the route. Wrong or late moves raise the alarm.</p></div></li>
        </ol>
      </section>

      <section class="limits-section" aria-labelledby="limits-title">
        <div><p class="eyebrow">Privacy and limits</p><h2 id="limits-title">Your room stays on this browser</h2></div>
        <div class="limits-copy"><p>Couch Crew stores settings and an unfinished host run in local storage.</p><p>Room codes are anonymous. It has no accounts, chat, ads, or payment.</p></div>
      </section>
    </main>`);
}

function demoPage(): string {
  return shell(`
    <main id="main" class="demo-main">
      <div class="demo-heading"><p class="eyebrow">Live sample mission</p><h1 tabindex="-1">Finish a sample heist together</h1><p>Press the called role and action. The sample starts partway through mission one.</p></div>
      <div id="demo-game" class="game-mount"></div>
    </main>`, true);
}

function controllerPage(): string {
  const code = new URLSearchParams(location.search).get('room')?.replace(/[^a-z0-9]/gi, '').slice(0, 4).toUpperCase() ?? '';
  return shell(`<main id="main" class="controller-main">
    <section class="controller-join cut-panel" data-controller-join>
      <p class="eyebrow">Phone controller</p><h1 tabindex="-1">Join a Couch Crew room</h1>
      <p>Enter the four-letter code on the shared game screen.</p>
      <form data-join-form><label for="room-code">Room code</label><input id="room-code" name="room" value="${escapeHtml(code)}" autocomplete="off" autocapitalize="characters" maxlength="4" pattern="[A-Za-z0-9]{4}" required><button class="button primary" type="submit">Join room</button></form>
      <p data-controller-status role="status" aria-live="polite"></p>
    </section><div id="controller-game"></div>
  </main>`);
}

function privacyPage(): string {
  return shell(`<main id="main" class="text-page"><p class="eyebrow">Privacy</p><h1 tabindex="-1">See what stays in your browser</h1><p>Couch Crew does not ask for a name, email address, or account.</p><h2>Data stored here</h2><p>The host game stores sound, motion, assist settings, and an unfinished run in local storage. Demo mode does not write game data.</p><h2>Room signals</h2><p>Phone room codes and button presses travel only to Couch Crew’s own room service. Real play loads no analytics, advertising, or third-party scripts.</p><h2>Delete your data</h2><p>Clear this site’s browser storage to remove settings and progress. A completed or lost run removes its recovery save.</p><p>Last updated: September 2, 2026.</p></main>`);
}

function termsPage(): string {
  return shell(`<main id="main" class="text-page"><p class="eyebrow">Terms</p><h1 tabindex="-1">Play Couch Crew fairly</h1><p>Couch Crew is free to play. It is provided without a promise that every device will work.</p><h2>Use</h2><p>You may play, share, study, and modify the game under its MIT license. Do not use the site to harm others or disrupt the service.</p><h2>Availability</h2><p>The game may change or stop. Save data can disappear when browser storage is cleared.</p><h2>Responsibility</h2><p>Pause if the game distracts anyone from their surroundings. Players are responsible for their own devices.</p><p>Last updated: September 2, 2026.</p></main>`);
}

function notFoundPage(): string {
  return shell(`<main id="main" class="not-found"><p class="error-code">404</p><h1 tabindex="-1">This route left the map</h1><p>The page does not exist. Return to the crew screen and start a room.</p><a class="button primary" href="/" data-link>Return to Couch Crew</a></main>`);
}

function routeName(path: string): { title: string; description: string } {
  const routes: Record<string, { title: string; description: string }> = {
    '/': { title: 'Couch Crew — phone-controlled heist for friends', description: 'Play a three-mission cooperative heist. Friends join one anonymous room and control different roles from their phones.' },
    '/demo': { title: 'Demo — Couch Crew', description: 'Try a live Couch Crew mission with a sample five-player crew.' },
    '/controller': { title: 'Controller — Couch Crew', description: 'Join an anonymous Couch Crew room from your phone.' },
    '/privacy': { title: 'Privacy — Couch Crew', description: 'See what Couch Crew stores in your browser and how to remove it.' },
    '/terms': { title: 'Terms — Couch Crew', description: 'Read the terms for playing and sharing Couch Crew.' },
  };
  return routes[path] ?? { title: 'Page not found — Couch Crew', description: 'Return to Couch Crew and start a cooperative heist.' };
}

function renderRoute(focus = false): void {
  stopCurrentGame();
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  const meta = routeName(path);
  document.title = meta.title;
  document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute('content', meta.description);
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', `https://couch-crew.sociobot.in${path}`);

  if (path === '/') app.innerHTML = homePage();
  else if (path === '/demo') app.innerHTML = demoPage();
  else if (path === '/controller') app.innerHTML = controllerPage();
  else if (path === '/privacy') app.innerHTML = privacyPage();
  else if (path === '/terms') app.innerHTML = termsPage();
  else app.innerHTML = notFoundPage();

  bindRouteEvents();
  updateOnlineState();
  if (path === '/demo') {
    game = createGame(5, { seed: 20260902, demo: true, active: true });
    game.calmMode = settings.calm;
    mountGame(document.querySelector<HTMLElement>('#demo-game')!);
  }
  if (path === '/') {
    const saved = loadJson<GameState | null>(RUN_KEY, null);
    game = saved && ['active', 'briefing'].includes(saved.phase) ? saved : createGame(5, { active: true });
    game.calmMode = settings.calm;
    mountGame(document.querySelector<HTMLElement>('#host-game')!);
    createHostRoom(game.playerCount);
  }
  if (focus) {
    window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
    const heading = document.querySelector<HTMLElement>('h1');
    heading?.focus({ preventScroll: true });
    const live = document.querySelector<HTMLElement>('.route-status');
    if (live && heading) live.textContent = heading.textContent;
  }
}

function bindRouteEvents(): void {
  document.querySelector<HTMLFormElement>('[data-host-crew]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const count = Number(new FormData(event.currentTarget as HTMLFormElement).get('players'));
    if (!game || count === game.playerCount) return;
    closeRealtime();
    game = createGame(count, { active: true });
    game.calmMode = settings.calm;
    mountGame(document.querySelector<HTMLElement>('#host-game')!);
    createHostRoom(count);
  });
  document.querySelector<HTMLElement>('[data-demo-reset]')?.addEventListener('click', () => {
    game = createGame(5, { seed: 20260902, demo: true, active: true });
    mountGame(document.querySelector<HTMLElement>('#demo-game')!);
  });
  document.querySelector<HTMLElement>('[data-start-real]')?.addEventListener('click', () => {
    navigate('/');
    window.setTimeout(() => document.querySelector<HTMLElement>('[data-start-mission]')?.focus(), 0);
  });
  document.querySelector<HTMLFormElement>('[data-join-form]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const code = String(new FormData(form).get('room') ?? '').replace(/[^a-z0-9]/gi, '').toUpperCase();
    if (code.length !== 4) {
      setControllerStatus('Enter the four-letter room code.');
      return;
    }
    joinController(code);
  });
}

function navigate(path: string): void {
  history.pushState({}, '', path);
  renderRoute(true);
}

function stopCurrentGame(): void {
  closeRealtime();
  if (game && !game.demo) persistRun();
  game = null;
  gameHost = null;
  lastPromptSerial = -1;
  lastPhase = '';
}

function mountGame(host: HTMLElement): void {
  if (!game) return;
  gameHost = host;
  lastPromptSerial = -1;
  lastPhase = '';
  host.innerHTML = gameMarkup(game);
  host.removeEventListener('click', handleGameClick);
  host.addEventListener('click', handleGameClick);
  updateGameDom(true);
  persistRun();
}

function gameMarkup(state: GameState): string {
  const mission = missions[state.missionIndex];
  return `<section class="game-console cut-panel ${state.demo ? 'is-demo' : ''}" aria-label="Shared heist command screen">
    <div data-game-content>
    <div class="game-toolbar">
      <div><span class="status-label">ROOM</span><strong class="room-code" data-room-code>${escapeHtml(state.code)}</strong><small class="room-status" data-room-status>Connecting phones…</small></div>
      <div class="toolbar-actions">
        <button type="button" data-pause aria-pressed="false">Pause</button>
        <button type="button" data-mute aria-pressed="${settings.muted}">${settings.muted ? 'Sound off' : 'Sound on'}</button>
      </div>
    </div>
    <div class="mission-bar">
      <div><span class="status-label">MISSION <b data-mission-number>${state.missionIndex + 1}</b> / 3</span><strong data-mission-name>${mission.name}</strong></div>
      <div class="meters">
        <label>Route <span data-route-text>${state.missionProgress} / ${mission.target}</span><progress data-route max="${mission.target}" value="${state.missionProgress}"></progress></label>
        <label>Pressure <span data-pressure-text>${Math.round(state.pressure)}%</span><progress class="pressure" data-pressure max="100" value="${state.pressure}"></progress></label>
      </div>
    </div>
    <div class="command-call" aria-live="assertive" aria-atomic="true">
      <span>NEXT MOVE</span><strong data-call-role>—</strong><b data-call-action>—</b><small data-call-time>—</small>
    </div>
    <div class="role-grid" aria-label="Crew controls">
      ${roles.map((role, roleIndex) => `<section class="role-strip role-${role.color}" data-role="${roleIndex}" aria-labelledby="role-${role.id}">
        <div class="role-name"><span class="role-pip" aria-hidden="true"></span><div><h2 id="role-${role.id}">${role.name}</h2><small>${assignmentFor(state.playerCount, roleIndex)}</small></div></div>
        <div class="role-actions">${role.actions.map((action, actionIndex) => `<button type="button" data-game-action="${roleIndex}:${actionIndex}"><kbd>${role.keys[actionIndex]}</kbd><span>${action}</span></button>`).join('')}</div>
      </section>`).join('')}
    </div>
    <div class="game-settings" aria-label="Game settings">
      <label><input type="checkbox" data-calm ${state.calmMode ? 'checked' : ''}> Calm pressure</label>
      <label><input type="checkbox" data-shake ${settings.shake ? 'checked' : ''}> Screen nudge</label>
      <span>Keys 1–0 match the controls. Press P to pause.</span>
    </div>
    ${state.demo ? '' : `<p class="controller-link">Phones: <a data-controller-url href="/controller">Opening room…</a></p>`}
    <p class="game-message" data-game-message aria-live="polite"></p>
    </div>
    <div class="game-overlay" data-overlay hidden></div>
  </section>`;
}

function createHostRoom(playerCount: number): void {
  if (!game || game.demo) return;
  setRoomStatus('Connecting phones…');
  try {
    realtime = new WebSocket(REALTIME_URL);
  } catch {
    setRoomStatus('Phone link unavailable. Keyboard controls still work.');
    return;
  }
  realtime.addEventListener('open', () => sendSignal({ type: 'create', playerCount }));
  realtime.addEventListener('message', (event) => {
    const message = parseSignal(event.data);
    if (!message || !game) return;
    if (message.type === 'room-created') {
      const code = String(message.code);
      game.code = code;
      setText('[data-room-code]', code);
      setText('[data-controller-url]', `${location.host}/controller?room=${code}`);
      gameHost?.querySelector<HTMLAnchorElement>('[data-controller-url]')?.setAttribute('href', `/controller?room=${code}`);
      publishSnapshot();
    } else if (message.type === 'room-state') {
      const connected = (message.connectedPlayers as number[]).length;
      setRoomStatus(`${connected} of ${message.playerCount} phones joined · couch-crew.sociobot.in/controller`);
    } else if (message.type === 'controller-action') {
      act(Number(message.roleIndex), Number(message.actionIndex));
    } else if (message.type === 'error') {
      setRoomStatus(String(message.message));
    }
  });
  realtime.addEventListener('close', () => {
    if (game && !game.demo) setRoomStatus('Phone link ended. Keyboard controls still work.');
  });
}

function joinController(code: string): void {
  closeRealtime();
  setControllerStatus('Joining room…');
  try { realtime = new WebSocket(REALTIME_URL); } catch { setControllerStatus('The phone link is unavailable. Try again.'); return; }
  realtime.addEventListener('open', () => sendSignal({ type: 'join', code }));
  realtime.addEventListener('message', (event) => {
    const message = parseSignal(event.data);
    if (!message) return;
    if (message.type === 'joined') {
      const roomCode = String(message.code);
      controller = { code: roomCode, playerId: Number(message.playerId), roleIndexes: message.roleIndexes as number[], snapshot: null };
      setControllerStatus(`Joined room ${roomCode}. Your controls are ready.`);
      renderController();
    } else if (message.type === 'snapshot' && controller) {
      controller.snapshot = message.snapshot as GameState;
      renderController();
    } else if (message.type === 'room-closed') {
      setControllerStatus(String(message.reason));
      controller = null;
      document.querySelector<HTMLElement>('#controller-game')!.innerHTML = '';
    } else if (message.type === 'error') setControllerStatus(String(message.message));
  });
  realtime.addEventListener('close', () => {
    if (controller) setControllerStatus('The phone link closed. Join the room again.');
  });
}

function renderController(): void {
  const target = document.querySelector<HTMLElement>('#controller-game');
  if (!target || !controller) return;
  const snapshot = controller.snapshot;
  const call = snapshot ? roles[snapshot.prompt.roleIndex] : null;
  target.innerHTML = `<section class="phone-console cut-panel" aria-label="Phone controller">
    <p class="eyebrow">Room ${escapeHtml(controller.code)} · player ${controller.playerId}</p>
    <h2>Your phone controls</h2>
    <p class="phone-call" aria-live="polite">${call ? `Next: ${call.name} — ${call.actions[snapshot!.prompt.actionIndex]}` : 'Waiting for the host game.'}</p>
    <div class="phone-roles">${controller.roleIndexes.map((roleIndex) => {
      const role = roles[roleIndex];
      const active = snapshot?.phase === 'active' && snapshot.prompt.roleIndex === roleIndex;
      return `<section class="phone-role role-${role.color} ${active ? 'is-called' : ''}"><h3>${role.name}</h3><div>${role.actions.map((action, actionIndex) => `<button type="button" data-phone-action="${roleIndex}:${actionIndex}" ${snapshot?.phase !== 'active' || snapshot.answerLocked ? 'disabled' : ''}>${action}</button>`).join('')}</div></section>`;
    }).join('')}</div>
  </section>`;
  target.querySelectorAll<HTMLButtonElement>('[data-phone-action]').forEach((button) => button.addEventListener('click', () => {
    const [roleIndex, actionIndex] = button.dataset.phoneAction!.split(':').map(Number);
    sendSignal({ type: 'action', roleIndex, actionIndex });
  }));
}

function parseSignal(raw: unknown): Record<string, unknown> | null {
  try { return JSON.parse(String(raw)) as Record<string, unknown>; } catch { return null; }
}

function sendSignal(message: Record<string, unknown>): void {
  if (realtime?.readyState === WebSocket.OPEN) realtime.send(JSON.stringify(message));
}

function publishSnapshot(): void {
  if (game && !game.demo) sendSignal({ type: 'snapshot', snapshot: game });
}

function closeRealtime(): void {
  if (realtime) {
    realtime.onclose = null;
    realtime.close();
  }
  realtime = null;
  controller = null;
}

function setRoomStatus(text: string): void {
  const target = gameHost?.querySelector<HTMLElement>('[data-room-status]');
  if (target) target.textContent = text;
}

function setControllerStatus(text: string): void {
  document.querySelector<HTMLElement>('[data-controller-status]')!.textContent = text;
}

function overlayMarkup(state: GameState): string {
  if (state.phase === 'briefing') {
    const mission = missions[state.missionIndex];
    return `<div class="overlay-card" role="dialog" aria-modal="true" aria-labelledby="overlay-title"><p class="eyebrow">Mission ${state.missionIndex + 1} of 3</p><h2 id="overlay-title">${mission.name}</h2><p>${mission.objective}</p><p>${mission.target} correct moves clear this route.</p><button class="button primary" type="button" data-start-mission>Start ${mission.name}</button></div>`;
  }
  if (state.phase === 'won') {
    return `<div class="overlay-card result" role="dialog" aria-modal="true" aria-labelledby="overlay-title"><p class="result-mark" aria-hidden="true">✓</p><h2 id="overlay-title">The crew cleared the route</h2><p>${state.hits} correct moves · ${state.misses} misses · best streak ${state.bestStreak}</p><div><button class="button primary" type="button" data-play-again>Play another run</button><a class="button secondary" href="/" data-link>Return home</a></div></div>`;
  }
  if (state.phase === 'lost') {
    return `<div class="overlay-card result" role="dialog" aria-modal="true" aria-labelledby="overlay-title"><p class="result-mark danger" aria-hidden="true">!</p><h2 id="overlay-title">Pressure reached 100</h2><p>The crew made ${state.hits} correct moves. Call each role before pressing.</p><div><button class="button primary" type="button" data-play-again>Try this run again</button><a class="button secondary" href="/" data-link>Return home</a></div></div>`;
  }
  return '';
}

function handleGameClick(event: Event): void {
  const target = (event.target as HTMLElement).closest<HTMLElement>('button, a');
  if (!target || !game) return;
  if (target.matches('[data-game-action]')) {
    const [roleIndex, actionIndex] = target.dataset.gameAction!.split(':').map(Number);
    act(roleIndex, actionIndex, target);
  } else if (target.matches('[data-start-mission]')) {
    startMission(game);
    playTone(320);
    updateGameDom(true);
    persistRun();
    publishSnapshot();
  } else if (target.matches('[data-pause]')) {
    game.paused = !game.paused;
    updateGameDom(true);
    persistRun();
    publishSnapshot();
  } else if (target.matches('[data-mute]')) {
    settings.muted = !settings.muted;
    saveSettings();
    updateGameDom(true);
    if (!settings.muted) playTone(440);
  } else if (target.matches('[data-play-again]')) {
    const previous = game;
    game = createGame(previous.playerCount, { seed: previous.demo ? 20260902 : undefined, demo: previous.demo, active: previous.demo });
    game.calmMode = previous.calmMode;
    mountGame(gameHost!);
  }
}

function act(roleIndex: number, actionIndex: number, button?: HTMLElement): void {
  if (!game || game.phase !== 'active' || game.paused || game.answerLocked) return;
  const correct = game.prompt.roleIndex === roleIndex && game.prompt.actionIndex === actionIndex;
  dispatchAction(game, roleIndex, actionIndex);
  playTone(correct ? 620 : 150);
  const consoleElement = gameHost?.querySelector<HTMLElement>('.game-console');
  if (correct) {
    button?.classList.add('was-correct');
    window.setTimeout(() => button?.classList.remove('was-correct'), 140);
  } else if (settings.shake && !reducedMotion()) {
    consoleElement?.classList.add('nudge');
    window.setTimeout(() => consoleElement?.classList.remove('nudge'), 140);
  }
  const message = correct && game.answerLocked
    ? `Move locked. The next call arrives in ${Math.ceil(Math.max(0, MIN_PROMPT_CADENCE_SECONDS - game.promptElapsed))} seconds.`
    : correct ? 'Move cleared.' : 'Wrong control. Pressure increased.';
  setText('[data-game-message]', message);
  updateGameDom(true);
  persistRun();
  publishSnapshot();
}

function updateGameDom(force = false): void {
  if (!game || !gameHost) return;
  const mission = missions[game.missionIndex];
  const promptRole = roles[game.prompt.roleIndex];
  const promptElapsed = Number.isFinite(game.promptElapsed) ? game.promptElapsed : 0;
  const answerLocked = game.answerLocked === true;
  setText('[data-mission-number]', String(game.missionIndex + 1));
  setText('[data-mission-name]', mission.name);
  setText('[data-route-text]', `${game.missionProgress} / ${mission.target}`);
  setText('[data-pressure-text]', `${Math.round(game.pressure)}%`);
  setValue('[data-route]', game.missionProgress, mission.target);
  setValue('[data-pressure]', game.pressure, 100);
  setText('[data-call-time]', game.phase === 'active'
    ? answerLocked
      ? `Move locked · next call in ${Math.ceil(Math.max(0, MIN_PROMPT_CADENCE_SECONDS - promptElapsed))} seconds`
      : `${Math.max(0, Math.ceil(game.promptTime))} seconds to lock`
    : 'Waiting');
  gameHost.querySelectorAll<HTMLButtonElement>('[data-game-action]').forEach((button) => { button.disabled = answerLocked; });

  if (force || lastPromptSerial !== game.prompt.serial) {
    setText('[data-call-role]', promptRole.name);
    setText('[data-call-action]', promptRole.actions[game.prompt.actionIndex]);
    gameHost.querySelectorAll('[data-role]').forEach((element) => element.classList.remove('is-called'));
    gameHost.querySelector(`[data-role="${game.prompt.roleIndex}"]`)?.classList.add('is-called');
    lastPromptSerial = game.prompt.serial;
  }

  const pauseButton = gameHost.querySelector<HTMLButtonElement>('[data-pause]');
  if (pauseButton) {
    pauseButton.textContent = game.paused ? 'Resume' : 'Pause';
    pauseButton.setAttribute('aria-pressed', String(game.paused));
  }
  const muteButton = gameHost.querySelector<HTMLButtonElement>('[data-mute]');
  if (muteButton) {
    muteButton.textContent = settings.muted ? 'Sound off' : 'Sound on';
    muteButton.setAttribute('aria-pressed', String(settings.muted));
  }
  const overlay = gameHost.querySelector<HTMLElement>('[data-overlay]');
  const showOverlay = game.phase !== 'active' || game.paused;
  if (overlay) {
    overlay.hidden = !showOverlay;
    if (game.paused) overlay.innerHTML = `<div class="overlay-card" role="dialog" aria-modal="true" aria-labelledby="overlay-title"><p class="eyebrow">Run paused</p><h2 id="overlay-title">The crew is waiting</h2><p>Your route is saved in this browser.</p><button class="button primary" type="button" data-pause>Resume this run</button></div>`;
    else if (force || lastPhase !== game.phase) overlay.innerHTML = overlayMarkup(game);
    setOverlayInteractivity(showOverlay, overlay, force || lastPhase !== game.phase);
  }
  if ((game.phase === 'won' || game.phase === 'lost') && lastPhase !== game.phase) finishRun(game);
  lastPhase = game.phase;
}

function setOverlayInteractivity(showOverlay: boolean, overlay: HTMLElement, changed: boolean): void {
  const controls = app.querySelectorAll<HTMLElement>('a, button, input, select, textarea');
  controls.forEach((control) => {
    if (!overlay.contains(control)) control.inert = showOverlay;
  });
  if (showOverlay && changed) {
    const active = document.activeElement;
    if (active instanceof HTMLElement && !overlay.contains(active)) returnFocus = active;
    window.setTimeout(() => overlay.querySelector<HTMLElement>('button, a')?.focus(), 0);
  }
  if (!showOverlay && changed) {
    const target = returnFocus;
    returnFocus = null;
    if (target?.isConnected) window.setTimeout(() => target.focus(), 0);
  }
}

function finishRun(state: GameState): void {
  if (state.demo) return;
  const progress = loadJson(PROGRESS_KEY, { runs: 0, wins: 0, bestStreak: 0 });
  progress.runs += 1;
  if (state.phase === 'won') progress.wins += 1;
  progress.bestStreak = Math.max(progress.bestStreak, state.bestStreak);
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  localStorage.removeItem(RUN_KEY);
}

function setText(selector: string, text: string): void {
  const element = gameHost?.querySelector<HTMLElement>(selector);
  if (element && element.textContent !== text) element.textContent = text;
}

function setValue(selector: string, value: number, max: number): void {
  const element = gameHost?.querySelector<HTMLProgressElement>(selector);
  if (element) {
    element.max = max;
    element.value = value;
  }
}

function playTone(frequency: number): void {
  if (settings.muted) return;
  try {
    audioContext ??= new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = 'square';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.025, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.08);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.08);
  } catch {
    // Sound is optional when a browser blocks audio output.
  }
}

function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function escapeHtml(value: string): string {
  const node = document.createElement('span');
  node.textContent = value;
  return node.innerHTML;
}

function updateOnlineState(): void {
  const status = document.querySelector<HTMLElement>('#offline-status');
  if (status) status.hidden = navigator.onLine;
}

document.addEventListener('click', (event) => {
  const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[data-link]');
  if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || link.origin !== location.origin) return;
  event.preventDefault();
  navigate(link.pathname);
});

document.addEventListener('change', (event) => {
  const target = event.target as HTMLInputElement;
  if (!game) return;
  if (target.matches('[data-calm]')) {
    game.calmMode = target.checked;
    settings.calm = target.checked;
    saveSettings();
    persistRun();
  }
  if (target.matches('[data-shake]')) {
    settings.shake = target.checked;
    saveSettings();
  }
});

window.addEventListener('keydown', (event) => {
  if (!game || (event.target as HTMLElement).matches('input, select, textarea')) return;
  const keyIndex = roles.flatMap((role) => [...role.keys]).findIndex((key) => key === event.key);
  if (keyIndex >= 0) {
    event.preventDefault();
    act(Math.floor(keyIndex / 2), keyIndex % 2, gameHost?.querySelector(`[data-game-action="${Math.floor(keyIndex / 2)}:${keyIndex % 2}"]`) ?? undefined);
  } else if (event.key.toLowerCase() === 'p' && game.phase === 'active') {
    event.preventDefault();
    game.paused = !game.paused;
    updateGameDom(true);
    publishSnapshot();
  }
});

window.addEventListener('popstate', () => renderRoute(true));
window.addEventListener('online', updateOnlineState);
window.addEventListener('offline', updateOnlineState);
document.addEventListener('visibilitychange', () => { lastFrame = performance.now(); accumulator = 0; });

function frame(now: number): void {
  const delta = Math.min(0.25, (now - lastFrame) / 1000);
  lastFrame = now;
  if (!document.hidden && game?.phase === 'active' && !game.paused) {
    accumulator += delta;
    while (accumulator >= STEP) {
      const previousPrompt = game.prompt.serial;
      const previousPhase: GameState['phase'] = game.phase;
      tickGame(game, STEP);
      accumulator -= STEP;
      if (game.prompt.serial !== previousPrompt || game.phase !== previousPhase) publishSnapshot();
    }
    updateGameDom();
    const second = Math.floor(game.elapsed);
    if (second !== lastSavedSecond && second % 2 === 0) {
      persistRun();
      lastSavedSecond = second;
    }
  }
  requestAnimationFrame(frame);
}

renderRoute();
requestAnimationFrame(frame);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined));
}
