const CACHE = 'wandering-art-v10';

// Externe dependency: anime.js v4 (breach/deurkamer-module).
// Wordt geprecachet zodat de PWA ook offline volledig werkt.
const ANIME_JS = 'https://cdn.jsdelivr.net/npm/animejs@4/dist/bundles/anime.umd.min.js';

const PRECACHE = [
  '/Wandering-Art/',
  '/Wandering-Art/index.html',
  '/Wandering-Art/manifest.json',
  '/Wandering-Art/icon-192.png',
  '/Wandering-Art/icon-512.png',
  ANIME_JS
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Alleen eigen origin + de anime.js CDN-URL afhandelen.
  // Live-data (weer, NOS, GDELT) blijft buiten de cache — die moet vers zijn.
  const isOwn = url.origin === self.location.origin;
  const isAnime = e.request.url === ANIME_JS;
  if (!isOwn && !isAnime) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        // 'basic' = same-origin, 'cors' = CORS-enabled CDN-response (jsdelivr)
        if (res.ok && (res.type === 'basic' || res.type === 'cors')) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
