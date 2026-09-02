import { describe, expect, it } from 'vitest';
import { STEP, TICK_RATE, createGame, dispatchAction, missions, promptFor, startMission, tickGame, totalPrompts } from '../src/core';

describe('deterministic game core', () => {
  it('returns the same prompt sequence for one seed', () => {
    const first = Array.from({ length: 10 }, (_, serial) => promptFor(42, serial));
    expect(first).toEqual(Array.from({ length: 10 }, (_, serial) => promptFor(42, serial)));
    expect(first).not.toEqual(Array.from({ length: 10 }, (_, serial) => promptFor(43, serial)));
  });

  it('plays all three missions to a win', () => {
    const game = createGame(5, { seed: 77 });
    let actions = 0;
    while (game.phase !== 'won' && actions < 100) {
      if (game.phase === 'briefing') startMission(game);
      dispatchAction(game, game.prompt.roleIndex, game.prompt.actionIndex);
      actions += 1;
    }
    expect(game.phase).toBe('won');
    expect(actions).toBe(totalPrompts());
    expect(game.missionIndex).toBe(missions.length - 1);
  });

  it('sets an 18-minute session target @claim:session-length', () => {
    const promptAllowance = missions.reduce((seconds, mission) => seconds + mission.target * mission.promptSeconds, 0);
    expect(promptAllowance).toBeGreaterThanOrEqual(17 * 60);
    expect(promptAllowance).toBeLessThanOrEqual(18 * 60);
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
