/**
 * Network Status Detector
 * Monitors online/offline status and provides real-time updates
 */

// Network status listeners
const listeners = new Set();

// Current network status
let currentStatus = {
  online: navigator.onLine,
  lastChanged: new Date(),
  connectionType: getConnectionType(),
  effectiveType: getEffectiveType(),
};

/**
 * Initialize network status monitoring
 */
export function initNetworkMonitoring() {
  // Listen for online event
  window.addEventListener('online', handleOnline);

  // Listen for offline event
  window.addEventListener('offline', handleOffline);

  // Listen for connection change (if supported)
  if ('connection' in navigator) {
    navigator.connection.addEventListener('change', handleConnectionChange);
  }

  console.log('[Network Status] Monitoring initialized');
}

/**
 * Stop network status monitoring
 */
export function stopNetworkMonitoring() {
  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);

  if ('connection' in navigator) {
    navigator.connection.removeEventListener('change', handleConnectionChange);
  }

  listeners.clear();
  console.log('[Network Status] Monitoring stopped');
}

/**
 * Handle online event
 */
function handleOnline() {
  console.log('[Network Status] Connection restored');

  currentStatus = {
    online: true,
    lastChanged: new Date(),
    connectionType: getConnectionType(),
    effectiveType: getEffectiveType(),
  };

  notifyListeners(currentStatus);

  // Trigger sync when coming back online
  triggerBackgroundSync();
}

/**
 * Handle offline event
 */
function handleOffline() {
  console.log('[Network Status] Connection lost');

  currentStatus = {
    online: false,
    lastChanged: new Date(),
    connectionType: null,
    effectiveType: null,
  };

  notifyListeners(currentStatus);
}

/**
 * Handle connection change (speed, type, etc.)
 */
function handleConnectionChange() {
  console.log('[Network Status] Connection properties changed');

  currentStatus = {
    ...currentStatus,
    connectionType: getConnectionType(),
    effectiveType: getEffectiveType(),
  };

  notifyListeners(currentStatus);
}

/**
 * Get connection type (wifi, cellular, etc.)
 * @returns {string|null}
 */
function getConnectionType() {
  if ('connection' in navigator && navigator.connection.type) {
    return navigator.connection.type;
  }
  return null;
}

/**
 * Get effective connection type (4g, 3g, 2g, slow-2g)
 * @returns {string|null}
 */
function getEffectiveType() {
  if ('connection' in navigator && navigator.connection.effectiveType) {
    return navigator.connection.effectiveType;
  }
  return null;
}

/**
 * Get current network status
 * @returns {Object}
 */
export function getNetworkStatus() {
  return { ...currentStatus };
}

/**
 * Check if currently online
 * @returns {boolean}
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Check if currently offline
 * @returns {boolean}
 */
export function isOffline() {
  return !navigator.onLine;
}

/**
 * Subscribe to network status changes
 * @param {Function} callback - Callback function to call on status change
 * @returns {Function} Unsubscribe function
 */
export function subscribe(callback) {
  listeners.add(callback);

  // Return unsubscribe function
  return () => {
    listeners.delete(callback);
  };
}

/**
 * Notify all listeners of status change
 * @param {Object} status - New status
 */
function notifyListeners(status) {
  listeners.forEach((callback) => {
    try {
      callback(status);
    } catch (error) {
      console.error('[Network Status] Listener error:', error);
    }
  });
}

/**
 * Trigger background sync when coming back online
 */
function triggerBackgroundSync() {
  if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready.then((registration) => {
      // Register sync for offline actions
      registration.sync
        .register('sync-offline-actions')
        .then(() => {
          console.log('[Network Status] Background sync registered');
        })
        .catch((error) => {
          console.error('[Network Status] Background sync failed:', error);
        });

      // Also sync lesson plans and bookmarks
      registration.sync.register('sync-lesson-plans').catch(console.error);
      registration.sync.register('sync-bookmarks').catch(console.error);
    });
  }
}

/**
 * Check connection quality
 * @returns {string} 'good' | 'moderate' | 'poor' | 'offline'
 */
export function getConnectionQuality() {
  if (!navigator.onLine) {
    return 'offline';
  }

  const effectiveType = getEffectiveType();

  if (!effectiveType) {
    return 'good'; // Assume good if we can't detect
  }

  switch (effectiveType) {
    case '4g':
      return 'good';
    case '3g':
      return 'moderate';
    case '2g':
    case 'slow-2g':
      return 'poor';
    default:
      return 'good';
  }
}

/**
 * Get download/upload speed estimates (in Mbps)
 * @returns {Object|null}
 */
export function getConnectionSpeed() {
  if ('connection' in navigator) {
    const conn = navigator.connection;
    return {
      downlink: conn.downlink || null, // Mbps
      downlinkMax: conn.downlinkMax || null, // Mbps
      rtt: conn.rtt || null, // Round-trip time in ms
    };
  }
  return null;
}

/**
 * Test actual network connectivity (not just navigator.onLine)
 * @returns {Promise<boolean>}
 */
export async function testConnectivity() {
  try {
    // Try to fetch a small resource from the server
    const response = await fetch('/favicon.ico', {
      method: 'HEAD',
      cache: 'no-cache',
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Get network status with actual connectivity test
 * @returns {Promise<Object>}
 */
export async function getDetailedNetworkStatus() {
  const actuallyOnline = await testConnectivity();

  return {
    ...currentStatus,
    actuallyOnline,
    quality: getConnectionQuality(),
    speed: getConnectionSpeed(),
  };
}

// Initialize monitoring when module loads
initNetworkMonitoring();

const networkStatusService = {
  initNetworkMonitoring,
  stopNetworkMonitoring,
  getNetworkStatus,
  isOnline,
  isOffline,
  subscribe,
  getConnectionQuality,
  getConnectionSpeed,
  testConnectivity,
  getDetailedNetworkStatus,
};

export default networkStatusService;
