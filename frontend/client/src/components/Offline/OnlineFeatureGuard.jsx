/**
 * Online Feature Guard Component
 * Wrapper component that controls access to online-only features
 * Shows placeholder when offline and queues actions for when online
 */

import React, { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import OfflinePlaceholder, {
  AIFeaturePlaceholder,
  OnlineOnlyPlaceholder
} from './OfflinePlaceholder';
import offlineQueueService from '../../services/offline/offlineQueueService';
import './OnlineFeatureGuard.css';

const OnlineFeatureGuard = ({
  children,
  featureName = 'This feature',
  featureType = 'ai', // 'ai', 'online', 'generic'
  fallback = null, // Custom fallback component
  queueAction = null, // Function to call when queuing action
  queueActionData = {}, // Data to pass to queued action
  showPlaceholder = true, // Show placeholder when offline
  disableOnly = false, // Only disable children without placeholder
  onOfflineAttempt = null, // Callback when user tries to use feature offline
  requireStableConnection = false, // Require good connection quality
  wrapperClassName = '',
  wrapperStyle = {}
}) => {
  const { online, quality } = useNetworkStatus();
  const [queuedActionId, setQueuedActionId] = useState(null);
  const [processingQueue, setProcessingQueue] = useState(false);

  // Check if feature is available based on network status
  const isFeatureAvailable = useCallback(() => {
    if (!online) return false;
    if (requireStableConnection && quality === 'poor') return false;
    return true;
  }, [online, quality, requireStableConnection]);

  // Process queued action when coming online
  useEffect(() => {
    const processQueuedAction = async () => {
      if (isFeatureAvailable() && queuedActionId && queueAction && !processingQueue) {
        setProcessingQueue(true);
        try {
          message.info(`Processing queued action: ${featureName}`);

          // Get the queued action
          const action = await offlineQueueService.getActionById(queuedActionId);

          if (action && action.status === 'pending') {
            // Execute the action
            await queueAction(queueActionData);

            // Mark action as completed
            await offlineQueueService.markActionCompleted(queuedActionId);

            message.success(`${featureName} completed successfully`);
            setQueuedActionId(null);
          }
        } catch (error) {
          console.error('Error processing queued action:', error);
          message.error(`Failed to process ${featureName}: ${error.message}`);

          // Mark action as failed
          if (queuedActionId) {
            await offlineQueueService.markActionFailed(queuedActionId, error.message);
          }
        } finally {
          setProcessingQueue(false);
        }
      }
    };

    processQueuedAction();
  }, [online, quality, queuedActionId, queueAction, queueActionData, isFeatureAvailable, featureName, processingQueue]);

  // Handle click on disabled feature
  const handleOfflineClick = useCallback(async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (onOfflineAttempt) {
      onOfflineAttempt();
    }

    if (queueAction) {
      // Queue the action for when online
      try {
        const actionId = await offlineQueueService.queueAction({
          actionType: 'CUSTOM_ACTION',
          data: queueActionData,
          metadata: {
            featureName,
            description: `Queue ${featureName} for when online`
          }
        });

        setQueuedActionId(actionId);

        message.info({
          content: `${featureName} will be executed when you're back online`,
          duration: 5
        });
      } catch (error) {
        console.error('Error queuing action:', error);
        message.error('Failed to queue action for later');
      }
    } else {
      // Just show a message
      if (requireStableConnection && quality === 'poor') {
        message.warning('This feature requires a stable internet connection');
      } else {
        message.warning(`${featureName} requires an internet connection`);
      }
    }
  }, [queueAction, queueActionData, featureName, onOfflineAttempt, requireStableConnection, quality]);

  // Wrap children with click handler if offline
  const wrapChildren = (children) => {
    if (disableOnly && !isFeatureAvailable()) {
      return (
        <div
          className={`online-feature-guard-wrapper disabled ${wrapperClassName}`}
          style={{
            opacity: 0.6,
            pointerEvents: 'none',
            ...wrapperStyle
          }}
          onClick={handleOfflineClick}
        >
          {children}
        </div>
      );
    }

    return children;
  };

  // Render logic
  if (!isFeatureAvailable()) {
    // Show custom fallback if provided
    if (fallback) {
      return fallback;
    }

    // Show placeholder if enabled
    if (showPlaceholder) {
      switch (featureType) {
        case 'ai':
          return (
            <AIFeaturePlaceholder
              featureName={featureName}
              onRetry={isFeatureAvailable() ? () => window.location.reload() : null}
            />
          );

        case 'online':
          return (
            <OnlineOnlyPlaceholder
              featureName={featureName}
              showRetryButton={false}
            />
          );

        case 'generic':
        default:
          return (
            <OfflinePlaceholder
              type="online"
              title={`${featureName} Unavailable`}
              message={
                requireStableConnection && quality === 'poor'
                  ? 'This feature requires a stable internet connection'
                  : 'This feature requires an internet connection'
              }
              showRetryButton={false}
            />
          );
      }
    }

    // If no placeholder, show disabled children
    if (disableOnly) {
      return wrapChildren(children);
    }

    // Don't render anything
    return null;
  }

  // Feature is available - show connection quality warning if needed
  if (requireStableConnection && quality === 'poor') {
    return (
      <div className={`online-feature-guard-wrapper warning ${wrapperClassName}`} style={wrapperStyle}>
        <div className="connection-quality-warning">
          � Slow connection detected - feature may not work properly
        </div>
        {wrapChildren(children)}
      </div>
    );
  }

  // Feature is available - render children normally
  return (
    <div className={`online-feature-guard-wrapper ${wrapperClassName}`} style={wrapperStyle}>
      {wrapChildren(children)}
    </div>
  );
};

/**
 * Higher-order component version of OnlineFeatureGuard
 */
export const withOnlineGuard = (Component, config = {}) => {
  return (props) => (
    <OnlineFeatureGuard {...config}>
      <Component {...props} />
    </OnlineFeatureGuard>
  );
};

/**
 * Hook to check if feature is available
 */
export const useFeatureAvailable = (requireStableConnection = false) => {
  const { online, quality } = useNetworkStatus();

  const isAvailable = React.useMemo(() => {
    if (!online) return false;
    if (requireStableConnection && quality === 'poor') return false;
    return true;
  }, [online, quality, requireStableConnection]);

  return {
    isAvailable,
    online,
    quality,
    reason: !online
      ? 'offline'
      : requireStableConnection && quality === 'poor'
      ? 'poor-connection'
      : 'available'
  };
};

export default OnlineFeatureGuard;
