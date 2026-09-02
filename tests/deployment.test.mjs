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
});

test('the controller is discoverable in the public sitemap', async () => {
  const sitemap = await readFile(new URL('../public/sitemap.xml', import.meta.url), 'utf8');
  assert.match(sitemap, /https:\/\/couch-crew\.sociobot\.in\/controller/);
});
