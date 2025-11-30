/**
 * Storage Indicator Component
 * Displays storage usage and quota information
 */

import React, { useState, useEffect } from 'react';
import { Progress, Card, Typography, Space, Tag, Tooltip, Button } from 'antd';
import {
  DatabaseOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import {
  getStorageEstimate,
  getStorageStatus,
  formatBytes,
  requestPersistentStorage,
  isStoragePersisted
} from '../../services/offline/storageQuotaManager';

const { Text, Title } = Typography;

const StorageIndicator = ({ compact = false, showDetails = true }) => {
  const [storageInfo, setStorageInfo] = useState(null);
  const [status, setStatus] = useState(null);
  const [isPersisted, setIsPersisted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStorageInfo();
    checkPersistence();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadStorageInfo();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadStorageInfo = async () => {
    try {
      const estimate = await getStorageEstimate();
      const statusInfo = await getStorageStatus();
      setStorageInfo(estimate);
      setStatus(statusInfo);
    } catch (error) {
      console.error('Error loading storage info:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkPersistence = async () => {
    const persisted = await isStoragePersisted();
    setIsPersisted(persisted);
  };

  const handleRequestPersistence = async () => {
    const granted = await requestPersistentStorage();
    setIsPersisted(granted);
    if (granted) {
      alert('Persistent storage granted! Your offline data will be protected from automatic cleanup.');
    } else {
      alert('Persistent storage request was not granted. Your data may be cleared when storage is low.');
    }
  };

  if (loading) {
    return (
      <Card size="small" loading={true}>
        <Text>Loading storage info...</Text>
      </Card>
    );
  }

  if (!storageInfo) {
    return (
      <Card size="small">
        <Text type="secondary">Storage information not available</Text>
      </Card>
    );
  }

  const getStatusColor = () => {
    if (!status) return 'blue';
    switch (status.status) {
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      case 'critical':
        return 'error';
      case 'danger':
        return 'error';
      default:
        return 'normal';
    }
  };

  const getStatusIcon = () => {
    if (!status) return <DatabaseOutlined />;
    switch (status.status) {
      case 'healthy':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'warning':
      case 'critical':
      case 'danger':
        return <WarningOutlined style={{ color: '#faad14' }} />;
      default:
        return <DatabaseOutlined />;
    }
  };

  // Compact version for navbar/header
  if (compact) {
    return (
      <Tooltip
        title={
          <div>
            <div>
              <strong>Storage Usage</strong>
            </div>
            <div>
              Used: {storageInfo.usageInMB} MB / {storageInfo.quotaInMB} MB
            </div>
            <div>Available: {storageInfo.availableInMB} MB</div>
            <div>Status: {status?.message}</div>
          </div>
        }
      >
        <Space size="small">
          {getStatusIcon()}
          <Progress
            type="circle"
            percent={parseFloat(storageInfo.percentageUsed)}
            width={40}
            status={getStatusColor()}
            format={(percent) => `${percent}%`}
          />
        </Space>
      </Tooltip>
    );
  }

  // Full version for settings/offline page
  return (
    <Card
      title={
        <Space>
          <DatabaseOutlined />
          <span>Storage Usage</span>
        </Space>
      }
      extra={
        !isPersisted && (
          <Button size="small" type="link" onClick={handleRequestPersistence}>
            Request Persistent Storage
          </Button>
        )
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Status Tag */}
        <div>
          <Tag
            color={status?.color || 'blue'}
            icon={getStatusIcon()}
            style={{ marginBottom: 8 }}
          >
            {status?.message || 'Storage Available'}
          </Tag>
          {isPersisted && (
            <Tag color="green" icon={<CheckCircleOutlined />}>
              Persistent Storage Enabled
            </Tag>
          )}
        </div>

        {/* Progress Bar */}
        <div>
          <Progress
            percent={parseFloat(storageInfo.percentageUsed)}
            status={getStatusColor()}
            strokeColor={{
              '0%': '#108ee9',
              '50%': '#87d068',
              '75%': '#faad14',
              '100%': '#f5222d'
            }}
          />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {storageInfo.usageInMB} MB used of {storageInfo.quotaInMB} MB available
          </Text>
        </div>

        {/* Detailed Stats */}
        {showDetails && (
          <div style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                <Text>Used:</Text>
                <Text strong>{formatBytes(storageInfo.usageInBytes)}</Text>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                <Text>Total Quota:</Text>
                <Text strong>{formatBytes(storageInfo.quotaInBytes)}</Text>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                <Text>Available:</Text>
                <Text strong style={{ color: '#52c41a' }}>
                  {formatBytes(storageInfo.availableInBytes)}
                </Text>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0'
                }}
              >
                <Text>Percentage Used:</Text>
                <Text strong>{storageInfo.percentageUsed}%</Text>
              </div>
            </Space>
          </div>
        )}

        {/* Warning message if storage is low */}
        {status?.status === 'critical' || status?.status === 'danger' ? (
          <div
            style={{
              padding: 12,
              background: '#fff7e6',
              border: '1px solid #ffd591',
              borderRadius: 4,
              marginTop: 16
            }}
          >
            <Space>
              <WarningOutlined style={{ color: '#faad14' }} />
              <div>
                <Text strong>Storage is running low!</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Consider removing old offline content to free up space.
                </Text>
              </div>
            </Space>
          </div>
        ) : null}
      </Space>
    </Card>
  );
};

export default StorageIndicator;
