/**
 * Offline Badge Component
 * Visual indicator showing offline availability status of content
 * Features: Color-coded statuses, tooltips, clickable actions
 */

import React from 'react';
import { Tag, Tooltip } from 'antd';
import {
  CloudDownloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  DisconnectOutlined,
  SyncOutlined
} from '@ant-design/icons';
import './OfflineBadge.css';

const OfflineBadge = ({
  status = 'online-only', // 'available', 'pending', 'conflict', 'online-only', 'syncing'
  size = 'default', // 'small', 'default', 'large'
  showTooltip = true,
  onClick = null,
  style = {},
  className = ''
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'available':
        return {
          icon: <CheckCircleOutlined />,
          color: 'success',
          text: 'Available Offline',
          tooltip: 'This content is available offline',
          className: 'offline-badge-available'
        };

      case 'pending':
        return {
          icon: <ClockCircleOutlined />,
          color: 'warning',
          text: 'Pending Sync',
          tooltip: 'Changes pending sync when online',
          className: 'offline-badge-pending'
        };

      case 'conflict':
        return {
          icon: <ExclamationCircleOutlined />,
          color: 'error',
          text: 'Conflict',
          tooltip: 'Conflict detected - needs resolution',
          className: 'offline-badge-conflict'
        };

      case 'syncing':
        return {
          icon: <SyncOutlined spin />,
          color: 'processing',
          text: 'Syncing',
          tooltip: 'Currently syncing...',
          className: 'offline-badge-syncing'
        };

      case 'online-only':
      default:
        return {
          icon: <DisconnectOutlined />,
          color: 'default',
          text: 'Online Only',
          tooltip: 'Not available offline - download to access offline',
          className: 'offline-badge-online-only'
        };
    }
  };

  const config = getStatusConfig();

  const badge = (
    <Tag
      icon={config.icon}
      color={config.color}
      className={`offline-badge offline-badge-${size} ${config.className} ${className}`}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        ...style
      }}
      onClick={onClick}
    >
      {config.text}
    </Tag>
  );

  if (showTooltip) {
    return (
      <Tooltip title={config.tooltip} placement="top">
        {badge}
      </Tooltip>
    );
  }

  return badge;
};

/**
 * Compact version of OfflineBadge - shows only icon
 */
export const OfflineBadgeCompact = ({
  status = 'online-only',
  showTooltip = true,
  onClick = null,
  style = {}
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'available':
        return {
          icon: <CheckCircleOutlined style={{ fontSize: 18, color: '#52c41a' }} />,
          tooltip: 'Available offline'
        };

      case 'pending':
        return {
          icon: <ClockCircleOutlined style={{ fontSize: 18, color: '#faad14' }} />,
          tooltip: 'Pending sync'
        };

      case 'conflict':
        return {
          icon: <ExclamationCircleOutlined style={{ fontSize: 18, color: '#ff4d4f' }} />,
          tooltip: 'Conflict'
        };

      case 'syncing':
        return {
          icon: <SyncOutlined spin style={{ fontSize: 18, color: '#1890ff' }} />,
          tooltip: 'Syncing...'
        };

      case 'online-only':
      default:
        return {
          icon: <CloudDownloadOutlined style={{ fontSize: 18, color: '#8c8c8c' }} />,
          tooltip: 'Click to download'
        };
    }
  };

  const config = getStatusConfig();

  const icon = (
    <span
      className="offline-badge-compact"
      style={{
        cursor: onClick ? 'pointer' : 'default',
        display: 'inline-flex',
        alignItems: 'center',
        ...style
      }}
      onClick={onClick}
    >
      {config.icon}
    </span>
  );

  if (showTooltip) {
    return <Tooltip title={config.tooltip}>{icon}</Tooltip>;
  }

  return icon;
};

/**
 * Status indicator with count badge
 */
export const OfflineBadgeWithCount = ({
  status = 'pending',
  count = 0,
  showTooltip = true,
  onClick = null
}) => {
  if (count === 0) return null;

  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          color: 'warning',
          text: `${count} Pending`,
          tooltip: `${count} item(s) pending sync`
        };

      case 'conflict':
        return {
          color: 'error',
          text: `${count} Conflict${count > 1 ? 's' : ''}`,
          tooltip: `${count} conflict(s) need resolution`
        };

      case 'syncing':
        return {
          color: 'processing',
          text: `${count} Syncing`,
          tooltip: `${count} item(s) syncing`
        };

      default:
        return {
          color: 'default',
          text: count.toString(),
          tooltip: `${count} item(s)`
        };
    }
  };

  const config = getStatusConfig();

  const badge = (
    <Tag
      color={config.color}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        fontWeight: 500
      }}
      onClick={onClick}
    >
      {config.text}
    </Tag>
  );

  if (showTooltip) {
    return <Tooltip title={config.tooltip}>{badge}</Tooltip>;
  }

  return badge;
};

export default OfflineBadge;
