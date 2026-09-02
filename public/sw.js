const CACHE = 'couch-crew-v2';
const SHELL = [
  '/',
  '/index.html',
  '/demo',
  '/favicon.svg',
  '/apple-touch-icon.png',
  '/art/couch-crew-night-road-640.webp',
  '/art/couch-crew-night-road-1280.webp',
  '/art/couch-crew-social.webp'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then(async (cache) => {
    await cache.addAll(SHELL);
    const indexResponse = await fetch('/index.html');
    const indexText = await indexResponse.clone().text();
    const builtAssets = [...indexText.matchAll(/\/assets\/[^"'<> ]+/g)].map((match) => match[0]);
    await cache.put('/index.html', indexResponse);
    await cache.addAll([...new Set(builtAssets)]);
  }).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put('/index.html', copy));
      return response;
    }).catch(() => caches.match('/index.html')));
    return;
  }
  const cacheKey = new URL(event.request.url).pathname;
  event.respondWith(caches.match(cacheKey).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok) caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()));
    return response;
  })));
});
