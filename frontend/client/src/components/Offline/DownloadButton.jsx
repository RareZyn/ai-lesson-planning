/**
 * Enhanced Download Button Component
 * Reusable button for downloading content for offline access
 * Features: Progress tracking, size estimation, error handling, cancellation
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Tooltip, message, Progress } from 'antd';
import {
  CloudDownloadOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';

import offlineStorageManager, { DOWNLOAD_TYPES } from '../../services/offline/offlineStorageManager';
import { hasEnoughSpace, estimateDataSize } from '../../services/offline/storageQuotaManager';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

const DownloadButton = ({
  contentType, // 'lesson', 'assessment', 'class', etc.
  contentId,
  contentData = null, // Optional: provide data to estimate size
  onDownloadComplete = null,
  onDownloadError = null,
  size = 'middle',
  buttonText = null,
  iconOnly = false,
  showProgress = true, // Show progress bar during download
  showSize = true, // Show estimated size in tooltip
  disabled = false
}) => {
  const [isOffline, setIsOffline] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [estimatedSize, setEstimatedSize] = useState(null);
  const { online } = useNetworkStatus();

  const checkOfflineStatus = useCallback(async () => {
    setChecking(true);
    try {
      const offline = await offlineStorageManager.isContentOffline(contentType, contentId);
      setIsOffline(offline);

      // Estimate size if data provided
      if (contentData && showSize) {
        const size = estimateDataSize(contentData);
        setEstimatedSize(size);
      }
    } catch (error) {
      console.error('Error checking offline status:', error);
      setError(error.message);
    } finally {
      setChecking(false);
    }
  }, [contentType, contentId, contentData, showSize]);

  useEffect(() => {
    checkOfflineStatus();
  }, [checkOfflineStatus]);

  // Listen for download events from other components
  useEffect(() => {
    const handleDownloadComplete = (event) => {
      if (event.detail.type === contentType && event.detail.id === contentId) {
        setIsOffline(true);
        setProgress(0);
      }
    };

    const handleDownloadProgress = (event) => {
      if (event.detail.type === contentType && event.detail.id === contentId) {
        setProgress(event.detail.progress || 0);
      }
    };

    window.addEventListener('offline-download-complete', handleDownloadComplete);
    window.addEventListener('offline-download-progress', handleDownloadProgress);

    return () => {
      window.removeEventListener('offline-download-complete', handleDownloadComplete);
      window.removeEventListener('offline-download-progress', handleDownloadProgress);
    };
  }, [contentType, contentId]);

  const handleDownload = async () => {
    // Check if online
    if (!online) {
      message.warning('You must be online to download content for offline use');
      return;
    }

    // Check storage space before downloading
    if (contentData) {
      const size = estimateDataSize(contentData);
      const hasSpace = await hasEnoughSpace(size.bytes);

      if (!hasSpace) {
        message.error(
          `Not enough storage space. Need ${size.readable}, please free up some space and try again.`
        );
        return;
      }
    }

    setDownloading(true);
    setError(null);
    setProgress(0);

    try {
      let result;

      // Create progress callback
      const onProgress = (progressValue) => {
        setProgress(progressValue);

        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('offline-download-progress', {
          detail: { type: contentType, id: contentId, progress: progressValue }
        }));
      };

      switch (contentType) {
        case DOWNLOAD_TYPES.LESSON:
          result = await offlineStorageManager.downloadLesson(contentId, onProgress);
          break;
        case DOWNLOAD_TYPES.ASSESSMENT:
          result = await offlineStorageManager.downloadAssessment(contentId, onProgress);
          break;
        case DOWNLOAD_TYPES.CLASS:
          result = await offlineStorageManager.downloadClass(contentId, true, onProgress);
          break;
        default:
          throw new Error('Invalid content type');
      }

      message.success({
        content: 'Content downloaded successfully for offline access',
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />
      });
      setIsOffline(true);

      // Dispatch completion event
      window.dispatchEvent(new CustomEvent('offline-download-complete', {
        detail: { type: contentType, id: contentId, result }
      }));

      if (onDownloadComplete) {
        onDownloadComplete(result);
      }
    } catch (error) {
      console.error('Error downloading content:', error);
      setError(error.message);
      message.error({
        content: `Failed to download: ${error.message || 'Unknown error'}`,
        duration: 5
      });

      if (onDownloadError) {
        onDownloadError(error);
      }
    } finally {
      setDownloading(false);
      setProgress(0);
    }
  };

  const handleRemove = async () => {
    setDownloading(true);
    setError(null);

    try {
      await offlineStorageManager.removeOfflineContent(contentType, contentId);
      message.success('Content removed from offline storage');
      setIsOffline(false);
    } catch (error) {
      console.error('Error removing content:', error);
      setError(error.message);
      message.error('Failed to remove content from offline storage');
    } finally {
      setDownloading(false);
    }
  };

  const getTooltipTitle = () => {
    if (checking) return 'Checking offline status...';
    if (error) return `Error: ${error}`;
    if (downloading) return `Downloading... ${progress}%`;

    if (isOffline) {
      return 'Available offline. Click to remove from offline storage.';
    }

    let title = 'Download for offline access';
    if (estimatedSize && showSize) {
      title += ` (approximately ${estimatedSize.readable})`;
    }
    if (!online) {
      title = 'You must be online to download content';
    }

    return title;
  };

  const renderButton = () => {
    // Checking state
    if (checking) {
      return (
        <Button size={size} icon={<LoadingOutlined />} disabled>
          {!iconOnly && 'Checking...'}
        </Button>
      );
    }

    // Error state
    if (error && !downloading) {
      return (
        <Button
          size={size}
          type="default"
          danger
          icon={<CloseCircleOutlined />}
          onClick={checkOfflineStatus}
          disabled={disabled}
        >
          {!iconOnly && 'Retry'}
        </Button>
      );
    }

    // Already offline state
    if (isOffline) {
      return (
        <Button
          size={size}
          type="default"
          icon={downloading ? <LoadingOutlined /> : <CheckCircleOutlined />}
          onClick={handleRemove}
          loading={downloading}
          disabled={disabled}
          style={{
            color: '#52c41a',
            borderColor: '#52c41a',
            background: '#f6ffed'
          }}
        >
          {!iconOnly && (buttonText || 'Available Offline')}
        </Button>
      );
    }

    // Download state
    return (
      <Button
        size={size}
        type="default"
        icon={downloading ? <LoadingOutlined /> : <CloudDownloadOutlined />}
        onClick={handleDownload}
        loading={downloading}
        disabled={disabled || !online}
      >
        {!iconOnly && (buttonText || 'Download')}
      </Button>
    );
  };

  return (
    <div style={{ display: 'inline-block', position: 'relative' }}>
      <Tooltip title={getTooltipTitle()}>
        {renderButton()}
      </Tooltip>

      {/* Progress bar below button */}
      {downloading && showProgress && progress > 0 && (
        <Progress
          percent={progress}
          size="small"
          status="active"
          style={{
            position: 'absolute',
            bottom: -8,
            left: 0,
            right: 0,
            margin: 0,
            lineHeight: 1
          }}
          showInfo={false}
        />
      )}
    </div>
  );
};

export default DownloadButton;
