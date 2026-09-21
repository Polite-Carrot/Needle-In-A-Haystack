/* Needle in a Haystack — offline shell.
   Everything the game needs is static and small, so the whole thing is
   precached on install. Bump CACHE when the shell changes. */
const CACHE = 'niah-shell-v2';

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './vendor/three.min.js',
  './js/audio.js',
  './js/haptics.js',
  './js/world.js',
  './js/cosmetics.js',
  './js/player.js',
  './js/helpers.js',
  './js/wardrobe.js',
  './js/ui.js',
  './js/game.js',
  './assets/polite-carrot-logo.svg',
  './assets/polite-carrot-name.svg',
  './assets/icon.svg',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-180.png',
  './assets/icon-maskable-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    // one miss must not fail the whole install, so they go in one at a time
    caches.open(CACHE)
      .then((c) => Promise.all(SHELL.map((url) => c.add(url).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // a page load wants the freshest build, but must still work on a train
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html').then((r) => r || caches.match('./')))
    );
    return;
  }

  // everything else: serve from the cache at once, refresh it in the background
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req).then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
