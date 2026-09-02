import { expect, test } from '@playwright/test';

test('the live game renders at 60 frames per second on a 390 px screen @claim:rendered-frame-rate', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/demo');
  await expect(page.locator('.game-console')).toBeVisible();
  await expect(page.locator('[data-call-time]')).toContainText('seconds');

  const samples = await page.evaluate(async () => {
    const collect = (frameCount: number) => new Promise<number>((resolve) => {
      let first = 0;
      let last = 0;
      let frames = 0;
      const sample = (time: number) => {
        if (!first) first = time;
        last = time;
        frames += 1;
        if (frames === frameCount) resolve((frames - 1) * 1000 / (last - first));
        else requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });

    await collect(30);
    const readings: number[] = [];
    for (let sample = 0; sample < 5; sample += 1) readings.push(await collect(60));
    return readings;
  });

  const ordered = [...samples].sort((left, right) => left - right);
  const medianFramesPerSecond = ordered[Math.floor(ordered.length / 2)];
  console.log(`390 px frame samples: ${samples.map((value) => value.toFixed(2)).join(', ')}; median ${medianFramesPerSecond.toFixed(2)} fps`);
  expect(medianFramesPerSecond, `frame samples: ${samples.map((value) => value.toFixed(2)).join(', ')}`).toBeGreaterThanOrEqual(50);
  expect(medianFramesPerSecond).toBeLessThanOrEqual(65);
});
