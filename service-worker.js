// Flow On — Service Worker básico
const CACHE_NAME = "flowon-cache-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/assets/css/style.css",
  "/assets/img/favicon.svg",
  "/assets/img/logo.svg"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(resp => resp || fetch(e.request))
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
});