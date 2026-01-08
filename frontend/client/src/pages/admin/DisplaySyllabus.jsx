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
    message,
    Upload,
    Steps
} from 'antd';
import * as XLSX from 'xlsx';
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined, BookOutlined, UserOutlined, CalendarOutlined, NumberOutlined, ReadOutlined, ExclamationCircleOutlined, DownloadOutlined, InboxOutlined, SaveOutlined } from '@ant-design/icons';
import { updateSyllabus } from '../../services/adminService';
import { useBreadcrumb } from '../../context/BreadcrumbContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const { Title, Text } = Typography;
const { Link: AnchorLink } = Anchor;
const { Dragger } = Upload;
const { Step } = Steps;

const DisplaySyllabus = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setCustomBreadcrumbs } = useBreadcrumb();
    const [syllabus, setSyllabus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Refs for scrolling
    const itemRefs = useRef({});

    // Edit Modal State
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editFile, setEditFile] = useState(null);
    const [updating, setUpdating] = useState(false);

    const fetchSyllabusDetails = React.useCallback(async () => {
        try {
            setLoading(true);
            const data = await getSyllabusById(id);
            setSyllabus(data);

            // Set custom breadcrumbs
            setCustomBreadcrumbs([
                { label: "Home", link: "/app" },
                { label: "Admin Dashboard", link: "/app/admin" },
                { label: `${data.subject} (${data.grade})` }
            ]);

            setError('');
        } catch (err) {
            console.error('Error fetching syllabus:', err);
            setError('Failed to load syllabus details');
        } finally {
            setLoading(false);
        }
    }, [id, setCustomBreadcrumbs]);

    useEffect(() => {
        fetchSyllabusDetails();
        setCurrentPage(1);

        // Cleanup
        return () => setCustomBreadcrumbs(null);
    }, [id, fetchSyllabusDetails, setCustomBreadcrumbs]);

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
        setIsEditModalVisible(true);
    };

    const handleEditCancel = () => {
        setIsEditModalVisible(false);
        setEditFile(null);
    };

    const flattenObject = (obj, prefix = '') => {
        return Object.keys(obj).reduce((acc, k) => {
            const pre = prefix.length ? prefix + '.' : '';
            if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
                Object.assign(acc, flattenObject(obj[k], pre + k));
            } else if (Array.isArray(obj[k])) {
                // For arrays (like lists), join with newlines to keep in one cell
                // Or keep as is? Backend parser doesn't handle array restoration automatically from CSV logic,
                // but let's try to stringify if it's a simple list, or just leave it.
                // If we want the user to be able to edit it, newlines are best for "List" types.
                acc[pre + k] = obj[k].join('\n');
            } else {
                acc[pre + k] = obj[k];
            }
            return acc;
        }, {});
    };

    const handleDownloadCurrentData = () => {
        if (!syllabus || !syllabus.data) {
            message.error("No data to download.");
            return;
        }

        try {
            const dataToExport = Array.isArray(syllabus.data) ? syllabus.data : [syllabus.data];
            // Flatten data for Excel (dot notation for nested objects)
            const flattenedData = dataToExport.map(item => flattenObject(item));

            const ws = XLSX.utils.json_to_sheet(flattenedData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Syllabus Data");
            XLSX.writeFile(wb, `${syllabus.subject || 'Syllabus'}_${syllabus.grade || 'Data'}.xlsx`);
            message.success("Syllabus downloaded successfully.");
        } catch (err) {
            console.error(err);
            message.error("Failed to generate Excel file.");
        }
    };

    const handleUpdateSyllabus = async () => {
        if (!editFile) {
            message.error("Please upload the modified Excel file.");
            return;
        }

        setUpdating(true);
        try {
            await updateSyllabus(id, { file: editFile });
            message.success("Syllabus updated successfully!");
            setIsEditModalVisible(false);
            setEditFile(null);
            fetchSyllabusDetails(); // Refresh data
        } catch (err) {
            message.error("Update failed: " + err.message);
        } finally {
            setUpdating(false);
        }
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
        return <LoadingSpinner tip="Loading syllabus..." />;
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
                        onClick={() => navigate('/app/admin')}
                        className="p-0"
                    >
                        Back
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
                    <Col xs={{ span: 24, order: 2 }} xl={{ span: 16, order: 1 }}>

                        {/* Pagination */}
                        {syllabusItems.length > itemsPerPage && (
                            <div
                                className="d-flex justify-content-center mb-4"
                                style={{
                                    position: 'sticky',
                                    top: '10px',
                                    zIndex: 100,
                                    background: 'rgba(255, 255, 255, 0.95)',
                                    padding: '10px 0',
                                    borderRadius: '8px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                    marginBottom: '20px'
                                }}
                            >
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
                    <Col xs={{ span: 24, order: 1 }} xl={{ span: 8, order: 2 }}>
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

            {/* Edit Syllabus Modal */}
            <AntModal
                title="Update Syllabus Data"
                open={isEditModalVisible}
                onCancel={handleEditCancel}
                footer={null}
                width={600}
            >
                <div style={{ padding: '20px 0' }}>
                    <Alert
                        message="How to Update"
                        description="Download the current data, make edits in Excel, and upload it back."
                        type="info"
                        showIcon
                        style={{ marginBottom: 24 }}
                    />

                    <Steps direction="vertical" size="small" current={-1}>
                        <Step
                            title="Step 1: Download Current Data"
                            description={
                                <Button
                                    icon={<DownloadOutlined />}
                                    onClick={handleDownloadCurrentData}
                                    style={{ marginTop: 8 }}
                                >
                                    Download .xlsx
                                </Button>
                            }
                        />
                        <Step
                            title="Step 2: Upload Modified File"
                            description={
                                <div style={{ marginTop: 8 }}>
                                    <Dragger
                                        accept=".xlsx, .xls"
                                        beforeUpload={(file) => {
                                            // Ensure file has a uid for AntD keying
                                            if (!file.uid) file.uid = 'manual-upload';
                                            setEditFile(file);
                                            return false; // Prevent auto-upload
                                        }}
                                        maxCount={1}
                                        fileList={editFile ? [editFile] : []}
                                        onRemove={() => setEditFile(null)}
                                        showUploadList={{ showRemoveIcon: true }}
                                    >
                                        <p className="ant-upload-drag-icon"><InboxOutlined style={{ color: '#1890ff' }} /></p>
                                        <p className="ant-upload-text">Click or drag Excel file here</p>
                                    </Dragger>
                                </div>
                            }
                        />
                    </Steps>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24, gap: 12 }}>
                        <Button onClick={handleEditCancel}>Cancel</Button>
                        <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            onClick={handleUpdateSyllabus}
                            loading={updating}
                            disabled={!editFile}
                        >
                            Update Syllabus
                        </Button>
                    </div>
                </div>
            </AntModal>
        </div>
    );
};

export default DisplaySyllabus;