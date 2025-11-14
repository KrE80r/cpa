// Service Worker for offline shopping functionality
const CACHE_NAME = 'shopping-assistant-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/style.css',
  '/index.js',
  '/js/cart.js'
];

// Cache data files for offline access
const DATA_CACHE_URLS = [
  '/data/coles.json',
  '/data/woolies.json', 
  '/data/aldi.json',
  '/data/iga.json'
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME + '-static').then((cache) => {
        return cache.addAll(STATIC_CACHE_URLS);
      }),
      caches.open(CACHE_NAME + '-data').then((cache) => {
        return cache.addAll(DATA_CACHE_URLS);
      })
    ])
  );
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME + '-static' && 
              cacheName !== CACHE_NAME + '-data') {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  if (request.url.includes('/data/')) {
    event.respondWith(
      caches.open(CACHE_NAME + '-data').then((cache) => {
        return cache.match(request).then((response) => {
          if (response) {
            // Serve from cache for offline
            return response;
          }
          
          // Try network and update cache
          return fetch(request).then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // Return cached version if network fails
            return cache.match(request);
          });
        });
      })
    );
    return;
  }
  
  // Handle static resources
  if (STATIC_CACHE_URLS.includes(new URL(request.url).pathname)) {
    event.respondWith(
      caches.open(CACHE_NAME + '-static').then((cache) => {
        return cache.match(request).then((response) => {
          return response || fetch(request);
        });
      })
    );
    return;
  }
  
  // For other requests, try network first
  event.respondWith(
    fetch(request).catch(() => {
      // If network fails, try cache
      return caches.match(request);
    })
  );
});

self.addEventListener('sync', (event) => {
  }
});

  try {
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        timestamp: Date.now()
      });
    });
  } catch (error) {
    console.error('Sync failed:', error);
  }
}