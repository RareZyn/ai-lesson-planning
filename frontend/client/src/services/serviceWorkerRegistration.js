/**
 * Service Worker Registration
 * Handles registration, updates, and lifecycle of the service worker
 */

// Track registration status
let swRegistration = null;

// Configuration
const config = {
  onSuccess: null,
  onUpdate: null,
  onError: null,
};

/**
 * Register the service worker
 * @param {Object} callbacks - Callbacks for success, update, and error
 */
export function register(callbacks = {}) {
  // Merge callbacks with config
  Object.assign(config, callbacks);

  // Check if service workers are supported
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers are not supported in this browser');
    return;
  }

  // Wait for page load to avoid slowing down initial page render
  window.addEventListener('load', () => {
    const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

    // Register the service worker
    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        swRegistration = registration;
        console.log('[SW Registration] Service Worker registered:', registration);

        // Check for updates every hour
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // 1 hour

        // Listen for updates
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;

          if (installingWorker == null) {
            return;
          }

          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New content available, notify user
                console.log('[SW Registration] New content available');

                if (config.onUpdate) {
                  config.onUpdate(registration);
                }

                // Show update notification
                showUpdateNotification();
              } else {
                // Content cached for offline use
                console.log('[SW Registration] Content cached for offline use');

                if (config.onSuccess) {
                  config.onSuccess(registration);
                }
              }
            }
          };
        };
      })
      .catch((error) => {
        console.error('[SW Registration] Error:', error);

        if (config.onError) {
          config.onError(error);
        }
      });

    // Listen for controller change (new service worker activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW Registration] Controller changed, reloading page');
      window.location.reload();
    });
  });
}

/**
 * Unregister the service worker
 */
export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
        console.log('[SW Registration] Service Worker unregistered');
      })
      .catch((error) => {
        console.error('[SW Registration] Unregister error:', error);
      });
  }
}

/**
 * Skip waiting and activate the new service worker immediately
 */
export function skipWaiting() {
  if (swRegistration && swRegistration.waiting) {
    swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
}

/**
 * Get the current service worker registration
 * @returns {ServiceWorkerRegistration|null}
 */
export function getRegistration() {
  return swRegistration;
}

/**
 * Check if service worker is registered
 * @returns {boolean}
 */
export function isRegistered() {
  return swRegistration !== null;
}

/**
 * Send a message to the service worker
 * @param {Object} message - Message to send
 * @returns {Promise}
 */
export function sendMessage(message) {
  return new Promise((resolve, reject) => {
    if (!navigator.serviceWorker.controller) {
      reject(new Error('No service worker controller'));
      return;
    }

    const messageChannel = new MessageChannel();

    messageChannel.port1.onmessage = (event) => {
      resolve(event.data);
    };

    navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2]);
  });
}

/**
 * Cache specific URLs for offline use
 * @param {string[]} urls - URLs to cache
 */
export async function cacheUrls(urls) {
  try {
    await sendMessage({ type: 'CACHE_URLS', urls });
    console.log('[SW Registration] URLs cached successfully');
    return true;
  } catch (error) {
    console.error('[SW Registration] Failed to cache URLs:', error);
    return false;
  }
}

/**
 * Clear all caches
 */
export async function clearCache() {
  try {
    await sendMessage({ type: 'CLEAR_CACHE' });
    console.log('[SW Registration] All caches cleared');
    return true;
  } catch (error) {
    console.error('[SW Registration] Failed to clear cache:', error);
    return false;
  }
}

/**
 * Get cache size information
 * @returns {Promise<Object>} Cache size data
 */
export async function getCacheSize() {
  try {
    const data = await sendMessage({ type: 'GET_CACHE_SIZE' });
    return data.size;
  } catch (error) {
    console.error('[SW Registration] Failed to get cache size:', error);
    return null;
  }
}

/**
 * Show update notification to user
 */
function showUpdateNotification() {
  // Create a custom event that can be listened to by React components
  const event = new CustomEvent('sw-update-available', {
    detail: {
      message: 'New version available! Click to update.',
      skipWaiting,
    },
  });

  window.dispatchEvent(event);
}

/**
 * Check if the app is running offline
 * @returns {boolean}
 */
export function isOffline() {
  return !navigator.onLine;
}

/**
 * Wait for the service worker to be ready
 * @returns {Promise<ServiceWorkerRegistration>}
 */
export function waitForReady() {
  if ('serviceWorker' in navigator) {
    return navigator.serviceWorker.ready;
  }
  return Promise.reject(new Error('Service Workers not supported'));
}

export default {
  register,
  unregister,
  skipWaiting,
  getRegistration,
  isRegistered,
  sendMessage,
  cacheUrls,
  clearCache,
  getCacheSize,
  isOffline,
  waitForReady,
};
