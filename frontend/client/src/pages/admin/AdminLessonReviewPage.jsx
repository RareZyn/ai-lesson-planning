import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    getLessonPlanById,
} from "../../services/lessonService";
import {
    approveLesson,
    rejectLesson,
} from "../../services/adminService";
import {
    Card,
    Button,
    Tag,
    Descriptions,
    Space,
    Alert,
    Row,
    Col,
    Typography,
    Divider,
    Modal,
    Input,
    message,
} from "antd";

import {
    ArrowLeftOutlined,
    CheckOutlined,
    CloseOutlined,
    BookOutlined,
    BulbOutlined,
    ThunderboltOutlined,
    FileTextOutlined,
    SettingOutlined,
} from "@ant-design/icons";

import LoadingSpinner from "../../components/common/LoadingSpinner";

import styles from "../planner/displaylesson/DisplayLessonPage.module.css";
import approvalStyles from "./LessonApproval.module.css";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const AdminLessonReviewPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [lessonPlan, setLessonPlan] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Approval/Rejection State
    // Unified Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [actionType, setActionType] = useState(null); // 'approve' or 'reject'
    const [remark, setRemark] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const fetchLesson = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                const data = await getLessonPlanById(id);
                setLessonPlan(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLesson();
    }, [id]);

    // Helper functions for activity configuration
    const getActivityTypeLabel = (type) => {
        const labels = {
            textbook: "Textbook-based Activity",
            essay: "Essay Writing",
            activityInClass: "In-class Activity",
            assessment: "Assessment / Test",
        };
        return labels[type] || type;
    };

    const getActivityTypeIcon = (type) => {
        const icons = {
            textbook: <BookOutlined style={{ color: "#52c41a" }} />,
            essay: <FileTextOutlined style={{ color: "#1890ff" }} />, // Changed specific icon to generic for simplicity
            activityInClass: <ThunderboltOutlined style={{ color: "#fa8c16" }} />,
            assessment: <FileTextOutlined style={{ color: "#722ed1" }} />,
        };
        return icons[type] || <SettingOutlined />;
    };

    const getActivityTypeColor = (type) => {
        const colors = {
            textbook: "success",
            essay: "processing",
            activityInClass: "warning",
            assessment: "purple",
        };
        return colors[type] || "default";
    };

    const renderActivityConfiguration = () => {
        const activityConfiguration =
            lessonPlan?.activityConfiguration ||
            lessonPlan?.parameters?.activityConfiguration;
        const activityType =
            lessonPlan?.activityType || lessonPlan?.parameters?.activityType;

        if (!activityConfiguration?.parameters) return null;

        const params = activityConfiguration.parameters;
        const type = activityConfiguration.type || activityType;

        const getConfigurationItems = () => {
            // Simplified logic based on previous DisplayLessonPage
            // Since this is read-only, we can iterate keys generically or stick to the switch
            // For safety, duplicating the switch logic is best
            switch (type) {
                case "essay":
                    return [
                        { label: "Essay Type", value: params.essayType || "Not specified" },
                        { label: "Word Count", value: params.wordCount || "Not specified" },
                        { label: "Duration", value: params.duration || "Not specified" },
                        { label: "Additional Requirements", value: params.additionalRequirement || "None" },
                    ];
                case "assessment":
                    return [
                        { label: "Assessment Type", value: params.assessmentType || "Not specified" },
                        { label: "Number of Questions", value: params.numberOfQuestions || "Not specified" },
                        { label: "Time Allocation", value: `${params.timeAllocation || "Unknown"} minutes` },
                        { label: "Question Types", value: Array.isArray(params.questionTypes) ? params.questionTypes.join(", ") : "Not specified" },
                        { label: "Additional Requirements", value: params.additionalRequirement || "None" },
                    ];
                case "activityInClass":
                    return [
                        { label: "Student Arrangement", value: params.studentArrangement?.replace("_", " ") || "Not specified" },
                        { label: "Resource Usage", value: params.resourceUsage?.replace("_", " ") || "Not specified" },
                        { label: "Activity Type", value: params.activityType || "Not specified" },
                        { label: "Duration", value: params.duration || "Not specified" },
                        { label: "Additional Requirements", value: params.additionalRequirement || "None" },
                    ];
                case "textbook":
                    return [
                        { label: "Activity Requirements", value: params.additionalRequirement || "Standard textbook activity" },
                    ];
                default:
                    return [{ label: "Configuration", value: "Available" }];
            }
        };

        const configItems = getConfigurationItems();

        return (
            <Card
                className="mb-4"
                style={{ borderColor: "#52c41a" }}
                title={
                    <Space>
                        {getActivityTypeIcon(type)}
                        <span>Activity Configuration</span>
                        <Tag color={getActivityTypeColor(type)}>
                            {getActivityTypeLabel(type)}
                        </Tag>
                    </Space>
                }
            >
                <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2, lg: 2 }}>
                    {configItems.map((item, index) => (
                        <Descriptions.Item key={index} label={<Text strong>{item.label}</Text>}>
                            <Text>{item.value}</Text>
                        </Descriptions.Item>
                    ))}
                    <Descriptions.Item label={<Text strong>Configured Date</Text>}>
                        <Text type="secondary">
                            {activityConfiguration.configuredAt
                                ? new Date(activityConfiguration.configuredAt).toLocaleDateString()
                                : "Unknown date"}
                        </Text>
                    </Descriptions.Item>
                </Descriptions>
            </Card>
        );
    };

    // Action Handlers
    const openModal = (type) => {
        setActionType(type);
        setRemark("");
        setIsModalOpen(true);
    };

    const handleConfirm = async () => {
        if (actionType === "reject" && !remark.trim()) {
            message.warning("Please provide a reason for rejection.");
            return;
        }

        setIsProcessing(true);
        try {
            if (actionType === "approve") {
                await approveLesson(id, { remark });
                message.success("Lesson approved successfully!");
            } else if (actionType === "reject") {
                await rejectLesson(id, remark);
                message.success("Lesson rejected successfully!");
            }
            setIsModalOpen(false);
            navigate(-1); // Go back
        } catch (err) {
            message.error(`Error: ${err.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading)
        return <LoadingSpinner tip="Loading lesson plan..." fullscreen={true} />;

    if (error)
        return (
            <div className="container mt-4">
                <Alert message="Error Loading Lesson Plan" description={error} type="error" showIcon action={<Button size="small" onClick={() => window.location.reload()}>Retry</Button>} />
            </div>
        );

    if (!lessonPlan)
        return (
            <div className="container mt-4">
                <Alert message="Lesson Plan Not Found" description="The requested lesson plan could not be found." type="warning" showIcon />
            </div>
        );

    const { parameters, lessonDate, plan: displayPlan } = lessonPlan;
    const activityConfiguration = lessonPlan.activityConfiguration || parameters?.activityConfiguration;
    const activityType = lessonPlan.activityType || parameters?.activityType;

    return (
        <div className="container">
            {/* Back Button */}
            <div className="mb-3">
                <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} className="p-0">
                    Back
                </Button>
            </div>

            {/* Header - Review Mode */}
            <Card className="mb-4" style={{ borderRadius: "12px" }}>
                <Row justify="space-between" align="middle">
                    <Col xs={24} lg={12}>
                        <Space direction="vertical" size={0}>
                            <Text type="secondary">Reviewing Lesson Plan Submission</Text>
                            <Title level={2} className="mb-1 mt-1">{parameters.specificTopic}</Title>
                        </Space>
                        <div className="mt-2">
                            <Space wrap>
                                <Tag color="cyan">By: {lessonPlan.createdBy?.name || "Unknown Teacher"}</Tag>
                                <Tag color="blue">{parameters.sow?.focus || "General"}</Tag>
                                {activityType && (
                                    <Tag color={getActivityTypeColor(activityType)}>{getActivityTypeLabel(activityType)}</Tag>
                                )}
                            </Space>
                        </div>
                    </Col>
                    <Col xs={24} lg={12}>
                        <div className="d-flex justify-content-end gap-2 mt-3 mt-lg-0">
                            {/* Approval Actions */}
                            {lessonPlan.approvalStatus === 'pending' && (
                                <>
                                    <Button danger icon={<CloseOutlined />} onClick={() => openModal("reject")} disabled={isProcessing} size="large">
                                        Reject
                                    </Button>
                                    <Button type="primary" icon={<CheckOutlined />} onClick={() => openModal("approve")} loading={isProcessing} disabled={isProcessing} size="large" style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}>
                                        Approve
                                    </Button>
                                </>
                            )}
                        </div>
                    </Col>
                </Row>
            </Card>

            {/* Status Warning if already processed */}
            {lessonPlan.approvalStatus !== 'pending' && (
                <Alert
                    message={`This lesson is currently ${lessonPlan.approvalStatus?.toUpperCase()}`}
                    description={
                        lessonPlan.approvalStatus === 'approved'
                            ? `Approved by ${lessonPlan.approvedBy?.name} on ${new Date(lessonPlan.approvedAt || lessonPlan.updatedAt).toLocaleDateString()}`
                            : `Rejected by ${lessonPlan.approvedBy?.name}. Reason: ${lessonPlan.remarks || lessonPlan.rejectionReason}`
                    }
                    type={lessonPlan.approvalStatus === 'approved' ? 'success' : 'error'}
                    showIcon
                    className="mb-4"
                />
            )}

            <Row gutter={[24, 24]}>
                <Col xs={24} xl={16}>
                    {activityConfiguration && renderActivityConfiguration()}

                    <Card title="Learning Objective" className="mb-4">
                        <Paragraph className="mb-0">{displayPlan.learningObjective}</Paragraph>
                    </Card>

                    <Card title="Success Criteria" className="mb-4">
                        <ul className="mb-0">
                            {displayPlan.successCriteria.map((item, i) => <li key={i} className="mb-1">{item}</li>)}
                        </ul>
                    </Card>

                    <Card title="Lesson Activities" className="mb-4">
                        <div className="mb-4">
                            <Title level={5} className="text-primary mb-2"><BulbOutlined className="me-2" />Pre-Lesson</Title>
                            <ul className="mb-0">{displayPlan.activities.preLesson.map((item, i) => <li key={i} className="mb-1">{item}</li>)}</ul>
                        </div>
                        <Divider />
                        <div className="mb-4">
                            <Title level={5} className="text-success mb-2"><ThunderboltOutlined className="me-2" />During Lesson</Title>
                            <ul className="mb-0">{displayPlan.activities.duringLesson.map((item, i) => <li key={i} className="mb-1">{item}</li>)}</ul>
                        </div>
                        <Divider />
                        <div>
                            <Title level={5} className="text-warning mb-2"><BookOutlined className="me-2" />Post-Lesson</Title>
                            <ul className="mb-0">{displayPlan.activities.postLesson.map((item, i) => <li key={i} className="mb-1">{item}</li>)}</ul>
                        </div>
                    </Card>
                </Col>

                <Col xs={24} xl={8}>
                    <Card title="Lesson Details" className="mb-4">
                        <Descriptions column={1} size="small">
                            <Descriptions.Item label="Class"><Text strong>{lessonPlan.classId?.className || "N/A"}</Text></Descriptions.Item>
                            <Descriptions.Item label="Date"><Text>{new Date(lessonDate).toLocaleDateString()}</Text></Descriptions.Item>
                            <Descriptions.Item label="Subject"><Text>{lessonPlan.classId?.subject || parameters.subject || "N/A"}</Text></Descriptions.Item>
                            <Descriptions.Item label="Grade"><Text>{lessonPlan.classId?.grade || parameters.grade || "N/A"}</Text></Descriptions.Item>
                        </Descriptions>
                    </Card>

                    <Card title="Syllabus Content" className="mb-4">
                        {parameters.sow ? (
                            <div className={styles.syllabusContainer}>
                                {Object.entries(parameters.sow).map(([key, value]) => {
                                    // Filter out internal keys
                                    if (["id", "_id", "key", "topicKey"].includes(key)) return null;

                                    // Formatter
                                    const label = key
                                        .replace(/([A-Z])/g, " $1")
                                        .replace(/^./, (str) => str.toUpperCase())
                                        .trim();

                                    // Recursive helper
                                    const renderSyllabusValue = (val) => {
                                        if (Array.isArray(val)) {
                                            return (
                                                <ul style={{ paddingLeft: "1.2rem", marginBottom: 0, wordBreak: "break-word" }}>
                                                    {val.map((item, index) => (
                                                        <li key={index}>{renderSyllabusValue(item)}</li>
                                                    ))}
                                                </ul>
                                            );
                                        }
                                        if (typeof val === "object" && val !== null) {
                                            return (
                                                <div style={{ paddingLeft: "0.5rem", wordBreak: "break-word" }}>
                                                    {Object.entries(val).map(([subKey, subValue]) => (
                                                        <div key={subKey}>
                                                            <Text strong>{subKey}: </Text>
                                                            {renderSyllabusValue(subValue)}
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        }
                                        return (
                                            <Paragraph
                                                ellipsis={{ rows: 3, expandable: true, symbol: "more" }}
                                                style={{ marginBottom: 0, wordBreak: "break-word", whiteSpace: "pre-wrap" }}
                                            >
                                                {String(val)}
                                            </Paragraph>
                                        );
                                    };

                                    return (
                                        <div key={key} className={styles.syllabusRow}>
                                            <div className={styles.syllabusLabel}>{label}</div>
                                            <div className={styles.syllabusValue}>
                                                {renderSyllabusValue(value)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <Alert message="No syllabus data attached to this lesson." type="info" />
                        )}
                    </Card>
                </Col>
            </Row>

            {/* Rejection Modal */}
            {/* === CUSTOM CONFIRMATION MODAL === */}
            {
                isModalOpen && (
                    <div className={approvalStyles.modalBackdrop}>
                        <div className={approvalStyles.modalContent}>
                            <h3>
                                {actionType === "approve"
                                    ? "Approve Lesson Plan"
                                    : "Reject Lesson Plan"}
                            </h3>
                            <p>
                                Are you sure you want to{" "}
                                <b>{actionType === "approve" ? "approve" : "reject"}</b> this
                                lesson?
                            </p>
                            <p style={{ marginTop: "10px", marginBottom: "5px" }}>
                                <strong>Topic:</strong>{" "}
                                {parameters.specificTopic || "Untitled"}
                            </p>

                            <textarea
                                placeholder="Optional remark..."
                                value={remark}
                                onChange={(e) => setRemark(e.target.value)}
                                className={approvalStyles.remarkInput}
                            />

                            <div className={approvalStyles.modalButtons}>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className={approvalStyles.cancelButton}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className={
                                        actionType === "approve"
                                            ? approvalStyles.approveButton
                                            : approvalStyles.rejectButton
                                    }
                                >
                                    {actionType === "approve" ? "Approve" : "Reject"}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
};

export default AdminLessonReviewPage;
