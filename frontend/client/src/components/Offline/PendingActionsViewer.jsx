/**
 * Pending Actions Viewer Component
 *
 * Displays all queued offline actions waiting to be synchronized
 * Shows status, allows manual retry, and provides action management
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  List,
  Tag,
  Button,
  Space,
  Typography,
  Empty,
  message,
  Statistic,
  Row,
  Col,
  Tooltip,
  Badge,
  Popconfirm
} from 'antd';
import {
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Trash2,
  Play,
  Info
} from 'lucide-react';
import offlineQueueService, { ACTION_STATUS } from '../../services/offline/offlineQueueService';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import './PendingActionsViewer.css';

const { Text } = Typography;

const PendingActionsViewer = ({ compact = false, showStats = true }) => {
  const [actions, setActions] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { online } = useNetworkStatus();

  // Load actions and stats
  const loadActions = async () => {
    try {
      setLoading(true);
      const [allActions, queueStats] = await Promise.all([
        offlineQueueService.getAllQueuedActions(),
        offlineQueueService.getQueueStats()
      ]);
      setActions(allActions);
      setStats(queueStats);
    } catch (error) {
      console.error('Error loading actions:', error);
      message.error('Failed to load pending actions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActions();

    // Listen for queue updates
    const handleActionQueued = () => loadActions();
    const handleActionUpdated = () => loadActions();
    const handleActionDeleted = () => loadActions();
    const handleSyncComplete = (event) => {
      loadActions();
      message.success(`Sync complete: ${event.detail.successful} successful, ${event.detail.failed} failed`);
    };

    window.addEventListener('offline-action-queued', handleActionQueued);
    window.addEventListener('offline-action-updated', handleActionUpdated);
    window.addEventListener('offline-action-deleted', handleActionDeleted);
    window.addEventListener('offline-sync-complete', handleSyncComplete);

    return () => {
      window.removeEventListener('offline-action-queued', handleActionQueued);
      window.removeEventListener('offline-action-updated', handleActionUpdated);
      window.removeEventListener('offline-action-deleted', handleActionDeleted);
      window.removeEventListener('offline-sync-complete', handleSyncComplete);
    };
  }, []);

  // Sync all pending actions
  const handleSyncAll = async () => {
    if (!online) {
      message.warning('Cannot sync while offline. Please connect to the internet.');
      return;
    }

    try {
      setSyncing(true);
      const results = await offlineQueueService.processPendingActions();

      if (results.successful > 0) {
        message.success(`Successfully synced ${results.successful} action(s)`);
      }

      if (results.failed > 0) {
        message.error(`Failed to sync ${results.failed} action(s)`);
      }

      loadActions();
    } catch (error) {
      console.error('Error syncing actions:', error);
      message.error('Failed to sync actions');
    } finally {
      setSyncing(false);
    }
  };

  // Retry failed actions
  const handleRetryFailed = async () => {
    if (!online) {
      message.warning('Cannot retry while offline. Please connect to the internet.');
      return;
    }

    try {
      setSyncing(true);
      const results = await offlineQueueService.retryFailedActions();

      if (results.successful > 0) {
        message.success(`Successfully retried ${results.successful} action(s)`);
      }

      if (results.failed > 0) {
        message.error(`${results.failed} action(s) still failed`);
      }

      loadActions();
    } catch (error) {
      console.error('Error retrying actions:', error);
      message.error('Failed to retry actions');
    } finally {
      setSyncing(false);
    }
  };

  // Delete an action
  const handleDeleteAction = async (actionId) => {
    try {
      await offlineQueueService.deleteAction(actionId);
      message.success('Action deleted');
      loadActions();
    } catch (error) {
      console.error('Error deleting action:', error);
      message.error('Failed to delete action');
    }
  };

  // Clear old completed actions
  const handleClearCompleted = async () => {
    try {
      const deletedCount = await offlineQueueService.clearOldActions(7);
      message.success(`Cleared ${deletedCount} old completed actions`);
      loadActions();
    } catch (error) {
      console.error('Error clearing completed actions:', error);
      message.error('Failed to clear completed actions');
    }
  };

  // Get status icon and color
  const getStatusDisplay = (status) => {
    switch (status) {
      case ACTION_STATUS.PENDING:
        return { icon: <Clock size={16} />, color: 'blue', text: 'Pending' };
      case ACTION_STATUS.PROCESSING:
        return { icon: <RefreshCw size={16} className="spin" />, color: 'orange', text: 'Processing' };
      case ACTION_STATUS.COMPLETED:
        return { icon: <CheckCircle size={16} />, color: 'green', text: 'Completed' };
      case ACTION_STATUS.FAILED:
        return { icon: <XCircle size={16} />, color: 'red', text: 'Failed' };
      case ACTION_STATUS.RETRY:
        return { icon: <AlertTriangle size={16} />, color: 'gold', text: 'Retry' };
      default:
        return { icon: <Info size={16} />, color: 'default', text: status };
    }
  };

  // Get action type display name
  const getActionTypeName = (actionType) => {
    return actionType.replace(/_/g, ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Render statistics
  const renderStats = () => {
    if (!showStats) return null;

    return (
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Total"
              value={stats.total || 0}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Pending"
              value={stats.pending || 0}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<Clock size={20} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Completed"
              value={stats.completed || 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircle size={20} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Failed"
              value={stats.failed || 0}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<XCircle size={20} />}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  // Render action list item
  const renderActionItem = (action) => {
    const statusDisplay = getStatusDisplay(action.status);

    return (
      <List.Item
        key={action.id}
        actions={[
          <Tooltip title="Delete action">
            <Popconfirm
              title="Delete this action?"
              description="This cannot be undone."
              onConfirm={() => handleDeleteAction(action.id)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Button
                type="text"
                size="small"
                icon={<Trash2 size={16} />}
                danger
              />
            </Popconfirm>
          </Tooltip>
        ]}
      >
        <List.Item.Meta
          title={
            <Space>
              <Tag color={statusDisplay.color} icon={statusDisplay.icon}>
                {statusDisplay.text}
              </Tag>
              <Text strong>{getActionTypeName(action.actionType)}</Text>
              {action.metadata?.displayName && (
                <Text type="secondary">- {action.metadata.displayName}</Text>
              )}
            </Space>
          }
          description={
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {action.metadata?.description && (
                <Text type="secondary">{action.metadata.description}</Text>
              )}
              <Space wrap>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Created: {new Date(action.createdAt).toLocaleString()}
                </Text>
                {action.attemptCount > 0 && (
                  <Tag color="orange">Attempts: {action.attemptCount}/{action.maxAttempts}</Tag>
                )}
                {action.lastError && (
                  <Tooltip title={action.lastError}>
                    <Tag color="red">Error</Tag>
                  </Tooltip>
                )}
              </Space>
            </Space>
          }
        />
      </List.Item>
    );
  };

  // Compact view
  if (compact) {
    const pendingCount = stats.pending || 0;
    const failedCount = stats.failed || 0;

    if (pendingCount === 0 && failedCount === 0) {
      return null;
    }

    return (
      <Card size="small" className="pending-actions-compact">
        <Space>
          <Badge count={pendingCount + failedCount} offset={[-5, 5]}>
            <RefreshCw size={20} className={syncing ? 'spin' : ''} />
          </Badge>
          <div>
            <Text strong>{pendingCount + failedCount} pending actions</Text>
            {online && (
              <Button
                type="link"
                size="small"
                onClick={handleSyncAll}
                loading={syncing}
              >
                Sync Now
              </Button>
            )}
          </div>
        </Space>
      </Card>
    );
  }

  // Full view
  return (
    <div className="pending-actions-viewer">
      <Card
        title={
          <Space>
            <RefreshCw size={20} />
            <span>Pending Actions Queue</span>
            {stats.pending > 0 && (
              <Badge count={stats.pending} showZero />
            )}
          </Space>
        }
        extra={
          <Space>
            {stats.pending > 0 && online && (
              <Button
                type="primary"
                icon={<Play size={16} />}
                onClick={handleSyncAll}
                loading={syncing}
              >
                Sync All
              </Button>
            )}
            {(stats.failed > 0 || stats.retry > 0) && online && (
              <Button
                icon={<RefreshCw size={16} />}
                onClick={handleRetryFailed}
                loading={syncing}
              >
                Retry Failed
              </Button>
            )}
            {stats.completed > 0 && (
              <Button
                icon={<Trash2 size={16} />}
                onClick={handleClearCompleted}
              >
                Clear Completed
              </Button>
            )}
            <Button
              icon={<RefreshCw size={16} />}
              onClick={loadActions}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>
        }
      >
        {renderStats()}

        <List
          loading={loading}
          dataSource={actions}
          renderItem={renderActionItem}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No pending actions"
              >
                <Text type="secondary">
                  Actions performed offline will appear here and sync automatically when online.
                </Text>
              </Empty>
            )
          }}
        />
      </Card>
    </div>
  );
};

export default PendingActionsViewer;
