/**
 * Sync Progress Component
 *
 * Displays sync status, progress, and manual sync controls.
 *
 * Features:
 * - Real-time sync progress
 * - Manual sync trigger
 * - Last sync time display
 * - Sync statistics
 * - Sync history viewer
 * - Conflict indicator
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Progress,
  Space,
  Tag,
  Alert,
  Statistic,
  Row,
  Col,
  Timeline,
  message
} from 'antd';
import {
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  HistoryOutlined,
  CloudSyncOutlined
} from '@ant-design/icons';
import syncService, { SYNC_STATUS, SYNC_TYPES } from '../../services/offline/syncService';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import './SyncProgress.css';

const SyncProgress = ({ compact = false, showHistory = true }) => {
  const [syncStatus, setSyncStatus] = useState(SYNC_STATUS.IDLE);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [lastSync, setLastSync] = useState(null);
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const { offline } = useNetworkStatus();

  const loadSyncInfo = React.useCallback(async () => {
    try {
      const lastSyncTime = syncService.getLastSyncTime();
      setLastSync(lastSyncTime);

      const statistics = await syncService.getSyncStats();
      setStats(statistics);

      if (showHistory) {
        const syncHistory = await syncService.getSyncHistory(10);
        setHistory(syncHistory);
      }
    } catch (error) {
      console.error('Error loading sync info:', error);
    }
  }, [showHistory]);

  const handleSyncUpdate = React.useCallback((update) => {
    setSyncStatus(update.status);
    setProgress(update.progress || 0);
    setCurrentStep(update.step || '');

    if (update.conflicts) {
      setConflicts(update.conflicts);
    }

    if (update.status === SYNC_STATUS.SUCCESS || update.status === SYNC_STATUS.ERROR) {
      setTimeout(() => {
        setSyncStatus(SYNC_STATUS.IDLE);
        setProgress(0);
        setCurrentStep('');
      }, 3000);
    }
  }, []);

  useEffect(() => {
    loadSyncInfo();

    // Listen to sync updates
    const unsubscribe = syncService.addListener(handleSyncUpdate);

    // Listen to sync events
    const handleSyncComplete = () => {
      message.success('Sync completed successfully');
      loadSyncInfo();
    };

    const handleSyncError = (event) => {
      message.error(`Sync failed: ${event.detail.error}`);
      loadSyncInfo();
    };

    window.addEventListener('sync-complete', handleSyncComplete);
    window.addEventListener('sync-error', handleSyncError);

    return () => {
      unsubscribe();
      window.removeEventListener('sync-complete', handleSyncComplete);
      window.removeEventListener('sync-error', handleSyncError);
    };
  }, [loadSyncInfo, handleSyncUpdate]);

  const handleManualSync = async () => {
    if (offline) {
      message.warning('Cannot sync while offline');
      return;
    }

    if (syncService.isSyncing()) {
      message.info('Sync already in progress');
      return;
    }

    try {
      setSyncing(true);
      await syncService.sync(SYNC_TYPES.MANUAL);
    } catch (error) {
      // Error already handled by event listener
      console.error('Manual sync error:', error);
    } finally {
      setSyncing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case SYNC_STATUS.IDLE:
        return 'default';
      case SYNC_STATUS.SYNCING:
        return 'processing';
      case SYNC_STATUS.SUCCESS:
        return 'success';
      case SYNC_STATUS.ERROR:
        return 'error';
      case SYNC_STATUS.CONFLICT:
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case SYNC_STATUS.SYNCING:
        return <SyncOutlined spin />;
      case SYNC_STATUS.SUCCESS:
        return <CheckCircleOutlined />;
      case SYNC_STATUS.ERROR:
        return <CloseCircleOutlined />;
      case SYNC_STATUS.CONFLICT:
        return <WarningOutlined />;
      default:
        return <CloudSyncOutlined />;
    }
  };

  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return 'Never';

    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  // Compact mode
  if (compact) {
    return (
      <div className="sync-progress-compact">
        <Space>
          <Button
            icon={getStatusIcon(syncStatus)}
            onClick={handleManualSync}
            loading={syncing || syncStatus === SYNC_STATUS.SYNCING}
            disabled={offline}
            type={syncStatus === SYNC_STATUS.ERROR ? 'primary' : 'default'}
            danger={syncStatus === SYNC_STATUS.ERROR}
          >
            {lastSync ? formatRelativeTime(lastSync) : 'Sync Now'}
          </Button>

          {conflicts.length > 0 && (
            <Tag color="warning" icon={<WarningOutlined />}>
              {conflicts.length} conflicts
            </Tag>
          )}
        </Space>

        {syncStatus === SYNC_STATUS.SYNCING && (
          <Progress
            percent={progress}
            size="small"
            status="active"
            showInfo={false}
          />
        )}
      </div>
    );
  }

  // Full mode
  return (
    <div className="sync-progress">
      <Card
        title={
          <Space>
            <CloudSyncOutlined />
            <span>Synchronization</span>
            <Tag color={getStatusColor(syncStatus)} icon={getStatusIcon(syncStatus)}>
              {syncStatus}
            </Tag>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<SyncOutlined />}
            onClick={handleManualSync}
            loading={syncing || syncStatus === SYNC_STATUS.SYNCING}
            disabled={offline}
          >
            Sync Now
          </Button>
        }
      >
        {/* Sync Status */}
        {syncStatus === SYNC_STATUS.SYNCING && (
          <div className="sync-status">
            <Progress
              percent={progress}
              status="active"
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
            {currentStep && (
              <p className="sync-step">{currentStep}...</p>
            )}
          </div>
        )}

        {syncStatus === SYNC_STATUS.CONFLICT && (
          <Alert
            message="Conflicts Detected"
            description={`${conflicts.length} conflicts require manual resolution`}
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Statistics */}
        {stats && (
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Last Sync"
                  value={lastSync ? formatRelativeTime(lastSync) : 'Never'}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ fontSize: 16 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Total Syncs"
                  value={stats.totalSyncs}
                  prefix={<SyncOutlined />}
                  suffix={`(${stats.successful} ✓)`}
                  valueStyle={{ fontSize: 16 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Avg Duration"
                  value={formatDuration(stats.averageDuration)}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ fontSize: 16 }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* Sync History */}
        {showHistory && history.length > 0 && (
          <div className="sync-history" style={{ marginTop: 24 }}>
            <h4><HistoryOutlined /> Recent Sync History</h4>
            <Timeline mode="left">
              {history.map((entry) => (
                <Timeline.Item
                  key={entry._id}
                  color={
                    entry.status === SYNC_STATUS.SUCCESS ? 'green' :
                    entry.status === SYNC_STATUS.ERROR ? 'red' :
                    entry.status === SYNC_STATUS.CONFLICT ? 'orange' : 'blue'
                  }
                  dot={getStatusIcon(entry.status)}
                >
                  <Space direction="vertical" size="small">
                    <Space>
                      <Tag color={getStatusColor(entry.status)}>
                        {entry.syncType}
                      </Tag>
                      <span className="sync-time">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </Space>

                    {entry.duration && (
                      <span className="sync-duration">
                        Duration: {formatDuration(entry.duration)}
                      </span>
                    )}

                    {entry.queueResults && (
                      <span className="sync-results">
                        Synced: {entry.queueResults.successful || 0} items
                      </span>
                    )}

                    {entry.error && (
                      <Alert
                        message={entry.error}
                        type="error"
                        size="small"
                        showIcon
                      />
                    )}
                  </Space>
                </Timeline.Item>
              ))}
            </Timeline>
          </div>
        )}
      </Card>
    </div>
  );
};

export default SyncProgress;
