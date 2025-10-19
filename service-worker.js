/* Flow On — Service Worker (PWA) */
const CACHE_NAME = 'flowon-cache-v1';
const ASSETS = [
  '/', '/index.html',
  '/assets/css/style.css',
  '/assets/js/app.js',
  '/assets/img/logo.svg',
  '/manifest.webmanifest'
];

// Instalação: pré-cache básico
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS).catch(()=>null))
  );
});

// Ativação: limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    ).then(() => self.clients.claim())
  );
});

// Estratégia: 
// - Assets: cache-first
// - Páginas/HTML: network-first com fallback do cache
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // só controla requisições GET
  if (req.method !== 'GET') return;

  // HTML → network-first
  if (req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, resClone));
          return res;
        })
        .catch(() => caches.match(req).then((c) => c || caches.match('/index.html')))
    );
    return;
  }

  // Demais (CSS, JS, IMG) → cache-first
  event.respondWith(
    caches.match(req).then((cached) =>
      cached ||
      fetch(req).then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(req, resClone));
        return res;
      }).catch(() => cached)
    )
  );
});
