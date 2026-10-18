/* Zúrich en Navidad – caché sin conexión. Subir la versión con cada cambio. */
const CACHE = 'zuerich-v15';
const CORE = ['./', './index.html', './data.js', './manifest.webmanifest', './icon.svg',
  './img/hero-limmat-m.webp', './img/hero-limmat-d.webp',
  './vendor/leaflet/leaflet.js', './vendor/leaflet/leaflet.css',
  './vendor/markercluster/leaflet.markercluster.js', './vendor/markercluster/MarkerCluster.css',
  './vendor/fonts/cormorant-garamond-latin-500-normal.woff2', './vendor/fonts/cormorant-garamond-latin-600-normal.woff2',
  './vendor/fonts/cormorant-garamond-latin-500-italic.woff2',
  './vendor/fonts/inter-latin-400-normal.woff2', './vendor/fonts/inter-latin-500-normal.woff2', './vendor/fonts/inter-latin-600-normal.woff2'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const put = res => { if (res.ok || res.type === 'opaque') { const c = res.clone(); caches.open(CACHE).then(ca => ca.put(req, c)); } return res; };
  // Red primero (contenido actual), si no hay conexión: caché
  e.respondWith(fetch(req).then(put).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});
