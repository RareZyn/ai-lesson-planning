/**
 * Bulk Download Button Component
 * Allows downloading multiple items for offline access at once
 * Features: Selection modal, progress tracking, batch operations
 */

import React, { useState, useCallback } from 'react';
import { Button, Modal, List, Checkbox, Progress, message, Space, Tag, Alert } from 'antd';
import {
  CloudDownloadOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  CloseCircleOutlined,
  DatabaseOutlined
} from '@ant-design/icons';

import offlineStorageManager, { DOWNLOAD_TYPES } from '../../services/offline/offlineStorageManager';
import { hasEnoughSpace, estimateDataSize, getStorageStatus } from '../../services/offline/storageQuotaManager';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

const BulkDownloadButton = ({
  items = [], // Array of { id, title, type, data }
  contentType, // 'lesson', 'assessment', 'class'
  onDownloadComplete = null,
  onDownloadError = null,
  size = 'middle',
  buttonText = 'Bulk Download',
  disabled = false
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({});
  const [totalProgress, setTotalProgress] = useState(0);
  const [results, setResults] = useState({ success: [], failed: [] });
  const [estimatedSize, setEstimatedSize] = useState(null);
  const { online } = useNetworkStatus();

  const showModal = useCallback(async () => {
    if (!online) {
      message.warning('You must be online to download content');
      return;
    }

    // Check storage status
    try {
      const storageStatus = await getStorageStatus();
      if (storageStatus.status === 'danger') {
        Modal.warning({
          title: 'Storage Almost Full',
          content: 'Your offline storage is almost full. Please clear some space before downloading more content.',
          okText: 'OK'
        });
        return;
      }
    } catch (error) {
      console.error('Error checking storage:', error);
    }

    setModalVisible(true);

    // Pre-select items that are not yet offline
    const notOfflineIds = [];
    for (const item of items) {
      const isOffline = await offlineStorageManager.isContentOffline(contentType, item.id);
      if (!isOffline) {
        notOfflineIds.push(item.id);
      }
    }
    setSelectedIds(notOfflineIds);

    // Estimate total size
    if (items.length > 0 && items[0].data) {
      const totalSize = items
        .filter(item => notOfflineIds.includes(item.id))
        .reduce((sum, item) => {
          const size = estimateDataSize(item.data);
          return sum + size.bytes;
        }, 0);

      setEstimatedSize({
        bytes: totalSize,
        readable: formatBytes(totalSize)
      });
    }
  }, [items, contentType, online]);

  const handleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(item => item.id));
    }
  };

  const handleSelectItem = (id) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(itemId => itemId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleDownload = async () => {
    if (selectedIds.length === 0) {
      message.warning('Please select at least one item to download');
      return;
    }

    // Check storage space
    if (estimatedSize) {
      const hasSpace = await hasEnoughSpace(estimatedSize.bytes);
      if (!hasSpace) {
        message.error(
          `Not enough storage space. Need approximately ${estimatedSize.readable}. Please free up some space and try again.`
        );
        return;
      }
    }

    setDownloading(true);
    setResults({ success: [], failed: [] });
    setDownloadProgress({});
    setTotalProgress(0);

    const selectedItems = items.filter(item => selectedIds.includes(item.id));
    let completedCount = 0;
    const successList = [];
    const failedList = [];

    for (const item of selectedItems) {
      try {
        // Update progress for this item
        setDownloadProgress(prev => ({
          ...prev,
          [item.id]: { status: 'downloading', progress: 0 }
        }));

        const onProgress = (progressValue) => {
          setDownloadProgress(prev => ({
            ...prev,
            [item.id]: { status: 'downloading', progress: progressValue }
          }));
        };

        // Download based on type
        switch (contentType) {
          case DOWNLOAD_TYPES.LESSON:
            await offlineStorageManager.downloadLesson(item.id, onProgress);
            break;
          case DOWNLOAD_TYPES.ASSESSMENT:
            await offlineStorageManager.downloadAssessment(item.id, onProgress);
            break;
          case DOWNLOAD_TYPES.CLASS:
            await offlineStorageManager.downloadClass(item.id, true, onProgress);
            break;
          default:
            throw new Error('Invalid content type');
        }

        // Mark as complete
        setDownloadProgress(prev => ({
          ...prev,
          [item.id]: { status: 'success', progress: 100 }
        }));

        successList.push({ id: item.id, title: item.title });
      } catch (error) {
        console.error(`Error downloading ${item.title}:`, error);

        // Mark as failed
        setDownloadProgress(prev => ({
          ...prev,
          [item.id]: { status: 'failed', progress: 0, error: error.message }
        }));

        failedList.push({ id: item.id, title: item.title, error: error.message });
      }

      // Update total progress
      completedCount++;
      const progress = Math.round((completedCount / selectedItems.length) * 100);
      setTotalProgress(progress);
    }

    setResults({ success: successList, failed: failedList });
    setDownloading(false);

    // Show summary message
    if (failedList.length === 0) {
      message.success({
        content: `Successfully downloaded ${successList.length} item(s) for offline access`,
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />
      });

      if (onDownloadComplete) {
        onDownloadComplete({ success: successList, failed: failedList });
      }

      // Close modal after short delay
      setTimeout(() => {
        setModalVisible(false);
        setSelectedIds([]);
        setDownloadProgress({});
        setResults({ success: [], failed: [] });
      }, 1500);
    } else {
      message.warning(
        `Downloaded ${successList.length} item(s), ${failedList.length} failed`
      );

      if (onDownloadError) {
        onDownloadError(failedList);
      }
    }
  };

  const handleCancel = () => {
    if (downloading) {
      Modal.confirm({
        title: 'Cancel Downloads?',
        content: 'Do you want to cancel the ongoing downloads?',
        okText: 'Yes, Cancel',
        cancelText: 'No, Continue',
        onOk: () => {
          setDownloading(false);
          setModalVisible(false);
          setDownloadProgress({});
          setResults({ success: [], failed: [] });
        }
      });
    } else {
      setModalVisible(false);
      setSelectedIds([]);
      setDownloadProgress({});
      setResults({ success: [], failed: [] });
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const getItemStatus = (itemId) => {
    const progress = downloadProgress[itemId];
    if (!progress) return null;

    switch (progress.status) {
      case 'downloading':
        return (
          <Space>
            <LoadingOutlined style={{ color: '#1890ff' }} />
            <Progress
              type="circle"
              percent={progress.progress}
              width={30}
              strokeColor="#1890ff"
            />
          </Space>
        );
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />;
      case 'failed':
        return (
          <Space>
            <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
            <Tag color="error">Failed</Tag>
          </Space>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Button
        size={size}
        type="primary"
        icon={<CloudDownloadOutlined />}
        onClick={showModal}
        disabled={disabled || !online || items.length === 0}
      >
        {buttonText}
      </Button>

      <Modal
        title={
          <Space>
            <DatabaseOutlined />
            <span>Bulk Download for Offline Access</span>
          </Space>
        }
        open={modalVisible}
        onCancel={handleCancel}
        width={700}
        footer={[
          <Button key="cancel" onClick={handleCancel} disabled={downloading}>
            {downloading ? 'Close' : 'Cancel'}
          </Button>,
          !downloading && (
            <Button
              key="download"
              type="primary"
              icon={<CloudDownloadOutlined />}
              onClick={handleDownload}
              disabled={selectedIds.length === 0}
            >
              Download Selected ({selectedIds.length})
            </Button>
          )
        ]}
      >
        {/* Storage info */}
        {estimatedSize && (
          <Alert
            message={`Estimated size: ${estimatedSize.readable} for ${selectedIds.length} item(s)`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Overall progress */}
        {downloading && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8 }}>
              Overall Progress: {totalProgress}%
            </div>
            <Progress
              percent={totalProgress}
              status={totalProgress === 100 ? 'success' : 'active'}
            />
          </div>
        )}

        {/* Results summary */}
        {results.success.length > 0 && (
          <Alert
            message={`Successfully downloaded ${results.success.length} item(s)`}
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {results.failed.length > 0 && (
          <Alert
            message={`Failed to download ${results.failed.length} item(s)`}
            description={
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {results.failed.map(item => (
                  <li key={item.id}>{item.title}: {item.error}</li>
                ))}
              </ul>
            }
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Item list */}
        <div style={{ marginBottom: 16 }}>
          <Checkbox
            checked={selectedIds.length === items.length}
            indeterminate={selectedIds.length > 0 && selectedIds.length < items.length}
            onChange={handleSelectAll}
            disabled={downloading}
          >
            Select All ({items.length} items)
          </Checkbox>
        </div>

        <List
          dataSource={items}
          size="small"
          style={{ maxHeight: 400, overflowY: 'auto' }}
          renderItem={(item) => (
            <List.Item
              key={item.id}
              extra={getItemStatus(item.id)}
              style={{
                opacity: downloading && !downloadProgress[item.id] ? 0.5 : 1
              }}
            >
              <Checkbox
                checked={selectedIds.includes(item.id)}
                onChange={() => handleSelectItem(item.id)}
                disabled={downloading}
                style={{ marginRight: 12 }}
              />
              <List.Item.Meta
                title={item.title}
                description={
                  item.data ? (
                    <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                      Size: {estimateDataSize(item.data).readable}
                    </span>
                  ) : null
                }
              />
            </List.Item>
          )}
        />
      </Modal>
    </>
  );
};

export default BulkDownloadButton;
