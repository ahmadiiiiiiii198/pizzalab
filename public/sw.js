// Service Worker for Order Dashboard
// Handles background notifications and keeps the app running even when screen is off

const APP_VERSION = '2025.10.5.1759701447557';
const CACHE_NAME = 'pizzalab-v2025.10.5.1759701447557';
const urlsToCache = [
  '/',
  '/orders',
  '/admin',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('📦 Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('📦 Service Worker installed successfully');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker activating... Version:', APP_VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('🔄 Service Worker activated - Version:', APP_VERSION);
      return self.clients.claim();
    })
  );
});

// Fetch event - NETWORK FIRST strategy (cache-busting enabled)
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and chrome-extension requests
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  // Network-first strategy: Always try network first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response before caching
        const responseToCache = response.clone();

        // Cache the fresh response for offline use
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        // Return the network response
        return response;
      })
      .catch((error) => {
        console.log('🌐 Network fetch failed for:', event.request.url, error.message);

        // Try cache as fallback (offline mode)
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('📦 Serving from cache:', event.request.url);
            return cachedResponse;
          }

          // Return a basic response for favicon requests to prevent errors
          if (event.request.url.includes('favicon.ico')) {
            return new Response('', { status: 404, statusText: 'Not Found' });
          }

          // For other requests, return offline response
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        });
      })
  );
});

// Background sync for order updates
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'order-sync') {
    event.waitUntil(syncOrders());
  }
});

// Push notifications for new orders
self.addEventListener('push', (event) => {
  console.log('📱 Push notification received:', event);
  
  let notificationData = {
    title: 'New Order Received!',
    body: 'You have a new flower order',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'new-order',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View Order',
        icon: '/icons/view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss.png'
      }
    ],
    data: {
      url: '/orders',
      timestamp: Date.now()
    }
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        title: `New Order #${data.orderNumber}`,
        body: `Order from ${data.customerName} - ${data.amount}`,
        data: {
          ...notificationData.data,
          orderId: data.orderId,
          orderNumber: data.orderNumber
        }
      };
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'view') {
    // Open the order dashboard
    event.waitUntil(
      clients.openWindow('/orders')
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes('/orders') && 'focus' in client) {
            return client.focus();
          }
        }
        // If not open, open new window
        if (clients.openWindow) {
          return clients.openWindow('/orders');
        }
      })
    );
  }
});

// Background message handling
self.addEventListener('message', (event) => {
  console.log('💬 Message received in SW:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'NEW_ORDER') {
    // Handle new order notification
    const { orderNumber, customerName, amount } = event.data;
    
    self.registration.showNotification(`New Order #${orderNumber}`, {
      body: `Order from ${customerName} - ${amount}`,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'new-order',
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200],
      actions: [
        {
          action: 'accept',
          title: 'Accept Order',
          icon: '/icons/accept.png'
        },
        {
          action: 'view',
          title: 'View Details',
          icon: '/icons/view.png'
        }
      ],
      data: {
        orderId: event.data.orderId,
        orderNumber: orderNumber,
        url: '/orders'
      }
    });
  }
});

// Periodic background sync to check for new orders
async function syncOrders() {
  try {
    console.log('🔄 Syncing orders in background...');
    
    // This would typically make an API call to check for new orders
    // For now, we'll just log that sync happened
    console.log('✅ Order sync completed');
    
    // You could implement actual API calls here:
    // const response = await fetch('/api/orders/check-new');
    // const newOrders = await response.json();
    // if (newOrders.length > 0) {
    //   // Show notifications for new orders
    // }
    
  } catch (error) {
    console.error('❌ Order sync failed:', error);
  }
}

// Keep the service worker alive
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'order-check') {
    event.waitUntil(syncOrders());
  }
});

// Handle app visibility changes
self.addEventListener('visibilitychange', (event) => {
  console.log('👁️ App visibility changed:', document.hidden);
  
  if (document.hidden) {
    // App went to background - ensure notifications continue
    console.log('📱 App backgrounded - maintaining notification service');
  } else {
    // App came to foreground
    console.log('📱 App foregrounded - syncing data');
  }
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('❌ Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  // Prevent the default unhandled rejection behavior
  event.preventDefault();

  // Only log non-fetch related errors to reduce noise
  if (!event.reason?.message?.includes('Failed to fetch')) {
    console.error('❌ Service Worker unhandled rejection:', event.reason);
  }
});

console.log('🚀 Service Worker loaded and ready for order notifications!');
