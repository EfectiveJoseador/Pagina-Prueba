const CACHE_NAME = 'camisetazo-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles/styles.css',
  './scripts/scripts.js',
  './scripts/cart-persistence.js',
  './scripts/schema-org.js',
  './scripts/performance-optimizations.js',
  './manifest.json',
  './assets/logos/logo.jpg'
];


self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierto');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});


self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim())
  );
});


self.addEventListener('fetch', (event) => {
  
  if (event.request.method !== 'GET') return;
  
  // Permitir requests de Vercel Analytics y Google Analytics sin interferencia
  if (
    event.request.url.includes('analytics.vercel.com') ||
    event.request.url.includes('www.googletagmanager.com') ||
    event.request.url.includes('formsubmit.co')
  ) {
    return; // fall back to network without caching intercept
  }
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        
        return caches.match(event.request);
      })
  );
});