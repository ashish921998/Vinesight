// Simple service worker for VineSight PWA
// This is a minimal service worker that enables PWA features without deprecated dependencies

const CACHE_NAME = 'vinesight-v1'
const urlsToCache = ['/', '/manifest.json', '/icon-192x192.png', '/icon-512x512.png']

// Install event - cache basic resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache)
    })
    .catch((error) => {
      console.error('Service Worker installation failed:', error)
      throw error
    })
  )
  self.skipWaiting()  // Activate immediately without waiting
})

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response
      }
      // Fetch from network and cache for future use
      return fetch(event.request)
        .then((networkResponse) => {
          // Only cache successful GET requests
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            event.request.method === 'GET'
          ) {
            const responseToCache = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache)
            })
          }
          return networkResponse
        })
        .catch((error) => {
          console.error('Fetch failed:', error)
          // Optionally return a fallback page or image here
          throw error
        })
    })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
})

// Skip waiting for immediate updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
