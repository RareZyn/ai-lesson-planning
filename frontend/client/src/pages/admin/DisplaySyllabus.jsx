import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSyllabusById, deleteSyllabus } from '../../services/adminService';
// Ant Design Imports
import {
    Card,
    Button,
    Tag,
    Descriptions,
    Space,
    Row,
    Col,
    Typography,
    Divider,
    Alert,
    Anchor,
    Pagination,
    Modal as AntModal,
    message
} from 'antd';
import {
    ArrowLeftOutlined,
    EditOutlined,
    DeleteOutlined,
    BookOutlined,
    UserOutlined,
    CalendarOutlined,
    NumberOutlined,
    ReadOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Link: AnchorLink } = Anchor;

const DisplaySyllabus = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [syllabus, setSyllabus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Refs for scrolling
    const itemRefs = useRef({});

    useEffect(() => {
        fetchSyllabusDetails();
        setCurrentPage(1);
    }, [id]);

    const fetchSyllabusDetails = async () => {
        try {
            setLoading(true);
            const data = await getSyllabusById(id);
            setSyllabus(data);
            setError('');
        } catch (err) {
            console.error('Error fetching syllabus:', err);
            setError('Failed to load syllabus details');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        AntModal.confirm({
            title: 'Delete Syllabus',
            icon: <ExclamationCircleOutlined />,
            content: (
                <div>
                    <p>Are you sure you want to delete this syllabus?</p>
                    <p className="mb-1">
                        <strong>Subject:</strong> {syllabus.subject}
                    </p>
                    <p className="mb-1">
                        <strong>Grade:</strong> {syllabus.grade}
                    </p>
                    <p className="text-danger mb-0">
                        <small>This action cannot be undone and will permanently delete all {syllabusItems.length} items.</small>
                    </p>
                </div>
            ),
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    await deleteSyllabus(id);
                    message.success('Syllabus deleted successfully');
                    navigate('/app/admin/syllabuses');
                } catch (err) {
                    console.error('Error deleting syllabus:', err);
                    message.error('Failed to delete syllabus');
                }
            },
        });
    };

    const handleEdit = () => {
        message.info('Edit functionality coming soon!');
    };

    // Helper to render values recursively
    const renderValue = (value) => {
        if (value === null || value === undefined || value === '') {
            return <Text type="secondary" italic>Not specified</Text>;
        }

        if (Array.isArray(value)) {
            if (value.length === 0) return <Text type="secondary" italic>None</Text>;
            return (
                <ul style={{ paddingLeft: '20px', margin: 0 }}>
                    {value.map((item, idx) => (
                        <li key={idx}>{renderValue(item)}</li>
                    ))}
                </ul>
            );
        }

        if (typeof value === 'object') {
            return (
                <Card size="small" style={{ marginTop: '8px', background: '#fafafa' }}>
                    {Object.entries(value).map(([key, val]) => (
                        <div key={key} style={{ marginBottom: '4px' }}>
                            <Text strong>{key}: </Text> {renderValue(val)}
                        </div>
                    ))}
                </Card>
            );
        }

        return <Text>{String(value)}</Text>;
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
                <div className="text-center">
                    <div className="spinner-border text-primary mb-3" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <Text type="secondary">Loading syllabus...</Text>
                </div>
            </div>
        );
    }

    if (error || !syllabus) {
        return (
            <div className="container mt-4">
                <Alert
                    message="Error Loading Syllabus"
                    description={error || 'Syllabus not found'}
                    type="error"
                    showIcon
                    action={
                        <Button size="small" onClick={() => navigate('/app/admin/syllabuses')}>
                            Back to List
                        </Button>
                    }
                />
            </div>
        );
    }

    const syllabusItems = Array.isArray(syllabus.data) ? syllabus.data : [syllabus.data];

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = syllabusItems.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="container-fluid py-4" style={{ minHeight: "100vh" }}>
            <div className="container">
                {/* Back Button */}
                <div className="mb-3">
                    <Button
                        type="link"
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate('/app/admin/syllabuses')}
                        className="p-0"
                    >
                        Back to Syllabuses
                    </Button>
                </div>

                {/* Header Card */}
                <Card className="mb-4" style={{ borderRadius: "12px" }}>
                    <Row justify="space-between" align="middle">
                        <Col xs={24} lg={16}>
                            <Title level={2} className="mb-1">
                                {syllabus.subject} Syllabus
                            </Title>
                            <Text type="secondary" className="fs-5">
                                {syllabus.grade}
                            </Text>
                            <div className="mt-2">
                                <Space>
                                    <Tag color="blue">{syllabus.schoolType || 'KSSM'}</Tag>
                                    <Tag color="cyan">{syllabusItems.length} Items</Tag>
                                </Space>
                            </div>
                        </Col>
                        <Col xs={24} lg={8}>
                            <div className="d-flex justify-content-end gap-2 mt-3 mt-lg-0">
                                <Button icon={<EditOutlined />} onClick={handleEdit}>
                                    Edit
                                </Button>
                                <Button
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={handleDelete}
                                >
                                    Delete
                                </Button>
                            </div>
                        </Col>
                    </Row>
                </Card>

                <Row gutter={[24, 24]}>
                    {/* Main Content - Syllabus Items */}
                    <Col xs={24} xl={16}>

                        {/* Pagination */}
                        {syllabusItems.length > itemsPerPage && (
                            <div className="d-flex justify-content-center mb-4">
                                <Pagination
                                    current={currentPage}
                                    total={syllabusItems.length}
                                    pageSize={itemsPerPage}
                                    onChange={handlePageChange}
                                    showSizeChanger={false}
                                />
                            </div>
                        )}
                        {currentItems.map((item, index) => {
                            const globalIndex = indexOfFirstItem + index;
                            const itemId = `syllabus-item-${globalIndex}`;

                            return (
                                <Card
                                    key={globalIndex}
                                    id={itemId}
                                    className="mb-4"
                                    title={
                                        <Space>
                                            <ReadOutlined style={{ color: '#1890ff' }} />
                                            <span>{item.Title || `Item ${globalIndex + 1}`}</span>
                                        </Space>
                                    }
                                >
                                    <div ref={el => itemRefs.current[itemId] = el}>
                                        {Object.entries(item).map(([key, value]) => {
                                            if (key === 'Title') return null;
                                            return (
                                                <div key={key} className="mb-3">
                                                    <Text strong style={{ display: 'block', marginBottom: '4px' }}>
                                                        {key}:
                                                    </Text>
                                                    <div style={{ marginLeft: '8px' }}>
                                                        {renderValue(value)}
                                                    </div>
                                                    <Divider style={{ margin: '12px 0' }} dashed />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Card>
                            );
                        })}
                    </Col>

                    {/* Sidebar - Metadata & TOC */}
                    <Col xs={24} xl={8}>
                        <Card title="Syllabus Information" className="mb-4">
                            <Descriptions column={1} size="small">
                                <Descriptions.Item label={<Space><BookOutlined /> Subject</Space>}>
                                    <Text strong>{syllabus.subject}</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label={<Space><NumberOutlined /> Grade</Space>}>
                                    <Tag color="geekblue">{syllabus.grade}</Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label={<Space><UserOutlined /> Created By</Space>}>
                                    <Text>{syllabus.createdBy}</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label={<Space><CalendarOutlined /> Date</Space>}>
                                    <Text>{syllabus.date}</Text>
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>

                        {syllabusItems.length > 0 && (
                            <Card title="Table of Contents" className="mb-4" bodyStyle={{ padding: '0 12px' }}>
                                <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '12px 0' }}>
                                    <Anchor
                                        affix={false}
                                        showInkInFixed={true}
                                        onClick={(e, link) => {
                                            e.preventDefault();
                                            const index = parseInt(link.href.split('-').pop());
                                            const page = Math.ceil((index + 1) / itemsPerPage);
                                            if (page !== currentPage) {
                                                setCurrentPage(page);
                                                // Wait for render then scroll
                                                setTimeout(() => {
                                                    const el = document.getElementById(`syllabus-item-${index}`);
                                                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                }, 100);
                                            } else {
                                                const el = document.getElementById(`syllabus-item-${index}`);
                                                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                            }
                                        }}
                                    >
                                        {syllabusItems.map((item, index) => (
                                            <AnchorLink
                                                key={index}
                                                href={`#syllabus-item-${index}`}
                                                title={`${index + 1}. ${item.Title || `Item ${index + 1}`}`}
                                            />
                                        ))}
                                    </Anchor>
                                </div>
                            </Card>
                        )}
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default DisplaySyllabus;