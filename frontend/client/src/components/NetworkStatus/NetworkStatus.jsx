/**
 * NetworkStatus Component
 * Displays current network status with visual indicators
 */

import React, { useState, useEffect } from 'react';
import { Alert } from 'antd';
import {
  WifiOff,
  Wifi,
  SignalHigh,
  SignalMedium,
  SignalLow
} from 'lucide-react';
import * as networkStatus from '../../services/networkStatus';
import './NetworkStatus.css';

const NetworkStatus = ({
  showOnlineStatus = false,
  compact = false,
  style = {}
}) => {
  const [status, setStatus] = useState(networkStatus.getNetworkStatus());
  const [quality, setQuality] = useState(networkStatus.getConnectionQuality());
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Subscribe to network status changes
    const unsubscribe = networkStatus.subscribe((newStatus) => {
      setStatus(newStatus);
      setQuality(networkStatus.getConnectionQuality());

      // Show banner when status changes
      setShow(true);

      // Auto-hide online status after 3 seconds if showOnlineStatus is false
      if (!showOnlineStatus && newStatus.online) {
        setTimeout(() => setShow(false), 3000);
      }
    });

    // Show if currently offline or if showOnlineStatus is true
    setShow(!status.online || showOnlineStatus);

    return () => unsubscribe();
  }, [showOnlineStatus, status.online]);

  // Don't render if online and showOnlineStatus is false
  if (!show) {
    return null;
  }

  // Get icon based on connection quality
  const getIcon = () => {
    if (!status.online) {
      return <WifiOff size={compact ? 16 : 20} />;
    }

    switch (quality) {
      case 'good':
        return <SignalHigh size={compact ? 16 : 20} />;
      case 'moderate':
        return <SignalMedium size={compact ? 16 : 20} />;
      case 'poor':
        return <SignalLow size={compact ? 16 : 20} />;
      default:
        return <Wifi size={compact ? 16 : 20} />;
    }
  };

  // Get message based on status
  const getMessage = () => {
    if (!status.online) {
      return 'You are currently offline. Some features may be limited.';
    }

    if (quality === 'poor') {
      return 'Slow connection detected. Some features may load slowly.';
    }

    if (showOnlineStatus) {
      return 'You are online and connected.';
    }

    return 'Connection restored!';
  };

  // Get alert type
  const getAlertType = () => {
    if (!status.online) {
      return 'error';
    }
    if (quality === 'poor') {
      return 'warning';
    }
    return 'success';
  };

  // Compact mode
  if (compact) {
    return (
      <div className={`network-status-compact ${!status.online ? 'offline' : quality}`} style={style}>
        {getIcon()}
        <span className="status-text">{status.online ? 'Online' : 'Offline'}</span>
      </div>
    );
  }

  // Full banner mode
  return (
    <div className="network-status-banner" style={style}>
      <Alert
        message={
          <div className="network-status-content">
            <div className="status-icon">
              {getIcon()}
            </div>
            <div className="status-message">
              <strong>{status.online ? 'Connected' : 'No Connection'}</strong>
              <p>{getMessage()}</p>
            </div>
            {status.online && status.effectiveType && (
              <div className="connection-info">
                <span className="connection-type">
                  {status.effectiveType.toUpperCase()}
                </span>
              </div>
            )}
          </div>
        }
        type={getAlertType()}
        closable={status.online}
        onClose={() => setShow(false)}
        showIcon={false}
        banner
      />
    </div>
  );
};

export default NetworkStatus;
