/**
 * Download Button Component
 * Reusable button for downloading content for offline access
 */

import React, { useState, useEffect } from 'react';
import { Button, Tooltip, message } from 'antd';
import {
  CloudDownloadOutlined,
  CheckCircleOutlined,
  LoadingOutlined
} from '@ant-design/icons';

import offlineStorageManager, { DOWNLOAD_TYPES } from '../../services/offline/offlineStorageManager';
import { hasEnoughSpace, estimateDataSize } from '../../services/offline/storageQuotaManager';

const DownloadButton = ({
  contentType, // 'lesson', 'assessment', 'class', etc.
  contentId,
  contentData = null, // Optional: provide data to estimate size
  onDownloadComplete = null,
  onDownloadError = null,
  size = 'middle',
  buttonText = null,
  iconOnly = false
}) => {
  const [isOffline, setIsOffline] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [checking, setChecking] = useState(true);

  const checkOfflineStatus = React.useCallback(async () => {
    setChecking(true);
    try {
      const offline = await offlineStorageManager.isContentOffline(contentType, contentId);
      setIsOffline(offline);
    } catch (error) {
      console.error('Error checking offline status:', error);
    } finally {
      setChecking(false);
    }
  }, [contentType, contentId]);

  useEffect(() => {
    checkOfflineStatus();
  }, [checkOfflineStatus]);

  const handleDownload = async () => {
    // Check storage space before downloading
    if (contentData) {
      const size = estimateDataSize(contentData);
      const hasSpace = await hasEnoughSpace(size.bytes);

      if (!hasSpace) {
        message.error('Not enough storage space. Please free up some space and try again.');
        return;
      }
    }

    setDownloading(true);

    try {
      let result;

      switch (contentType) {
        case DOWNLOAD_TYPES.LESSON:
          result = await offlineStorageManager.downloadLesson(contentId);
          break;
        case DOWNLOAD_TYPES.ASSESSMENT:
          result = await offlineStorageManager.downloadAssessment(contentId);
          break;
        case DOWNLOAD_TYPES.CLASS:
          result = await offlineStorageManager.downloadClass(contentId, true);
          break;
        default:
          throw new Error('Invalid content type');
      }

      message.success('Content downloaded for offline access');
      setIsOffline(true);

      if (onDownloadComplete) {
        onDownloadComplete(result);
      }
    } catch (error) {
      console.error('Error downloading content:', error);
      message.error('Failed to download content for offline access');

      if (onDownloadError) {
        onDownloadError(error);
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleRemove = async () => {
    setDownloading(true);

    try {
      await offlineStorageManager.removeOfflineContent(contentType, contentId);
      message.success('Content removed from offline storage');
      setIsOffline(false);
    } catch (error) {
      console.error('Error removing content:', error);
      message.error('Failed to remove content from offline storage');
    } finally {
      setDownloading(false);
    }
  };

  if (checking) {
    return (
      <Button size={size} icon={<LoadingOutlined />} disabled>
        {!iconOnly && 'Checking...'}
      </Button>
    );
  }

  if (isOffline) {
    return (
      <Tooltip title="Remove from offline storage">
        <Button
          size={size}
          type="default"
          icon={<CheckCircleOutlined />}
          onClick={handleRemove}
          loading={downloading}
          style={{ color: '#52c41a', borderColor: '#52c41a' }}
        >
          {!iconOnly && (buttonText || 'Available Offline')}
        </Button>
      </Tooltip>
    );
  }

  return (
    <Tooltip title="Download for offline access">
      <Button
        size={size}
        type="default"
        icon={<CloudDownloadOutlined />}
        onClick={handleDownload}
        loading={downloading}
      >
        {!iconOnly && (buttonText || 'Download')}
      </Button>
    </Tooltip>
  );
};

export default DownloadButton;
