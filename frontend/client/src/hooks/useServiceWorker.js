/**
 * useServiceWorker Hook
 * React hook for interacting with service worker
 */

import { useState, useEffect, useCallback } from 'react';
import * as serviceWorkerRegistration from '../services/serviceWorkerRegistration';

/**
 * Hook to interact with service worker
 * @returns {Object} Service worker utilities and status
 */
export function useServiceWorker() {
  const [isRegistered, setIsRegistered] = useState(serviceWorkerRegistration.isRegistered());
  const [cacheSize, setCacheSize] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Check if service worker is registered
    setIsRegistered(serviceWorkerRegistration.isRegistered());

    // Listen for update events
    const handleUpdate = () => {
      setUpdateAvailable(true);
    };

    window.addEventListener('sw-update-available', handleUpdate);

    // Get initial cache size
    getCacheSizeInfo();

    return () => {
      window.removeEventListener('sw-update-available', handleUpdate);
    };
  }, []);

  // Get cache size information
  const getCacheSizeInfo = useCallback(async () => {
    try {
      const size = await serviceWorkerRegistration.getCacheSize();
      setCacheSize(size);
      return size;
    } catch (error) {
      console.error('[useServiceWorker] Failed to get cache size:', error);
      return null;
    }
  }, []);

  // Cache specific URLs
  const cacheUrls = useCallback(async (urls) => {
    try {
      const success = await serviceWorkerRegistration.cacheUrls(urls);
      if (success) {
        // Refresh cache size after caching
        await getCacheSizeInfo();
      }
      return success;
    } catch (error) {
      console.error('[useServiceWorker] Failed to cache URLs:', error);
      return false;
    }
  }, [getCacheSizeInfo]);

  // Clear all caches
  const clearCache = useCallback(async () => {
    try {
      const success = await serviceWorkerRegistration.clearCache();
      if (success) {
        // Refresh cache size after clearing
        await getCacheSizeInfo();
      }
      return success;
    } catch (error) {
      console.error('[useServiceWorker] Failed to clear cache:', error);
      return false;
    }
  }, [getCacheSizeInfo]);

  // Skip waiting and update immediately
  const updateApp = useCallback(() => {
    serviceWorkerRegistration.skipWaiting();
    setUpdateAvailable(false);
  }, []);

  // Unregister service worker
  const unregister = useCallback(async () => {
    try {
      await serviceWorkerRegistration.unregister();
      setIsRegistered(false);
      return true;
    } catch (error) {
      console.error('[useServiceWorker] Failed to unregister:', error);
      return false;
    }
  }, []);

  // Send message to service worker
  const sendMessage = useCallback(async (message) => {
    try {
      return await serviceWorkerRegistration.sendMessage(message);
    } catch (error) {
      console.error('[useServiceWorker] Failed to send message:', error);
      throw error;
    }
  }, []);

  // Wait for service worker to be ready
  const waitForReady = useCallback(async () => {
    try {
      return await serviceWorkerRegistration.waitForReady();
    } catch (error) {
      console.error('[useServiceWorker] Service worker not ready:', error);
      throw error;
    }
  }, []);

  return {
    // Status
    isRegistered,
    updateAvailable,
    cacheSize,

    // Cache management
    getCacheSize: getCacheSizeInfo,
    cacheUrls,
    clearCache,

    // Update management
    updateApp,
    skipWaiting: updateApp,

    // Service worker management
    unregister,
    sendMessage,
    waitForReady,

    // Utilities
    getRegistration: serviceWorkerRegistration.getRegistration,
    isOffline: serviceWorkerRegistration.isOffline,
  };
}

export default useServiceWorker;
