import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('static policy rewrites only public SPA routes and preserves a real 404', async () => {
  const config = JSON.parse(await readFile(new URL('../public/staticwebapp.config.json', import.meta.url), 'utf8'));
  assert.equal(config.navigationFallback, undefined);
  for (const route of ['/demo', '/controller', '/privacy', '/terms']) {
    assert.deepEqual(config.routes.find((entry) => entry.route === route), { route, rewrite: '/index.html' });
  }
  assert.deepEqual(config.responseOverrides['404'], { rewrite: '/404.html' });
  assert.match(config.globalHeaders['Content-Security-Policy'], /connect-src 'self' wss:\/\/sf-couch-crew-realtime\.sociobot\.in/);
  assert.match(config.globalHeaders['Content-Security-Policy'], /frame-ancestors 'none'/);
  assert.equal(config.globalHeaders['X-Content-Type-Options'], 'nosniff');
  assert.equal(config.globalHeaders['Referrer-Policy'], 'strict-origin-when-cross-origin');
  assert.match(config.globalHeaders['Permissions-Policy'], /payment=\(\)/);
  assert.equal(config.routes.find((entry) => entry.route === '/assets/*').headers['Cache-Control'], 'public, max-age=31536000, immutable');
});

test('the controller is discoverable in the public sitemap', async () => {
  const sitemap = await readFile(new URL('../public/sitemap.xml', import.meta.url), 'utf8');
  assert.match(sitemap, /https:\/\/couch-crew\.sociobot\.in\/controller/);
});

test('every registered claim has exactly one tagged regression test', async () => {
  const claims = JSON.parse(await readFile(new URL('../.factory/claims.json', import.meta.url), 'utf8'));
  const testSources = await Promise.all([
    './core.test.ts',
    './e2e/game.spec.ts',
    './e2e/performance.spec.ts',
    './realtime.test.mjs',
  ].map((path) => readFile(new URL(path, import.meta.url), 'utf8')));
  const source = testSources.join('\n');
  const ids = claims.map((claim) => claim.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) {
    assert.match(id, /^[a-z0-9-]+$/);
    const matches = source.match(new RegExp(`@claim:${id}\\b`, 'g')) ?? [];
    assert.equal(matches.length, 1, `${id} must have exactly one tagged test`);
    assert.match(claims.find((claim) => claim.id === id).test, /^npm run /);
  }
});
