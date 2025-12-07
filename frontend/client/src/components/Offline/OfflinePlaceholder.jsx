/**
 * Offline Placeholder Component
 *
 * Displays a placeholder/message when a feature requires internet connection
 * Used for AI-dependent features and online-only operations
 */

import React from 'react';
import { Alert, Button, Space, Typography, Card } from 'antd';
import { WifiOff, Sparkles, RefreshCw, Info } from 'lucide-react';
import './OfflinePlaceholder.css';

const { Title, Text, Paragraph } = Typography;

const OfflinePlaceholder = ({
  type = 'default', // 'default', 'ai', 'sync', 'feature'
  title,
  message,
  featureName,
  showIcon = true,
  showRetryButton = false,
  onRetry,
  compact = false,
  style = {},
  className = ''
}) => {
  // Default messages based on type
  const getDefaultContent = () => {
    switch (type) {
      case 'ai':
        return {
          title: title || 'AI Feature Unavailable Offline',
          message: message || `${featureName || 'This feature'} requires AI processing and needs an internet connection. Your other content is still accessible offline.`,
          icon: <Sparkles size={compact ? 24 : 48} />,
          color: '#722ed1'
        };

      case 'sync':
        return {
          title: title || 'Waiting for Connection',
          message: message || 'Your changes have been saved locally and will sync automatically when you\'re back online.',
          icon: <RefreshCw size={compact ? 24 : 48} />,
          color: '#fa8c16'
        };

      case 'feature':
        return {
          title: title || 'Online Connection Required',
          message: message || `${featureName || 'This feature'} is only available when connected to the internet.`,
          icon: <WifiOff size={compact ? 24 : 48} />,
          color: '#1890ff'
        };

      default:
        return {
          title: title || 'No Internet Connection',
          message: message || 'This content is not available offline. Please connect to the internet to access this feature.',
          icon: <WifiOff size={compact ? 24 : 48} />,
          color: '#8c8c8c'
        };
    }
  };

  const content = getDefaultContent();

  // Compact version for inline use
  if (compact) {
    return (
      <Alert
        type="info"
        message={content.title}
        description={content.message}
        showIcon={showIcon}
        icon={content.icon}
        style={style}
        className={`offline-placeholder-compact ${className}`}
        action={
          showRetryButton && onRetry ? (
            <Button size="small" onClick={onRetry} icon={<RefreshCw size={14} />}>
              Retry
            </Button>
          ) : null
        }
      />
    );
  }

  // Full version for page-level placeholders
  return (
    <div className={`offline-placeholder ${className}`} style={style}>
      <Card className="offline-placeholder-card">
        <Space direction="vertical" size="large" align="center" style={{ width: '100%' }}>
          {showIcon && (
            <div className="offline-placeholder-icon" style={{ color: content.color }}>
              {content.icon}
            </div>
          )}

          <div className="offline-placeholder-content">
            <Title level={3} style={{ textAlign: 'center', marginBottom: 8 }}>
              {content.title}
            </Title>

            <Paragraph style={{ textAlign: 'center', fontSize: '16px', color: '#595959' }}>
              {content.message}
            </Paragraph>
          </div>

          {type === 'ai' && (
            <Alert
              type="info"
              icon={<Info size={16} />}
              message="What you can do offline:"
              description={
                <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                  <li>View downloaded lesson plans and assessments</li>
                  <li>Edit existing content (will sync when online)</li>
                  <li>Browse classes and student information</li>
                  <li>Export content to PDF</li>
                </ul>
              }
              style={{ textAlign: 'left', maxWidth: 500 }}
            />
          )}

          {type === 'sync' && (
            <div className="offline-sync-pending">
              <RefreshCw size={16} className="spin-animation" style={{ marginRight: 8 }} />
              <Text type="secondary">Your changes are queued and will sync automatically</Text>
            </div>
          )}

          {showRetryButton && onRetry && (
            <Button type="primary" size="large" onClick={onRetry} icon={<RefreshCw size={18} />}>
              Try Again
            </Button>
          )}
        </Space>
      </Card>
    </div>
  );
};

// Specific placeholder variants for common use cases
export const AIFeaturePlaceholder = ({ featureName, compact = false, ...props }) => (
  <OfflinePlaceholder type="ai" featureName={featureName} compact={compact} {...props} />
);

export const SyncPendingPlaceholder = ({ compact = false, ...props }) => (
  <OfflinePlaceholder type="sync" compact={compact} {...props} />
);

export const OnlineOnlyPlaceholder = ({ featureName, compact = false, ...props }) => (
  <OfflinePlaceholder type="feature" featureName={featureName} compact={compact} {...props} />
);

export default OfflinePlaceholder;
