/**
 * Conflicts Manager Component
 *
 * Displays all pending sync conflicts and allows batch resolution.
 *
 * Features:
 * - List all pending conflicts
 * - Filter by severity/type/resource
 * - Bulk resolution options
 * - Individual conflict resolution
 * - Statistics dashboard
 * - Auto-refresh on conflict events
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  List,
  Tag,
  Button,
  Space,
  Empty,
  Statistic,
  Row,
  Col,
  Select,
  Badge,
  Tooltip,
  message,
  Popconfirm
} from 'antd';
import {
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CloudSyncOutlined,
  DeleteOutlined,
  FilterOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import conflictDetectionService, {
  CONFLICT_SEVERITY,
  CONFLICT_TYPES,
  RESOLUTION_STRATEGIES
} from '../../services/offline/conflictDetectionService';
import ConflictResolutionModal from './ConflictResolutionModal';
import './ConflictsManager.css';

const { Option } = Select;

const ConflictsManager = ({ compact = false }) => {
  const [conflicts, setConflicts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState(null);
  const [filterType, setFilterType] = useState(null);

  useEffect(() => {
    loadConflicts();
    loadStats();

    // Listen for conflict events
    const handleConflictDetected = () => {
      loadConflicts();
      loadStats();
    };

    const handleConflictResolved = () => {
      loadConflicts();
      loadStats();
      message.success('Conflict resolved');
    };

    window.addEventListener('conflict-detected', handleConflictDetected);
    window.addEventListener('conflict-resolved', handleConflictResolved);

    return () => {
      window.removeEventListener('conflict-detected', handleConflictDetected);
      window.removeEventListener('conflict-resolved', handleConflictResolved);
    };
  }, []);

  const loadConflicts = async () => {
    try {
      setLoading(true);
      const pending = await conflictDetectionService.getPendingConflicts();
      setConflicts(pending);
    } catch (error) {
      console.error('Error loading conflicts:', error);
      message.error('Failed to load conflicts');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statistics = await conflictDetectionService.getConflictStats();
      setStats(statistics);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleResolve = async (conflictId, strategy, customData) => {
    try {
      await conflictDetectionService.resolveConflict(conflictId, strategy, customData);
      setModalVisible(false);
      setSelectedConflict(null);
    } catch (error) {
      console.error('Error resolving conflict:', error);
      message.error('Failed to resolve conflict');
    }
  };

  const handleAutoResolveAll = async (strategy) => {
    try {
      setLoading(true);
      let resolved = 0;
      let failed = 0;

      for (const conflict of conflicts) {
        // Only auto-resolve LOW and MEDIUM severity
        if (conflict.severity === CONFLICT_SEVERITY.HIGH) {
          continue;
        }

        try {
          await conflictDetectionService.resolveConflict(conflict._id, strategy);
          resolved++;
        } catch (error) {
          console.error('Failed to resolve conflict:', error);
          failed++;
        }
      }

      message.success(`Resolved ${resolved} conflicts${failed > 0 ? `, ${failed} failed` : ''}`);
      loadConflicts();
      loadStats();
    } catch (error) {
      console.error('Error auto-resolving:', error);
      message.error('Failed to auto-resolve conflicts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (conflictId) => {
    try {
      await conflictDetectionService.deleteConflict(conflictId);
      message.success('Conflict deleted');
      loadConflicts();
      loadStats();
    } catch (error) {
      console.error('Error deleting conflict:', error);
      message.error('Failed to delete conflict');
    }
  };

  const handleClearResolved = async () => {
    try {
      setLoading(true);
      const deleted = await conflictDetectionService.clearOldConflicts(0); // Clear all resolved
      message.success(`Cleared ${deleted} resolved conflicts`);
      loadStats();
    } catch (error) {
      console.error('Error clearing:', error);
      message.error('Failed to clear conflicts');
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

  const getTypeColor = (type) => {
    switch (type) {
      case CONFLICT_TYPES.UPDATE_CONFLICT:
        return 'blue';
      case CONFLICT_TYPES.DELETE_CONFLICT:
        return 'red';
      case CONFLICT_TYPES.CREATE_CONFLICT:
        return 'green';
      case CONFLICT_TYPES.VERSION_MISMATCH:
        return 'orange';
      default:
        return 'default';
    }
  };

  const filteredConflicts = conflicts.filter(conflict => {
    if (filterSeverity && conflict.severity !== filterSeverity) return false;
    if (filterType && conflict.type !== filterType) return false;
    return true;
  });

  // Compact mode - show badge only
  if (compact) {
    return (
      <>
        <Badge count={conflicts.length} showZero={false}>
          <Button
            icon={<WarningOutlined />}
            onClick={() => setModalVisible(true)}
            danger={conflicts.length > 0}
          >
            Conflicts
          </Button>
        </Badge>

        {modalVisible && (
          <ConflictResolutionModal
            visible={modalVisible}
            conflict={selectedConflict}
            onResolve={handleResolve}
            onCancel={() => {
              setModalVisible(false);
              setSelectedConflict(null);
            }}
          />
        )}
      </>
    );
  }

  // Full mode
  return (
    <div className="conflicts-manager">
      {/* Statistics */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Total Conflicts"
                value={stats.total}
                prefix={<WarningOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Pending"
                value={stats.pending}
                valueStyle={{ color: '#ff9800' }}
                prefix={<CloseCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Resolved"
                value={stats.resolved}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="High Severity"
                value={stats.bySeverity[CONFLICT_SEVERITY.HIGH] || 0}
                valueStyle={{ color: '#f5222d' }}
                prefix={<WarningOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Actions & Filters */}
      <Card className="conflicts-actions">
        <Space wrap>
          <Button
            icon={<ReloadOutlined />}
            onClick={loadConflicts}
            loading={loading}
          >
            Refresh
          </Button>

          <Popconfirm
            title="Resolve all low/medium severity conflicts?"
            description="High severity conflicts will require manual resolution"
            onConfirm={() => handleAutoResolveAll(RESOLUTION_STRATEGIES.SERVER_WINS)}
            okText="Server Wins"
          >
            <Button icon={<CloudSyncOutlined />} type="primary">
              Auto-Resolve (Server)
            </Button>
          </Popconfirm>

          <Popconfirm
            title="Merge all low/medium severity conflicts?"
            description="High severity conflicts will require manual resolution"
            onConfirm={() => handleAutoResolveAll(RESOLUTION_STRATEGIES.MERGE)}
            okText="Merge"
          >
            <Button icon={<CloudSyncOutlined />}>
              Auto-Resolve (Merge)
            </Button>
          </Popconfirm>

          {stats && stats.resolved > 0 && (
            <Popconfirm
              title="Clear all resolved conflicts?"
              onConfirm={handleClearResolved}
              okText="Clear"
            >
              <Button icon={<DeleteOutlined />} danger>
                Clear Resolved
              </Button>
            </Popconfirm>
          )}
        </Space>

        <Space style={{ marginTop: 12 }}>
          <FilterOutlined />
          <Select
            placeholder="Filter by severity"
            allowClear
            style={{ width: 150 }}
            onChange={setFilterSeverity}
            value={filterSeverity}
          >
            {Object.values(CONFLICT_SEVERITY).map(severity => (
              <Option key={severity} value={severity}>
                {severity}
              </Option>
            ))}
          </Select>

          <Select
            placeholder="Filter by type"
            allowClear
            style={{ width: 180 }}
            onChange={setFilterType}
            value={filterType}
          >
            {Object.values(CONFLICT_TYPES).map(type => (
              <Option key={type} value={type}>
                {type}
              </Option>
            ))}
          </Select>
        </Space>
      </Card>

      {/* Conflicts List */}
      {filteredConflicts.length === 0 ? (
        <Card>
          <Empty
            description={
              conflicts.length === 0
                ? "No conflicts detected"
                : "No conflicts match the selected filters"
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      ) : (
        <List
          dataSource={filteredConflicts}
          loading={loading}
          renderItem={conflict => (
            <Card className="conflict-item" style={{ marginBottom: 12 }}>
              <List.Item
                actions={[
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => {
                      setSelectedConflict(conflict);
                      setModalVisible(true);
                    }}
                  >
                    Resolve
                  </Button>,
                  <Popconfirm
                    title="Delete this conflict?"
                    onConfirm={() => handleDelete(conflict._id)}
                    okText="Delete"
                    okButtonProps={{ danger: true }}
                  >
                    <Button danger size="small" icon={<DeleteOutlined />} />
                  </Popconfirm>
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Tag color={getSeverityColor(conflict.severity)}>
                        {conflict.severity}
                      </Tag>
                      <Tag color={getTypeColor(conflict.type)}>
                        {conflict.type}
                      </Tag>
                      <Tag>{conflict.resourceType}</Tag>
                    </Space>
                  }
                  description={
                    <div>
                      <p>{conflict.description}</p>
                      <Space size="small">
                        <Tooltip title="Changed fields">
                          <Tag color="blue">
                            {conflict.changedFields?.length || 0} fields changed
                          </Tag>
                        </Tooltip>
                        <Tooltip title="Recommended strategy">
                          <Tag color="green">
                            Recommended: {conflict.recommendedStrategy}
                          </Tag>
                        </Tooltip>
                        {conflict.createdAt && (
                          <span className="conflict-time">
                            Detected: {new Date(conflict.createdAt).toLocaleString()}
                          </span>
                        )}
                      </Space>
                    </div>
                  }
                />
              </List.Item>
            </Card>
          )}
        />
      )}

      {/* Resolution Modal */}
      <ConflictResolutionModal
        visible={modalVisible}
        conflict={selectedConflict}
        onResolve={handleResolve}
        onCancel={() => {
          setModalVisible(false);
          setSelectedConflict(null);
        }}
      />
    </div>
  );
};

export default ConflictsManager;
