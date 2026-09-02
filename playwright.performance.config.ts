import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/performance.spec.ts',
  timeout: 45_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer: [
    { command: 'COUCH_CREW_TEST_MODE=1 npm run realtime', url: 'http://127.0.0.1:8787/health', reuseExistingServer: true, timeout: 120_000 },
    { command: 'npm run build && npm run preview -- --port 4173', url: 'http://127.0.0.1:4173', reuseExistingServer: true, timeout: 120_000 },
  ],
});
