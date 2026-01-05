import React from 'react';
import { Card, Tag, Button, Spin, Empty, Tooltip, Divider, Typography, Space } from 'antd';
import {
    BulbOutlined,
    CalendarOutlined,
    BookOutlined,
    FileTextOutlined,
    ReloadOutlined,
    CheckCircleOutlined,
    ThunderboltFilled,
    CloseOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const SmartSuggestionPanel = ({
    loading,
    suggestions,
    patterns,
    onApplyTopic,
    onApplyDate,
    onApplyActivity,
    onApplyResource,
    onRefresh,
    onDismiss,
    appliedSuggestions = []
}) => {
    const isApplied = (type) => appliedSuggestions.includes(type);

    if (loading) {
        return (
            <Card
                className="smart-suggestion-panel"
                style={{
                    background: 'linear-gradient(135deg, #fffbe6 0%, #ffffff 100%)',
                    border: '1px solid #ffe58f',
                    borderRadius: '16px',
                    boxShadow: '0 8px 24px rgba(250, 173, 20, 0.12)'
                }}
            >
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <Spin size="large" indicator={<ThunderboltFilled style={{ fontSize: 36, color: '#faad14' }} spin />} />
                    <Title level={5} style={{ marginTop: 16, color: '#faad14' }}>Analyzing patterns...</Title>
                    <Text type="secondary">Looking at your last {patterns?.lessonCount || 30} lessons.</Text>
                </div>
            </Card>
        );
    }

    if (!suggestions) {
        return (
            <Card className="smart-suggestion-panel" style={{ borderRadius: '16px', border: '1px solid #f0f0f0' }}>
                <div style={{ position: 'absolute', right: 8, top: 8, zIndex: 1 }}>
                    <Button type="text" size="small" icon={<CloseOutlined />} onClick={onDismiss} />
                </div>
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                        <span>
                            <Text strong>No Smart Suggestions Yet</Text><br />
                            <Text type="secondary">Create a few more lessons/class specific lessons to train your personal AI assistant!</Text>
                        </span>
                    }
                />
            </Card>
        );
    }

    return (
        <Card
            title={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <Space>
                        <div style={{
                            backgroundColor: '#fff7e6',
                            padding: '6px',
                            borderRadius: '8px',
                            display: 'flex'
                        }}>
                            <ThunderboltFilled style={{ color: '#faad14', fontSize: '16px' }} />
                        </div>
                        <span style={{ color: '#262626', fontWeight: 600, fontSize: '15px' }}>Smart Suggestions</span>
                        {patterns?.confidence === 'high' && <Tag color="gold" style={{ borderRadius: '12px', border: 'none', background: '#fff7e6', color: '#faad14' }}>High Confidence</Tag>}
                    </Space>
                    <Space>
                        <Tooltip title="Refresh">
                            <Button type="text" shape="circle" icon={<ReloadOutlined style={{ color: '#8c8c8c' }} />} onClick={onRefresh} />
                        </Tooltip>
                        <Tooltip title="Close">
                            <Button type="text" shape="circle" icon={<CloseOutlined style={{ color: '#8c8c8c' }} />} onClick={onDismiss} />
                        </Tooltip>
                    </Space>
                </div>
            }
            style={{
                background: '#ffffff',
                border: '1px solid #ffe58f',
                borderRadius: '16px',
                marginBottom: 24,
                boxShadow: '0 8px 24px rgba(230, 230, 230, 0.5)',
                overflow: 'hidden'
            }}
            headStyle={{
                borderBottom: '1px solid #fff1b8',
                background: 'linear-gradient(to right, #fffdf2, #ffffff)',
                padding: '12px 16px'
            }}
            bodyStyle={{ padding: '20px' }}
        >

            {suggestions.sowTopic && (
                <div className="suggestion-item" style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Space align="start">
                            <BookOutlined style={{ fontSize: 18, color: '#faad14', marginTop: 4 }} />
                            <div>
                                <Text strong style={{ fontSize: 15 }}>{suggestions.sowTopic.title}</Text>
                                <div><Text type="secondary" style={{ fontSize: 12 }}>{suggestions.sowTopic.rationale}</Text></div>
                            </div>
                        </Space>
                        <Button
                            size="small"
                            type={isApplied('sowTopic') ? "text" : "primary"}
                            ghost={!isApplied('sowTopic')}
                            icon={isApplied('sowTopic') ? <CheckCircleOutlined /> : null}
                            onClick={() => onApplyTopic(suggestions.sowTopic)}
                            disabled={isApplied('sowTopic')}
                            style={isApplied('sowTopic') ? { color: '#52c41a' } : { borderColor: '#faad14', color: '#faad14' }}
                        >
                            {isApplied('sowTopic') ? "Applied" : "Apply"}
                        </Button>
                    </div>
                </div>
            )}

            <Divider style={{ margin: '12px 0' }} />

            {suggestions.suggestedDate && (
                <div className="suggestion-item" style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Space align="start">
                            <CalendarOutlined style={{ fontSize: 18, color: '#faad14', marginTop: 4 }} />
                            <div>
                                <Text strong style={{ fontSize: 15 }}>
                                    {dayjs(suggestions.suggestedDate.date).format('ddd, MMM D, YYYY')}
                                </Text>
                                <div><Text type="secondary" style={{ fontSize: 12 }}>{suggestions.suggestedDate.rationale}</Text></div>
                            </div>
                        </Space>
                        <Button
                            size="small"
                            type={isApplied('date') ? "text" : "primary"}
                            ghost={!isApplied('date')}
                            icon={isApplied('date') ? <CheckCircleOutlined /> : null}
                            onClick={() => onApplyDate(suggestions.suggestedDate)}
                            disabled={isApplied('date')}
                            style={isApplied('date') ? { color: '#52c41a' } : { borderColor: '#faad14', color: '#faad14' }}
                        >
                            {isApplied('date') ? "Applied" : "Apply"}
                        </Button>
                    </div>
                </div>
            )}

            <Divider style={{ margin: '12px 0' }} />

            {suggestions.activityType && (
                <div className="suggestion-item" style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Space align="start">
                            <BulbOutlined style={{ fontSize: 18, color: '#faad14', marginTop: 4 }} />
                            <div>
                                <Text strong style={{ fontSize: 15, textTransform: 'capitalize' }}>{suggestions.activityType.type} Activity</Text>
                                <div><Text type="secondary" style={{ fontSize: 12 }}>{suggestions.activityType.rationale}</Text></div>
                            </div>
                        </Space>
                        <Button
                            size="small"
                            type={isApplied('activityType') ? "text" : "primary"}
                            ghost={!isApplied('activityType')}
                            icon={isApplied('activityType') ? <CheckCircleOutlined /> : null}
                            onClick={() => onApplyActivity(suggestions.activityType)}
                            disabled={isApplied('activityType')}
                            style={isApplied('activityType') ? { color: '#52c41a' } : { borderColor: '#faad14', color: '#faad14' }}
                        >
                            {isApplied('activityType') ? "Applied" : "Apply"}
                        </Button>
                    </div>
                </div>
            )}

            {suggestions.resources && suggestions.resources.length > 0 && (
                <>
                    <Divider style={{ margin: '12px 0' }} />
                    <div className="suggestion-item">
                        <div style={{ width: '100%' }}>
                            <Space align="center" style={{ marginBottom: 8 }}>
                                <FileTextOutlined style={{ fontSize: 18, color: '#faad14' }} />
                                <Text strong style={{ fontSize: 14 }}>Recommended Resources ({suggestions.resources.length})</Text>
                            </Space>

                            <div style={{ paddingLeft: 26 }}>
                                {suggestions.resources.map((resource, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                                        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', marginRight: 8 }}>
                                            <Text style={{ fontSize: 13 }} title={resource.name}>{resource.name}</Text>
                                        </div>
                                        <Button
                                            size="small"
                                            type="link"
                                            style={{ padding: 0, height: 'auto', color: '#faad14', flexShrink: 0 }}
                                            onClick={() => onApplyResource(resource)}
                                        >
                                            Use
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {patterns && (
                <div style={{ marginTop: 20, paddingTop: 12, borderTop: '1px dashed #ffe58f', fontSize: 12, color: '#8c8c8c' }}>
                    <Space split={<Divider type="vertical" />}>
                        <span>Pattern: <strong>{patterns.mostPreferredDay}s</strong></span>
                        <span>Avg gap: <strong>{patterns.avgGapDays} days</strong></span>
                    </Space>
                </div>
            )}

        </Card>
    );
};

export default SmartSuggestionPanel;
