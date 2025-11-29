// AI Lesson Planning System - Service Worker
// Provides offline support and caching strategies

const CACHE_VERSION = 'v1';
const CACHE_NAME = `ai-lesson-planning-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;

// Static assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json',
  '/favicon.ico',
  '/offline.html' // Fallback page when offline
];

// API routes that should be cached with Network-First strategy
const API_ROUTES = [
  '/api/lessons',
  '/api/classes',
  '/api/assessments',
  '/api/students',
  '/api/community'
];

// Routes that should never be cached (AI endpoints)
const NO_CACHE_ROUTES = [
  '/api/assessment/generate',
  '/api/grading',
  '/api/ocr',
  '/api/gpt'
];

// ============================
// INSTALL EVENT
// Cache static assets immediately
// ============================
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );

  // Activate immediately, don't wait for page reload
  self.skipWaiting();
});

// ============================
// ACTIVATE EVENT
// Clean up old caches
// ============================
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME &&
              cacheName !== RUNTIME_CACHE &&
              cacheName !== API_CACHE) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  // Take control of all pages immediately
  return self.clients.claim();
});

// ============================
// FETCH EVENT
// Implement caching strategies
// ============================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Strategy 1: Network-Only for AI endpoints
  if (shouldSkipCache(url.pathname)) {
    event.respondWith(fetch(request));
    return;
  }

  // Strategy 2: Cache-First for static assets
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Strategy 3: Network-First for API calls
  if (isApiCall(url.pathname)) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Default: Network-First with cache fallback
  event.respondWith(networkFirst(request));
});

// ============================
// CACHING STRATEGIES
// ============================

// Cache-First: Check cache, then network
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Cache-First failed:', error);
    return getOfflinePage();
  }
}

// Network-First: Try network, fallback to cache
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(isApiCall(request.url) ? API_CACHE : RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network failed, trying cache:', request.url);

    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page if no cache available
    return getOfflinePage();
  }
}

// Stale-While-Revalidate: Return cache immediately, update in background
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    cache.put(request, networkResponse.clone());
    return networkResponse;
  });

  return cachedResponse || fetchPromise;
}

// ============================
// HELPER FUNCTIONS
// ============================

function isStaticAsset(pathname) {
  return pathname.startsWith('/static/') ||
         pathname.endsWith('.css') ||
         pathname.endsWith('.js') ||
         pathname.endsWith('.png') ||
         pathname.endsWith('.jpg') ||
         pathname.endsWith('.ico') ||
         pathname.endsWith('.woff') ||
         pathname.endsWith('.woff2');
}

function isApiCall(pathname) {
  return pathname.startsWith('/api/');
}

function shouldSkipCache(pathname) {
  return NO_CACHE_ROUTES.some(route => pathname.includes(route));
}

async function getOfflinePage() {
  const cache = await caches.open(CACHE_NAME);
  const offlinePage = await cache.match('/offline.html');
  return offlinePage || new Response('Offline', { status: 503 });
}

// ============================
// BACKGROUND SYNC
// Handle offline actions when connection restored
// ============================
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Sync event:', event.tag);

  if (event.tag === 'sync-offline-actions') {
    event.waitUntil(syncOfflineActions());
  }

  if (event.tag === 'sync-lesson-plans') {
    event.waitUntil(syncLessonPlans());
  }

  if (event.tag === 'sync-bookmarks') {
    event.waitUntil(syncBookmarks());
  }
});

async function syncOfflineActions() {
  console.log('[Service Worker] Syncing offline actions...');

  try {
    // Open IndexedDB and get pending actions
    const db = await openDatabase();
    const actions = await getPendingActions(db);

    // Process each action
    for (const action of actions) {
      try {
        await processAction(action);
        await markActionCompleted(db, action.id);
      } catch (error) {
        console.error('[Service Worker] Failed to sync action:', error);
        await incrementRetryCount(db, action.id);
      }
    }

    console.log('[Service Worker] Sync completed');
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
    throw error; // Rethrow to trigger retry
  }
}

async function syncLessonPlans() {
  console.log('[Service Worker] Syncing lesson plans...');
  // Implementation will be added in Phase 5
}

async function syncBookmarks() {
  console.log('[Service Worker] Syncing bookmarks...');
  // Implementation will be added in Phase 5
}

// ============================
// MESSAGE HANDLING
// Handle messages from the application
// ============================
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CACHE_URLS') {
    cacheUrls(event.data.urls);
  }

  if (event.data.type === 'CLEAR_CACHE') {
    clearAllCaches();
  }

  if (event.data.type === 'GET_CACHE_SIZE') {
    getCacheSize().then(size => {
      event.ports[0].postMessage({ size });
    });
  }
});

// Cache specific URLs (for "Download for Offline" feature)
async function cacheUrls(urls) {
  const cache = await caches.open(CACHE_NAME);
  try {
    await cache.addAll(urls);
    console.log('[Service Worker] URLs cached successfully');
    return true;
  } catch (error) {
    console.error('[Service Worker] Failed to cache URLs:', error);
    return false;
  }
}

// Clear all caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  console.log('[Service Worker] All caches cleared');
}

// Get total cache size
async function getCacheSize() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage,
      quota: estimate.quota,
      usageInMB: (estimate.usage / (1024 * 1024)).toFixed(2),
      quotaInMB: (estimate.quota / (1024 * 1024)).toFixed(2)
    };
  }
  return null;
}

// ============================
// INDEXEDDB HELPERS
// These will be expanded in Phase 2
// ============================
async function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ai-lesson-planning-offline', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('offlineQueue')) {
        const store = db.createObjectStore('offlineQueue', {
          keyPath: 'id',
          autoIncrement: true
        });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('status', 'status', { unique: false });
      }
    };
  });
}

async function getPendingActions(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offlineQueue'], 'readonly');
    const store = transaction.objectStore('offlineQueue');
    const index = store.index('status');
    const request = index.getAll('pending');

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function processAction(action) {
  // Send action to server
  const response = await fetch('/api/offline/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(action)
  });

  if (!response.ok) {
    throw new Error(`Sync failed: ${response.status}`);
  }

  return response.json();
}

async function markActionCompleted(db, actionId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offlineQueue'], 'readwrite');
    const store = transaction.objectStore('offlineQueue');
    const request = store.delete(actionId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function incrementRetryCount(db, actionId) {
  // Implementation for retry logic
  console.log('[Service Worker] Incrementing retry count for action:', actionId);
}

console.log('[Service Worker] Loaded');
