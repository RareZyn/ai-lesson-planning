/**
 * useNetworkStatus Hook
 * React hook for monitoring network status
 */

import { useState, useEffect, useCallback } from 'react';
import * as networkStatus from '../services/networkStatus';

/**
 * Hook to monitor network status
 * @returns {Object} Network status information and utilities
 */
export function useNetworkStatus() {
  const [status, setStatus] = useState(networkStatus.getNetworkStatus());
  const [quality, setQuality] = useState(networkStatus.getConnectionQuality());
  const [speed, setSpeed] = useState(networkStatus.getConnectionSpeed());

  useEffect(() => {
    // Subscribe to network status changes
    const unsubscribe = networkStatus.subscribe((newStatus) => {
      setStatus(newStatus);
      setQuality(networkStatus.getConnectionQuality());
      setSpeed(networkStatus.getConnectionSpeed());
    });

    return unsubscribe;
  }, []);

  // Test actual connectivity (not just navigator.onLine)
  const testConnectivity = useCallback(async () => {
    return await networkStatus.testConnectivity();
  }, []);

  // Get detailed network status
  const getDetailedStatus = useCallback(async () => {
    return await networkStatus.getDetailedNetworkStatus();
  }, []);

  return {
    // Status information
    online: status.online,
    offline: !status.online,
    lastChanged: status.lastChanged,
    connectionType: status.connectionType,
    effectiveType: status.effectiveType,
    quality,
    speed,

    // Utility functions
    isOnline: networkStatus.isOnline,
    isOffline: networkStatus.isOffline,
    testConnectivity,
    getDetailedStatus,

    // Raw status object
    status,
  };
}

export default useNetworkStatus;
