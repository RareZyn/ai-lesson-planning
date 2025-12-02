/**
 * Conflict Resolution Modal
 *
 * Interactive UI for resolving sync conflicts between local and server data.
 *
 * Features:
 * - Visual diff comparison
 * - Side-by-side field comparison
 * - Auto-resolve options (server/local/merge)
 * - Manual field selection
 * - Conflict severity indicators
 * - Resolution preview
 */

import React, { useState, useEffect } from 'react';
import { Modal, Tabs, Button, Alert, Radio, Space, Card, Tag, Descriptions, Divider, message } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  MergeCellsOutlined,
  CloudOutlined,
  LaptopOutlined,
  SwapOutlined
} from '@ant-design/icons';
import conflictDetectionService, {
  RESOLUTION_STRATEGIES,
  CONFLICT_SEVERITY
} from '../../services/offline/conflictDetectionService';
import './ConflictResolutionModal.css';

const { TabPane } = Tabs;

const ConflictResolutionModal = ({
  visible,
  conflict,
  onResolve,
  onCancel
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState(RESOLUTION_STRATEGIES.SERVER_WINS);
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);

  const generatePreview = React.useCallback((strategy) => {
    if (!conflict) return;

    const result = conflictDetectionService.autoResolveConflict(conflict, strategy);
    setPreviewData(result.data);
  }, [conflict]);

  useEffect(() => {
    if (conflict && visible) {
      setSelectedStrategy(conflict.recommendedStrategy || RESOLUTION_STRATEGIES.SERVER_WINS);
      generatePreview(conflict.recommendedStrategy || RESOLUTION_STRATEGIES.SERVER_WINS);
    }
  }, [conflict, visible, generatePreview]);

  const handleStrategyChange = (e) => {
    const strategy = e.target.value;
    setSelectedStrategy(strategy);
    generatePreview(strategy);
  };

  const handleResolve = async () => {
    try {
      setLoading(true);

      const result = conflictDetectionService.autoResolveConflict(conflict, selectedStrategy);
      if (!result.resolved) {
        message.error('Please select a resolution strategy');
        return;
      }

      const resolvedData = result.data;

      await onResolve(conflict._id, selectedStrategy, resolvedData);
      message.success('Conflict resolved successfully');
    } catch (error) {
      console.error('Error resolving conflict:', error);
      message.error('Failed to resolve conflict');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case CONFLICT_SEVERITY.LOW:
        return 'green';
      case CONFLICT_SEVERITY.MEDIUM:
        return 'orange';
      case CONFLICT_SEVERITY.HIGH:
        return 'red';
      default:
        return 'default';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case CONFLICT_SEVERITY.LOW:
        return <CheckCircleOutlined />;
      case CONFLICT_SEVERITY.MEDIUM:
        return <WarningOutlined />;
      case CONFLICT_SEVERITY.HIGH:
        return <CloseCircleOutlined />;
      default:
        return null;
    }
  };

  const renderFieldDiff = (field) => {
    const { field: fieldName, localValue, serverValue } = field;

    const isEqual = JSON.stringify(localValue) === JSON.stringify(serverValue);

    return (
      <div key={fieldName} className="conflict-field-diff">
        <h4>{fieldName}</h4>
        <div className="diff-comparison">
          <Card
            size="small"
            title={<><LaptopOutlined /> Local Version</>}
            className={isEqual ? 'diff-equal' : 'diff-different'}
          >
            <pre>{JSON.stringify(localValue, null, 2)}</pre>
          </Card>
          <div className="diff-arrow">
            <SwapOutlined />
          </div>
          <Card
            size="small"
            title={<><CloudOutlined /> Server Version</>}
            className={isEqual ? 'diff-equal' : 'diff-different'}
          >
            <pre>{JSON.stringify(serverValue, null, 2)}</pre>
          </Card>
        </div>
      </div>
    );
  };

  if (!conflict) return null;

  return (
    <Modal
      title={
        <Space>
          <WarningOutlined style={{ color: '#ff9800' }} />
          <span>Sync Conflict Detected</span>
          <Tag color={getSeverityColor(conflict.severity)} icon={getSeverityIcon(conflict.severity)}>
            {conflict.severity} SEVERITY
          </Tag>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={900}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button
          key="resolve"
          type="primary"
          onClick={handleResolve}
          loading={loading}
          icon={<CheckCircleOutlined />}
        >
          Resolve Conflict
        </Button>
      ]}
      className="conflict-resolution-modal"
    >
      <Alert
        message={conflict.description}
        description={`Conflict Type: ${conflict.type}`}
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Tabs defaultActiveKey="1">
        {/* Overview Tab */}
        <TabPane tab="Overview" key="1">
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Conflict Type" span={2}>
              <Tag color="orange">{conflict.type}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Severity">
              <Tag color={getSeverityColor(conflict.severity)}>
                {conflict.severity}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Resource Type">
              {conflict.resourceType}
            </Descriptions.Item>
            <Descriptions.Item label="Local Modified">
              {conflict.localModified ? new Date(conflict.localModified).toLocaleString() : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Server Modified">
              {conflict.serverModified ? new Date(conflict.serverModified).toLocaleString() : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Changed Fields" span={2}>
              <Tag color="blue">{conflict.changedFields?.length || 0} fields</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Recommended Strategy" span={2}>
              <Tag color="green" icon={<MergeCellsOutlined />}>
                {conflict.recommendedStrategy}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </TabPane>

        {/* Field Comparison Tab */}
        <TabPane tab={`Changed Fields (${conflict.changedFields?.length || 0})`} key="2">
          <div className="field-comparison">
            {conflict.changedFields && conflict.changedFields.length > 0 ? (
              conflict.changedFields.map(field => renderFieldDiff(field))
            ) : (
              <Alert message="No field changes detected" type="info" />
            )}
          </div>
        </TabPane>

        {/* Resolution Strategy Tab */}
        <TabPane tab="Resolution Strategy" key="3">
          <div className="resolution-strategy">
            <h3>Choose Resolution Strategy:</h3>

            <Radio.Group
              value={selectedStrategy}
              onChange={handleStrategyChange}
              style={{ width: '100%' }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Card
                  hoverable
                  className={selectedStrategy === RESOLUTION_STRATEGIES.SERVER_WINS ? 'strategy-selected' : ''}
                >
                  <Radio value={RESOLUTION_STRATEGIES.SERVER_WINS}>
                    <Space direction="vertical">
                      <strong><CloudOutlined /> Use Server Version</strong>
                      <span className="strategy-description">
                        Discard local changes and use the server version.
                        Recommended when server has the most up-to-date data.
                      </span>
                    </Space>
                  </Radio>
                </Card>

                <Card
                  hoverable
                  className={selectedStrategy === RESOLUTION_STRATEGIES.LOCAL_WINS ? 'strategy-selected' : ''}
                >
                  <Radio value={RESOLUTION_STRATEGIES.LOCAL_WINS}>
                    <Space direction="vertical">
                      <strong><LaptopOutlined /> Use Local Version</strong>
                      <span className="strategy-description">
                        Keep local changes and overwrite server version.
                        Use when you're confident local changes are correct.
                      </span>
                    </Space>
                  </Radio>
                </Card>

                <Card
                  hoverable
                  className={selectedStrategy === RESOLUTION_STRATEGIES.MERGE ? 'strategy-selected' : ''}
                >
                  <Radio value={RESOLUTION_STRATEGIES.MERGE}>
                    <Space direction="vertical">
                      <strong><MergeCellsOutlined /> Merge Versions</strong>
                      <span className="strategy-description">
                        Intelligently combine local and server changes.
                        Recommended for non-conflicting field changes.
                      </span>
                      {conflict.changedFields?.length > 5 && (
                        <Alert
                          message="Warning: Many fields changed. Manual review recommended."
                          type="warning"
                          showIcon
                          size="small"
                        />
                      )}
                    </Space>
                  </Radio>
                </Card>
              </Space>
            </Radio.Group>

            <Divider />

            {/* Preview */}
            <div className="resolution-preview">
              <h4>Resolution Preview:</h4>
              {previewData ? (
                <Card size="small">
                  <pre className="preview-data">
                    {JSON.stringify(previewData, null, 2)}
                  </pre>
                </Card>
              ) : (
                <Alert message="No preview available" type="info" />
              )}
            </div>
          </div>
        </TabPane>

        {/* Full Data Tab */}
        <TabPane tab="Full Data" key="4">
          <div className="full-data-view">
            <Card
              title={<><LaptopOutlined /> Local Version</>}
              size="small"
              style={{ marginBottom: 16 }}
            >
              <pre className="data-view">
                {JSON.stringify(conflict.localData, null, 2)}
              </pre>
            </Card>

            <Card
              title={<><CloudOutlined /> Server Version</>}
              size="small"
            >
              <pre className="data-view">
                {JSON.stringify(conflict.serverData, null, 2)}
              </pre>
            </Card>
          </div>
        </TabPane>
      </Tabs>
    </Modal>
  );
};

export default ConflictResolutionModal;
