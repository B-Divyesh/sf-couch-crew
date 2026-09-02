import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function pressCorrect(page: Page): Promise<void> {
  const action = (await page.locator('[data-call-action]').textContent())?.trim() ?? '';
  await page.locator('.role-strip.is-called').getByRole('button', { name: new RegExp(action, 'i') }).click();
}

async function finishRun(page: Page): Promise<void> {
  await page.evaluate(() => {
    for (let move = 0; move < 60; move += 1) {
      if (document.querySelector('[data-overlay] h2')?.textContent?.includes('The crew cleared the route')) return;
      const start = document.querySelector<HTMLButtonElement>('[data-start-mission]');
      if (start) { start.click(); continue; }
      const action = document.querySelector<HTMLElement>('[data-call-action]')?.textContent?.trim();
      const button = [...document.querySelectorAll<HTMLButtonElement>('.role-strip.is-called [data-game-action]')]
        .find((candidate) => candidate.textContent?.includes(action ?? ''));
      if (!button) throw new Error('The called control was not rendered.');
      button.click();
    }
    throw new Error('The scripted run did not reach the win screen.');
  });
}

async function loseRun(page: Page): Promise<void> {
  await page.evaluate(() => {
    for (let move = 0; move < 20; move += 1) {
      if (document.querySelector('[data-overlay] h2')?.textContent?.includes('Pressure reached 100')) return;
      const button = document.querySelector<HTMLButtonElement>('.role-strip:not(.is-called) [data-game-action]');
      if (!button) throw new Error('A wrong control was not rendered.');
      button.click();
    }
    throw new Error('The scripted loss did not reach the result screen.');
  });
}

test('a sample run reaches the end screen @claim:complete-run', async ({ page }) => {
  await page.goto('/demo');
  await finishRun(page);
  await expect(page.getByRole('heading', { name: 'The crew cleared the route' })).toBeVisible();
  await expect(page.getByText(/48 correct moves/)).toBeVisible();
});

test('replay resets the sample run @claim:restart-reset', async ({ page }) => {
  await page.goto('/demo');
  const calledRole = await page.locator('[data-call-role]').textContent();
  await loseRun(page);
  await expect(page.getByRole('heading', { name: 'Pressure reached 100' })).toBeVisible();
  await page.getByRole('button', { name: 'Try this run again' }).click();
  await expect(page.locator('[data-route-text]')).toHaveText('4 / 12');
  await expect(page.locator('[data-call-role]')).toHaveText(calledRole ?? '');
  await finishRun(page);
  await expect(page.getByRole('heading', { name: 'The crew cleared the route' })).toBeVisible();
});

test('touch and keyboard both advance the route @claim:touch-keyboard', async ({ page }) => {
  await page.goto('/demo');
  await pressCorrect(page);
  await expect(page.locator('[data-route-text]')).toHaveText('5 / 12');
  const key = (await page.locator('.role-strip.is-called kbd').nth(Number((await page.locator('[data-call-action]').textContent())?.includes('far') || (await page.locator('[data-call-action]').textContent())?.includes('right') || (await page.locator('[data-call-action]').textContent())?.includes('gold') || (await page.locator('[data-call-action]').textContent())?.includes('Lock') || (await page.locator('[data-call-action]').textContent())?.includes('B'))).textContent())?.trim() ?? '';
  await page.keyboard.press(key);
  await expect(page.locator('[data-route-text]')).toHaveText('6 / 12');
});

test('crew setup covers three through six players @claim:crew-size', async ({ page }) => {
  await page.goto('/');
  const expectedAssignments = {
    3: ['Player 1', 'Player 2', 'Player 2', 'Player 1', 'Player 3'],
    4: ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 4'],
    5: ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5'],
    6: ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Players 5 + 6'],
  } as const;
  for (const crewSize of [3, 4, 5, 6] as const) {
    await page.getByLabel('Crew', { exact: true }).selectOption(String(crewSize));
    await page.getByRole('button', { name: 'Set crew' }).click();
    await expect(page.locator('.role-strip')).toHaveCount(5);
    await expect(page.locator('.role-name small')).toHaveText(expectedAssignments[crewSize]);
  }
});

test('settings and unfinished runs persist @claim:settings-persist', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Calm pressure').check();
  await pressCorrect(page);
  await expect(page.locator('[data-call-time]')).toContainText('Move locked');
  await page.reload();
  await expect(page.getByLabel('Calm pressure')).toBeChecked();
  await expect(page.locator('[data-call-time]')).toContainText('Move locked');
});

test('a phone joins an anonymous room and receives only its role controls @claim:phone-controllers', async ({ browser, baseURL }) => {
  const hostContext = await browser.newContext();
  const phoneContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const host = await hostContext.newPage();
  const phone = await phoneContext.newPage();
  await host.goto(baseURL!);
  await expect(host.locator('[data-controller-url]')).toHaveAttribute('href', /\/controller\?room=/);
  const controllerHref = await host.locator('[data-controller-url]').getAttribute('href');
  const code = new URL(controllerHref!, baseURL).searchParams.get('room')!;
  expect(code).toMatch(/^[BCDFGHJKLMNPQRSTVWXYZ23456789]{4}$/);
  await phone.goto(`${baseURL}/controller?room=${code}`);
  await phone.getByRole('button', { name: 'Join room' }).click();
  await expect(phone.getByText(`Joined room ${code}. Your controls are ready.`)).toBeVisible();
  await expect(phone.locator('.phone-role')).toHaveCount(1);
  await expect(host.locator('[data-room-status]')).toContainText('1 of 5 phones joined');
  await hostContext.close();
  await phoneContext.close();
});

test('demo writes no game data @claim:demo-isolated', async ({ page }) => {
  await page.goto('/demo');
  await pressCorrect(page);
  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(keys.filter((key) => key.startsWith('couch-crew:'))).toEqual([]);
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
});

test('demo makes only same-origin requests @claim:local-privacy', async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const requests: string[] = [];
  const page = await context.newPage();
  page.on('request', (request) => requests.push(request.url()));
  await page.goto(`${baseURL}/demo`);
  await pressCorrect(page);
  expect(requests.length).toBeGreaterThan(0);
  expect(requests.every((url) => new URL(url).origin === new URL(baseURL!).origin)).toBe(true);
  await context.close();
});

test('real play uses only Couch Crew network services @claim:real-local-privacy', async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const requests: string[] = [];
  const sockets: string[] = [];
  const page = await context.newPage();
  page.on('request', (request) => requests.push(request.url()));
  page.on('websocket', (socket) => sockets.push(socket.url()));
  await page.goto(baseURL!);
  await expect(page.locator('[data-room-code]')).not.toHaveText('DEMO');
  expect(requests.every((url) => new URL(url).origin === new URL(baseURL!).origin)).toBe(true);
  await expect.poll(() => sockets.length).toBeGreaterThan(0);
  const expectedSocketOrigin = ['127.0.0.1', 'localhost'].includes(new URL(baseURL!).hostname)
    ? 'ws://127.0.0.1:8787'
    : 'wss://sf-couch-crew-realtime.sociobot.in';
  expect(sockets.every((url) => new URL(url).origin === expectedSocketOrigin)).toBe(true);
  await context.close();
});

test('demo reloads offline after the first visit @claim:offline-reload', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ serviceWorkers: 'allow' });
  const page = await context.newPage();
  await page.goto(`${baseURL}/demo`);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  const updateState = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    return { controlled: navigator.serviceWorker.controller !== null, waiting: registration.waiting !== null };
  });
  expect(updateState).toEqual({ controlled: true, waiting: false });
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Finish a sample heist together' })).toBeVisible();
  await expect(page.getByText('You’re offline. This run still works.')).toBeVisible();
  await context.close();
});

test('home and demo pass automated accessibility checks', async ({ page }) => {
  for (const path of ['/', '/demo', '/controller', '/privacy', '/terms']) {
    await page.goto(path);
    const results = await new AxeBuilder({ page: page as never }).analyze();
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
    expect(results.violations.filter((violation) => violation.id === 'landmark-unique')).toEqual([]);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
  }
});

test('mobile layout stays inside a 390 pixel viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['/', '/demo', '/controller', '/privacy', '/terms']) {
    await page.goto(path);
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `${path} viewport width`).toBeLessThanOrEqual(390);
    const targets = await page.locator('a, button, select, input:not([type="checkbox"]), label:has(input[type="checkbox"])').evaluateAll((elements) => elements
      .filter((element) => {
        const style = getComputedStyle(element);
        const box = element.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && box.width > 0 && box.height > 0;
      })
      .map((element) => {
        const box = element.getBoundingClientRect();
        return { label: element.textContent?.trim() || element.getAttribute('aria-label') || element.tagName, width: box.width, height: box.height };
      }));
    for (const target of targets) {
      expect(target.width, `${path}: ${target.label} width`).toBeGreaterThanOrEqual(44);
      expect(target.height, `${path}: ${target.label} height`).toBeGreaterThanOrEqual(44);
    }
  }
});

test('home route focus returns to its heading', async ({ page }) => {
  await page.goto('/privacy');
  await page.getByRole('link', { name: 'Couch Crew home' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { name: 'Coordinate a heist from every phone' })).toBeFocused();
});

test('the first screen names the room audience and exact sample action', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByText('For 3–6 friends or family members in one room, each phone gets one role from a shared room code.')).toBeVisible();
  const sampleAction = page.getByRole('link', { name: 'Try it with sample data', exact: true });
  await expect(sampleAction).toBeVisible();
  expect((await sampleAction.boundingBox())!.y).toBeLessThan(844);
});

test('completed and lost runs delete their recovery save @claim:recovery-deletion', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    const key = 'couch-crew:v1:run';
    const state = JSON.parse(localStorage.getItem(key)!);
    Object.assign(state, { phase: 'active', missionIndex: 2, missionProgress: 19, hits: 47, pressure: 0, promptElapsed: 17.5, answerLocked: false });
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload();
  await pressCorrect(page);
  await expect(page.getByRole('heading', { name: 'The crew cleared the route' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('couch-crew:v1:run'))).toBeNull();

  await page.goto('/');
  await page.evaluate(() => {
    const key = 'couch-crew:v1:run';
    const state = JSON.parse(localStorage.getItem(key)!);
    Object.assign(state, { phase: 'active', pressure: 99, promptElapsed: 0, answerLocked: false });
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload();
  await page.locator('.role-strip:not(.is-called) [data-game-action]').first().click();
  await expect(page.getByRole('heading', { name: 'Pressure reached 100' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('couch-crew:v1:run'))).toBeNull();
});

test('Couch Crew has no chat @claim:no-chat', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('It has no accounts, chat, ads, or payment.')).toBeVisible();
  await expect(page.locator('textarea, [contenteditable="true"], input[name*="chat" i], input[name*="message" i]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /chat|message|send/i })).toHaveCount(0);
});

test('pause and result overlays take focus and make game controls inert', async ({ page }) => {
  await page.goto('/demo');
  const roleButton = page.locator('[data-game-action]').first();
  await roleButton.focus();
  await page.keyboard.press('p');
  await expect(page.getByRole('dialog', { name: 'The crew is waiting' })).toBeVisible();
  await expect(page.locator('[data-game-action]').first()).toHaveJSProperty('inert', true);
  await expect(page.getByRole('button', { name: 'Resume this run' })).toBeFocused();
  await page.getByRole('button', { name: 'Resume this run' }).click();
  await expect(roleButton).toBeFocused();
  await loseRun(page);
  await expect(page.getByRole('dialog', { name: 'Pressure reached 100' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Try this run again' })).toBeFocused();
});

test('the cold home screen shows the live command deck at desktop and 390 px', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.game-console')).toBeVisible();
  expect(await page.locator('.game-console').boundingBox()).not.toBeNull();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  const deck = await page.locator('.game-console').boundingBox();
  expect(deck).not.toBeNull();
  expect(deck!.y).toBeLessThan(420);
  await expect(page.locator('[data-call-role]')).toBeVisible();
});

test('the site has no sign-in or payment step @claim:free-no-account', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('input[type="password"], input[type="email"]')).toHaveCount(0);
  await expect(page.getByText('Free, with no account')).toBeVisible();
  await expect(page.getByRole('link', { name: /buy|pay|checkout/i })).toHaveCount(0);
});
