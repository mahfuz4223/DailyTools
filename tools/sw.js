// PDF Tools Service Worker

const CACHE_NAME = 'darktools-pdf-cache-v1';
const ASSETS_TO_CACHE = [
  '../css/dark-tools.css',
  'css/pdf-tools.css',
  'css/pdf-tools-enhanced.css',
  'js/pdf-tools.js',
  '../js/componentLoader.js',
  '../js/dark-tools.js',
  '../components/header.html',
  '../components/footer.html'
];

// Install event - Cache assets
self.addEventListener('install', event => {
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching assets...');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - Serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip non-http(s) requests
  if (!event.request.url.startsWith('http')) {
    return;
  }
  
  // Skip URLs with unsupported schemes
  const url = new URL(event.request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached response if found
        if (response) {
          return response;
        }
        
        // Otherwise fetch from network
        return fetch(event.request)
          .then(networkResponse => {
            // Don't cache cross-origin resources or non-successful responses
            if (!networkResponse || networkResponse.status !== 200 || 
                networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            // Clone the response for the cache
            const responseToCache = networkResponse.clone();
            
            // Only cache same-origin resources
            if (new URL(event.request.url).origin === location.origin) {
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
            }
            
            return networkResponse;
          })
          .catch(error => {
            console.error('Fetch error:', error);
            // Could return a custom offline page here
          });
      })
  );
}); 