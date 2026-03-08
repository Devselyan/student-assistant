// Service Worker for Student Assistant Pro - Enhanced offline support
const CACHE_NAME = 'student-assistant-pro-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/renderer.js',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg'
];

// Install event - cache all assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching assets');
        return cache.addAll(ASSETS);
      })
      .then(() => {
        console.log('[SW] Installation complete, skipping waiting');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[SW] Cache failed:', err);
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys()
      .then((keyList) => {
        return Promise.all(
          keyList.map((key) => {
            if (key !== CACHE_NAME) {
              console.log('[SW] Removing old cache:', key);
              return caches.delete(key);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Activation complete, claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch event - network first for HTML, cache-first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle same-origin requests
  if (url.origin === location.origin) {
    // HTML requests - network first
    if (request.mode === 'navigate') {
      event.respondWith(
        fetch(request)
          .catch(() => caches.match(request))
          .catch(() => caches.match('/index.html'))
      );
      return;
    }

    // CSS, JS, images - cache first
    if (request.destination === 'style' || 
        request.destination === 'script' || 
        request.destination === 'image') {
      event.respondWith(
        caches.match(request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              // Return cached version while updating cache in background
              fetch(request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                  caches.open(CACHE_NAME).then((cache) => {
                    cache.put(request, networkResponse);
                  });
                }
              });
              return cachedResponse;
            }
            return fetch(request);
          })
      );
      return;
    }

    // API requests or other - network first with cache fallback
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Cache successful responses
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Cross-origin requests - pass through
  event.respondWith(fetch(request));
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skipping waiting on message');
    return self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('[SW] Clearing cache on request');
    event.waitUntil(
      caches.keys().then((keys) => {
        return Promise.all(keys.map((key) => caches.delete(key)));
      })
    );
  }
});

// Background sync for future features
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event:', event.tag);
  if (event.tag === 'sync-data') {
    event.waitUntil(
      // Future: sync data with server when online
      Promise.resolve()
    );
  }
});

// Push notifications for future features
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body || 'You have a new notification',
        icon: '/icon-192.svg',
        badge: '/icon-192.svg',
        vibrate: [100, 50, 100],
        data: data.data || {},
        actions: data.actions || []
      };
      
      event.waitUntil(
        self.registration.showNotification(data.title || 'Student Assistant', options)
      );
    } catch (err) {
      console.error('[SW] Push error:', err);
    }
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.title);
  event.notification.close();
  
  // Open the app when notification is clicked
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((windowClients) => {
        // If a window is already open, focus it
        if (windowClients.length > 0) {
          return windowClients[0].focus();
        }
        // Otherwise open a new window
        return clients.openWindow('/');
      })
  );
});

console.log('[SW] Service Worker loaded');
