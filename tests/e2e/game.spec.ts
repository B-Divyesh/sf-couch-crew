import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function pressCorrect(page: Page): Promise<void> {
  const action = (await page.locator('[data-call-action]').textContent())?.trim() ?? '';
  await page.locator('.role-strip.is-called').getByRole('button', { name: new RegExp(action, 'i') }).click();
}

async function finishRun(page: Page): Promise<void> {
  for (let move = 0; move < 60; move += 1) {
    if (await page.getByRole('heading', { name: 'The crew cleared the route' }).isVisible().catch(() => false)) return;
    const nextMission = page.locator('[data-start-mission]');
    if (await nextMission.isVisible().catch(() => false)) await nextMission.click();
    else await pressCorrect(page);
  }
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
  while (!await page.getByRole('heading', { name: 'Pressure reached 100' }).isVisible().catch(() => false)) {
    const wrongRole = page.locator('.role-strip:not(.is-called)').first();
    await wrongRole.getByRole('button').first().click();
  }
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
  await page.reload();
  await expect(page.getByLabel('Calm pressure')).toBeChecked();
});

test('a phone joins an anonymous room and receives only its role controls @claim:phone-controllers', async ({ browser, baseURL }) => {
  const hostContext = await browser.newContext();
  const phoneContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const host = await hostContext.newPage();
  const phone = await phoneContext.newPage();
  await host.goto(baseURL!);
  await expect(host.locator('[data-controller-url]')).toContainText('/controller?room=');
  const code = (await host.locator('[data-room-code]').textContent())!.trim();
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
