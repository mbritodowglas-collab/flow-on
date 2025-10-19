/* Flow On — SW minimalista e seguro para evitar dessincronização */
const VERSION = 'v3'; // aumente quando atualizar o SW
const STATIC_CACHE = `flowon-static-${VERSION}`;

/* Cache apenas ícones/imagens estáticas leves.
   NÃO cacheamos HTML. JS e CSS serão network-first. */
const PRECACHE_URLS = [
  // coloque apenas arquivos que quase nunca mudam
  '/assets/img/icons/icon-192.png',
  '/assets/img/icons/icon-512.png',
  '/assets/img/favicon-32.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== STATIC_CACHE ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

/* Estratégias:
   - Navegação (HTML): SEMPRE network-first (para pegar o index/ páginas mais novas).
   - JS e CSS: network-first (para evitar rodar lógica antiga).
   - Imagens/ícones: cache-first (rápido e seguro).
*/
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Só controla requisições do mesmo escopo
  if (url.origin !== location.origin) return;

  // Navegação (HTML)
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // JS e CSS -> Network-first
  if (req.destination === 'script' || req.destination === 'style') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(STATIC_CACHE).then((c) => c.put(req, resClone));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Imagens/ícones -> Cache-first
  if (req.destination === 'image' || req.destination === 'icon') {
    event.respondWith(
      caches.match(req).then((cached) =>
        cached ||
        fetch(req).then((res) => {
          const resClone = res.clone();
          caches.open(STATIC_CACHE).then((c) => c.put(req, resClone));
          return res;
        })
      )
    );
    return;
  }

  // Demais arquivos: tenta rede, cai para cache se existir
  event.respondWith(
    fetch(req)
      .then((res) => res)
      .catch(() => caches.match(req))
  );
});

/* Atualização imediata quando houver SW novo */
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});