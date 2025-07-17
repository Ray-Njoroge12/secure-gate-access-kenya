// Service Worker for Secure Gate Access Kenya
const CACHE_NAME = 'secure-gate-v1.0.0';
const STATIC_CACHE_NAME = 'static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'dynamic-v1.0.0';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/placeholder.svg',
  '/offline.html'
];

// API endpoints that can be cached
const CACHEABLE_APIS = [
  '/api/communities',
  '/api/residents',
  '/api/access-codes'
];

// Security headers to add to all responses
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co;"
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Cache cleanup completed');
        return self.clients.claim();
      })
  );
});

// Fetch event - network-first strategy with security enhancements
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and external requests
  if (request.method !== 'GET' || !url.origin.includes(self.location.origin)) {
    return;
  }
  
  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  } else if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(handleStaticRequest(request));
  } else {
    event.respondWith(handleDynamicRequest(request));
  }
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // If successful, cache the response for offline use
    if (networkResponse.ok && CACHEABLE_APIS.some(api => url.pathname.startsWith(api))) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    
    return addSecurityHeaders(networkResponse);
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache for:', request.url);
    
    // If network fails, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return addSecurityHeaders(cachedResponse);
    }
    
    // If no cache, return offline response
    return new Response(JSON.stringify({
      error: 'Offline - Unable to fetch data',
      timestamp: new Date().toISOString()
    }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        ...SECURITY_HEADERS
      }
    });
  }
}

// Handle static assets with cache-first strategy
async function handleStaticRequest(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return addSecurityHeaders(cachedResponse);
    }
    
    // If not in cache, fetch from network
    const networkResponse = await fetch(request);
    
    // Cache the response
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    
    return addSecurityHeaders(networkResponse);
  } catch (error) {
    console.error('Service Worker: Failed to serve static asset:', error);
    return new Response('Service Unavailable', { status: 503 });
  }
}

// Handle dynamic requests with network-first strategy
async function handleDynamicRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    
    return addSecurityHeaders(networkResponse);
  } catch (error) {
    console.log('Service Worker: Network failed for dynamic request:', request.url);
    
    // Try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return addSecurityHeaders(cachedResponse);
    }
    
    // Return offline page
    const offlineResponse = await caches.match('/offline.html');
    if (offlineResponse) {
      return addSecurityHeaders(offlineResponse);
    }
    
    return new Response('Offline - Please check your connection', {
      status: 503,
      headers: SECURITY_HEADERS
    });
  }
}

// Add security headers to response
function addSecurityHeaders(response) {
  const newHeaders = new Headers(response.headers);
  
  // Add security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered:', event.tag);
  
  if (event.tag === 'access-log-sync') {
    event.waitUntil(syncAccessLogs());
  }
});

// Sync access logs when online
async function syncAccessLogs() {
  try {
    const db = await openIndexedDB();
    const logs = await getOfflineAccessLogs(db);
    
    for (const log of logs) {
      try {
        await fetch('/api/access-logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(log)
        });
        
        // Remove synced log from offline storage
        await removeOfflineAccessLog(db, log.id);
      } catch (error) {
        console.error('Service Worker: Failed to sync access log:', error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Background sync failed:', error);
  }
}

// IndexedDB helpers for offline storage
async function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SecureGateDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('access_logs')) {
        const store = db.createObjectStore('access_logs', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp');
      }
    };
  });
}

async function getOfflineAccessLogs(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['access_logs'], 'readonly');
    const store = transaction.objectStore('access_logs');
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function removeOfflineAccessLog(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['access_logs'], 'readwrite');
    const store = transaction.objectStore('access_logs');
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push message received');
  
  const options = {
    body: event.data ? event.data.text() : 'New security notification',
    icon: '/placeholder.svg',
    badge: '/placeholder.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/placeholder.svg'
      },
      {
        action: 'close',
        title: 'Dismiss',
        icon: '/placeholder.svg'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Secure Gate Access', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/security-guard')
    );
  }
});