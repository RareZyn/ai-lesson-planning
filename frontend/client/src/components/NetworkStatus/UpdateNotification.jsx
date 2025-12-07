/**
 * UpdateNotification Component
 * Displays notification when a new version of the app is available
 */

import React, { useState, useEffect } from 'react';
import { Alert, Button } from 'antd';
import { RefreshCw, Download } from 'lucide-react';
import { skipWaiting } from '../../services/serviceWorkerRegistration';
import './UpdateNotification.css';

const UpdateNotification = () => {
  const [showUpdate, setShowUpdate] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    // Listen for service worker update events
    const handleUpdate = (event) => {
      console.log('[UpdateNotification] Update available:', event.detail);
      setShowUpdate(true);
    };

    window.addEventListener('sw-update-available', handleUpdate);

    return () => {
      window.removeEventListener('sw-update-available', handleUpdate);
    };
  }, []);

  const handleUpdate = () => {
    setUpdating(true);

    // Tell the service worker to skip waiting
    skipWaiting();

    // Show loading message
    setTimeout(() => {
      // The page will reload automatically when the new SW activates
      window.location.reload();
    }, 1000);
  };

  const handleDismiss = () => {
    setShowUpdate(false);
  };

  if (!showUpdate) {
    return null;
  }

  return (
    <div className="update-notification">
      <Alert
        message={
          <div className="update-content">
            <div className="update-icon">
              <Download size={24} />
            </div>
            <div className="update-message">
              <strong>New Version Available!</strong>
              <p>A new version of the AI Lesson Planning System is ready to install.</p>
            </div>
            <div className="update-actions">
              <Button
                type="primary"
                icon={<RefreshCw size={16} />}
                onClick={handleUpdate}
                loading={updating}
                className="update-button"
              >
                {updating ? 'Updating...' : 'Update Now'}
              </Button>
              <Button
                type="text"
                onClick={handleDismiss}
                disabled={updating}
                className="dismiss-button"
              >
                Later
              </Button>
            </div>
          </div>
        }
        type="info"
        closable={!updating}
        onClose={handleDismiss}
        showIcon={false}
        banner
      />
    </div>
  );
};

export default UpdateNotification;
