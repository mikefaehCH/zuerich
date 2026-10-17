/* Zúrich en Navidad – caché sin conexión. Subir la versión con cada cambio. */
const CACHE = 'zuerich-v6';
const CORE = ['./', './index.html', './data.js', './manifest.webmanifest', './icon.svg',
  './img/grossmuenster-alpen-800.webp', './img/grossmuenster-alpen-1600.webp', './img/lindenhof-blick-800.webp', './img/altstadt-haus-zur-glocke-800.webp',
  './vendor/leaflet/leaflet.js', './vendor/leaflet/leaflet.css',
  './vendor/markercluster/leaflet.markercluster.js', './vendor/markercluster/MarkerCluster.css',
  './vendor/fonts/fraunces-latin-400-normal.woff2', './vendor/fonts/fraunces-latin-500-normal.woff2',
  './vendor/fonts/fraunces-latin-600-normal.woff2', './vendor/fonts/fraunces-latin-400-italic.woff2',
  './vendor/fonts/dm-sans-latin-400-normal.woff2', './vendor/fonts/dm-sans-latin-500-normal.woff2',
  './vendor/fonts/dm-sans-latin-700-normal.woff2'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const put = res => { if (res.ok || res.type === 'opaque') { const c = res.clone(); caches.open(CACHE).then(ca => ca.put(req, c)); } return res; };
  // Red primero (contenido actual), si no hay conexión: caché
  e.respondWith(fetch(req).then(put).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});
