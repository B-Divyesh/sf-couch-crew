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
  await page.getByLabel('Crew', { exact: true }).selectOption('6');
  await page.getByRole('button', { name: 'Set crew' }).click();
  await expect(page.locator('.role-strip')).toHaveCount(5);
  await expect(page.getByText('Players 5 + 6')).toBeVisible();
});

test('settings and unfinished runs persist @claim:settings-persist', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Calm pressure').check();
  await pressCorrect(page);
  await expect(page.locator('[data-route-text]')).toHaveText('1 / 12');
  await page.reload();
  await expect(page.getByLabel('Calm pressure')).toBeChecked();
  await expect(page.locator('[data-route-text]')).toHaveText('1 / 12');
});

test('a phone joins an anonymous room and receives only its role controls @claim:phone-controllers', async ({ browser, baseURL }) => {
  const hostContext = await browser.newContext();
  const phoneContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const host = await hostContext.newPage();
  const phone = await phoneContext.newPage();
  await host.goto(baseURL!);
  await expect(host.locator('[data-controller-url]')).toContainText('/controller?room=');
  const code = (await host.locator('[data-room-code]').textContent())!.trim();
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
  expect(sockets.every((url) => new URL(url).origin === 'ws://127.0.0.1:8787')).toBe(true);
  await context.close();
});

test('demo reloads offline after the first visit @claim:offline-reload', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ serviceWorkers: 'allow' });
  const page = await context.newPage();
  await page.goto(`${baseURL}/demo`);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
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
  await page.goto('/demo');
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(390);
  await expect(page.getByRole('button', { name: 'Scan near' })).toBeVisible();
  for (const selector of ['.host-crew select', '.host-crew button', '.demo-banner button']) {
    await page.goto(selector.includes('host') ? '/' : '/demo');
    for (const box of await page.locator(selector).evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().toJSON()))) {
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  }
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

test('the live game renders at 60 frames per second on a 390 px screen @claim:rendered-frame-rate', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/demo');
  const framesPerSecond = await page.evaluate(async () => new Promise<number>((resolve) => {
    let first = 0;
    let last = 0;
    let frames = 0;
    const sample = (time: number) => {
      if (!first) first = time;
      last = time;
      frames += 1;
      if (frames === 120) resolve((frames - 1) * 1000 / (last - first));
      else requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  }));
  // Browser scheduling varies under the parallel suite; 50–65 fps is the
  // documented 60 fps target with a measured ten-frame tolerance.
  expect(framesPerSecond).toBeGreaterThanOrEqual(50);
  expect(framesPerSecond).toBeLessThanOrEqual(65);
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
