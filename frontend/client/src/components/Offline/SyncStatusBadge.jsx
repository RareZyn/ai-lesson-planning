/**
 * Sync Status Badge Component
 * Displays sync-specific status indicators for content
 * Features: Sync state visualization, last synced time, detailed tooltips
 */

import React from 'react';
import { Tag, Tooltip, Space } from 'antd';
import {
  CheckCircleOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CloudSyncOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const SyncStatusBadge = ({
  syncStatus = 'synced', // 'synced', 'pending', 'syncing', 'conflict', 'error', 'never'
  lastSyncedAt = null, // ISO timestamp or Date object
  version = null, // Version number for conflict detection
  showLastSynced = true,
  showVersion = false,
  size = 'default', // 'small', 'default', 'large'
  onClick = null,
  style = {}
}) => {
  const getStatusConfig = () => {
    switch (syncStatus) {
      case 'synced':
        return {
          icon: <CheckCircleOutlined />,
          color: 'success',
          text: 'Synced',
          className: 'sync-status-synced'
        };

      case 'pending':
        return {
          icon: <ClockCircleOutlined />,
          color: 'warning',
          text: 'Pending',
          className: 'sync-status-pending'
        };

      case 'syncing':
        return {
          icon: <SyncOutlined spin />,
          color: 'processing',
          text: 'Syncing',
          className: 'sync-status-syncing'
        };

      case 'conflict':
        return {
          icon: <ExclamationCircleOutlined />,
          color: 'error',
          text: 'Conflict',
          className: 'sync-status-conflict'
        };

      case 'error':
        return {
          icon: <CloseCircleOutlined />,
          color: 'error',
          text: 'Error',
          className: 'sync-status-error'
        };

      case 'never':
      default:
        return {
          icon: <CloudSyncOutlined />,
          color: 'default',
          text: 'Not Synced',
          className: 'sync-status-never'
        };
    }
  };

  const config = getStatusConfig();

  const getTooltipContent = () => {
    const parts = [];

    // Status
    parts.push(`Status: ${config.text}`);

    // Last synced time
    if (lastSyncedAt && showLastSynced) {
      const lastSync = dayjs(lastSyncedAt);
      parts.push(`Last synced: ${lastSync.fromNow()}`);
      parts.push(`(${lastSync.format('MMM D, YYYY h:mm A')})`);
    } else if (syncStatus === 'never') {
      parts.push('Never synced');
    }

    // Version info
    if (version !== null && showVersion) {
      parts.push(`Version: ${version}`);
    }

    // Additional status info
    switch (syncStatus) {
      case 'pending':
        parts.push('Will sync when online');
        break;
      case 'conflict':
        parts.push('⚠ Needs manual resolution');
        break;
      case 'error':
        parts.push('⚠ Last sync failed');
        break;
      case 'syncing':
        parts.push('⟳ Syncing in progress...');
        break;
      default:
        // No additional info for other statuses
        break;
    }

    return parts.join('\n');
  };

  const badge = (
    <Tag
      icon={config.icon}
      color={config.color}
      className={`sync-status-badge ${config.className}`}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        fontSize: size === 'small' ? '11px' : size === 'large' ? '14px' : '12px',
        padding: size === 'small' ? '2px 8px' : size === 'large' ? '6px 16px' : '4px 12px',
        ...style
      }}
      onClick={onClick}
    >
      <Space size={4}>
        <span>{config.text}</span>
        {lastSyncedAt && showLastSynced && syncStatus === 'synced' && (
          <span style={{ opacity: 0.7, fontSize: '90%' }}>
            ({dayjs(lastSyncedAt).fromNow()})
          </span>
        )}
      </Space>
    </Tag>
  );

  return (
    <Tooltip title={<div style={{ whiteSpace: 'pre-line' }}>{getTooltipContent()}</div>} placement="top">
      {badge}
    </Tooltip>
  );
};

/**
 * Compact Sync Status Badge - Icon only with tooltip
 */
export const SyncStatusBadgeCompact = ({
  syncStatus = 'synced',
  lastSyncedAt = null,
  onClick = null,
  style = {}
}) => {
  const getStatusConfig = () => {
    switch (syncStatus) {
      case 'synced':
        return {
          icon: <CheckCircleOutlined style={{ fontSize: 16, color: '#52c41a' }} />,
          tooltip: lastSyncedAt
            ? `Synced ${dayjs(lastSyncedAt).fromNow()}`
            : 'Synced'
        };

      case 'pending':
        return {
          icon: <ClockCircleOutlined style={{ fontSize: 16, color: '#faad14' }} />,
          tooltip: 'Pending sync'
        };

      case 'syncing':
        return {
          icon: <SyncOutlined spin style={{ fontSize: 16, color: '#1890ff' }} />,
          tooltip: 'Syncing...'
        };

      case 'conflict':
        return {
          icon: <ExclamationCircleOutlined style={{ fontSize: 16, color: '#ff4d4f' }} />,
          tooltip: 'Conflict - needs resolution'
        };

      case 'error':
        return {
          icon: <CloseCircleOutlined style={{ fontSize: 16, color: '#ff4d4f' }} />,
          tooltip: 'Sync error'
        };

      default:
        return {
          icon: <CloudSyncOutlined style={{ fontSize: 16, color: '#8c8c8c' }} />,
          tooltip: 'Not synced'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Tooltip title={config.tooltip}>
      <span
        style={{
          cursor: onClick ? 'pointer' : 'default',
          display: 'inline-flex',
          alignItems: 'center',
          padding: 4,
          ...style
        }}
        onClick={onClick}
      >
        {config.icon}
      </span>
    </Tooltip>
  );
};

/**
 * Sync Status with Progress - Shows sync progress percentage
 */
export const SyncStatusWithProgress = ({
  progress = 0, // 0-100
  status = 'syncing',
  style = {}
}) => {
  return (
    <Tag
      icon={<SyncOutlined spin />}
      color="processing"
      style={{
        ...style
      }}
    >
      Syncing {progress}%
    </Tag>
  );
};

/**
 * Last Synced Indicator - Simple text display
 */
export const LastSyncedIndicator = ({
  lastSyncedAt,
  prefix = 'Last synced',
  style = {}
}) => {
  if (!lastSyncedAt) {
    return (
      <span style={{ fontSize: 12, color: '#8c8c8c', ...style }}>
        Never synced
      </span>
    );
  }

  return (
    <Tooltip title={dayjs(lastSyncedAt).format('MMM D, YYYY h:mm A')}>
      <span style={{ fontSize: 12, color: '#8c8c8c', ...style }}>
        {prefix} {dayjs(lastSyncedAt).fromNow()}
      </span>
    </Tooltip>
  );
};

export default SyncStatusBadge;
