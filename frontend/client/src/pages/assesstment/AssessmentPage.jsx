// src/pages/assessment/AssessmentPage.jsx - Updated with backend integration
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Tabs,
  Input,
  Select,
  Modal,
  Row,
  Col,
  message,
  Dropdown,
  Spin,
  Alert,
} from "antd";
import {
  FileTextOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  BookOutlined,
  BulbOutlined,
  SearchOutlined,
  ThunderboltOutlined,
  EditOutlined as EditIcon,
  FileTextOutlined as FileIcon,
  BookOutlined as BookIcon,
  DownOutlined,
  TrophyOutlined,
  MoreOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

// Import services
import { assessmentAPI } from "../../services/assessmentService";
import { useUser } from "../../context/UserContext";

// Lesson-Based Assessment Modals (requires existing lesson plan)
import LessonSelectionModal from "../../components/Modal/LessonBasedAssessment/LessonSelectionModal";

// Standalone Assessment Modals (no lesson plan required)
import ActivityInClassStandaloneModal from "../../components/Modal/StandaloneAssessment/ActivityInClassStandaloneModal";
import AssessmentStandaloneModal from "../../components/Modal/StandaloneAssessment/AssessmentStandaloneModal";
import EssayStandaloneModal from "../../components/Modal/StandaloneAssessment/EssayStandaloneModal";
import TextbookStandaloneModal from "../../components/Modal/StandaloneAssessment/TextbookStandaloneModal";

import "./AssessmentPage.css";

const { TabPane } = Tabs;
const { Search } = Input;
const { Option } = Select;

const AssessmentPage = () => {
  const navigate = useNavigate();
  const { userId } = useUser();
  const [activeTab, setActiveTab] = useState("lesson-based");

  // Data states
  const [lessonBasedAssessments, setLessonBasedAssessments] = useState([]);
  const [standaloneAssessments, setStandaloneAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [isLessonSelectionModalVisible, setIsLessonSelectionModalVisible] =
    useState(false);
  const [isStandaloneOptionsVisible, setIsStandaloneOptionsVisible] =
    useState(false);
  const [activeStandaloneModal, setActiveStandaloneModal] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    search: "",
    classId: "",
    activityType: "",
    status: "",
    grade: "",
    assessmentType: "",
  });

  // Pagination states
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Load assessments on component mount and when filters change
  useEffect(() => {
    // Only load assessments when we have a valid userId and not loading
    if (userId && !loading) {
      console.log("Loading assessments for userId:", userId);
      loadAssessments();
    }
  }, [userId, filters, pagination.current, pagination.pageSize]);

  // Load assessments from backend
  const loadAssessments = async () => {
    try {
      setLoading(true);

      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: filters.search || undefined,
        classId: filters.classId || undefined,
        activityType: filters.activityType || undefined,
        status: filters.status || undefined,
      };

      console.log("Loading assessments with params:", params);

      const response = await assessmentAPI.getUserAssessments(params);

      console.log("Assessments response:", response);

      if (response.success) {
        // Separate lesson-based and standalone assessments
        const allAssessments = response.data || [];

        const lessonBased = allAssessments.filter(
          (assessment) => assessment.lessonPlanId
        );
        const standalone = allAssessments.filter(
          (assessment) => !assessment.lessonPlanId
        );

        setLessonBasedAssessments(lessonBased);
        setStandaloneAssessments(standalone);

        setPagination((prev) => ({
          ...prev,
          total: response.total || 0,
        }));
      } else {
        console.error("Failed to load assessments:", response.message);
        message.error("Failed to load assessments");
      }
    } catch (error) {
      console.error("Error loading assessments:", error);
      message.error("Failed to load assessments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Refresh assessments
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAssessments();
    setRefreshing(false);
    message.success("Assessments refreshed");
  };

  // Filter handlers
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setPagination((prev) => ({
      ...prev,
      current: 1, // Reset to first page when filters change
    }));
  };

  // Pagination handler
  const handleTableChange = (paginationInfo) => {
    setPagination((prev) => ({
      ...prev,
      current: paginationInfo.current,
      pageSize: paginationInfo.pageSize,
    }));
  };

  // Navigation functions
  const handleViewActivity = (record) => {
    if (record.hasActivity && record.generatedContent?.activityHTML) {
      navigate(`/app/assessment/activity/${record._id}`);
    } else {
      message.warning("No activity generated for this assessment yet.");
    }
  };

  const handleViewRubric = (record) => {
    if (record.hasRubric && record.generatedContent?.rubricHTML) {
      navigate(`/app/assessment/rubric/${record._id}`);
    } else {
      message.warning("No rubric generated for this assessment yet.");
    }
  };

  const handleEditAssessment = (record) => {
    // TODO: Implement proper edit functionality
    // This could navigate to an edit page or open an edit modal
    console.log("Editing assessment:", record);

    Modal.info({
      title: "Edit Assessment",
      content: (
        <div>
          <p>Edit functionality will be implemented in the next phase.</p>
          <p>
            <strong>Assessment:</strong> {record.title}
          </p>
          <p>
            <strong>Type:</strong> {record.activityType}
          </p>
          <p>
            <strong>Status:</strong> {record.status}
          </p>
        </div>
      ),
      onOk() {
        message.info("Edit feature coming soon!");
      },
    });
  };

  const handleDeleteAssessment = async (record) => {
    Modal.confirm({
      title: "Are you sure you want to delete this assessment?",
      content: "This action cannot be undone.",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await assessmentAPI.deleteAssessment(record._id);
          message.success(`Assessment "${record.title}" deleted successfully`);
          loadAssessments(); // Refresh the list
        } catch (error) {
          console.error("Error deleting assessment:", error);
          message.error("Failed to delete assessment");
        }
      },
    });
  };

  const handleGenerateActivity = async (record) => {
    try {
      message.loading("Generating activity...", 1);

      // TODO: Implement activity regeneration logic
      // This would typically call the same generation endpoints but update existing assessment

      // For now, simulate the process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Update the assessment status
      await assessmentAPI.updateAssessment(record._id, {
        hasActivity: true,
        status: record.hasRubric ? "Completed" : "Generated",
      });

      message.success("Activity generated successfully!");
      loadAssessments(); // Refresh the list
    } catch (error) {
      console.error("Error generating activity:", error);
      message.error("Failed to generate activity");
    }
  };

  const handleGenerateRubric = async (record) => {
    try {
      message.loading("Generating rubric...", 1);

      // TODO: Implement rubric regeneration logic
      // This would typically call the rubric generation endpoint

      // For now, simulate the process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Update the assessment status
      await assessmentAPI.updateAssessment(record._id, {
        hasRubric: true,
        status: record.hasActivity ? "Completed" : "Generated",
      });

      message.success("Rubric generated successfully!");
      loadAssessments(); // Refresh the list
    } catch (error) {
      console.error("Error generating rubric:", error);
      message.error("Failed to generate rubric");
    }
  };

  // Action menu for each row
  const getActionMenu = (record) => {
    const menuItems = [
      {
        key: "view-activity",
        label: "View Activity",
        icon: <FileTextOutlined />,
        disabled: !record.hasActivity,
        onClick: () => handleViewActivity(record),
      },
      {
        key: "view-rubric",
        label: "View Rubric",
        icon: <TrophyOutlined />,
        disabled: !record.hasRubric,
        onClick: () => handleViewRubric(record),
      },
      {
        type: "divider",
      },
      {
        key: "generate-activity",
        label: "Generate Activity",
        icon: <BulbOutlined />,
        disabled: record.hasActivity,
        onClick: () => handleGenerateActivity(record),
      },
      {
        key: "generate-rubric",
        label: "Generate Rubric",
        icon: <TrophyOutlined />,
        disabled: record.hasRubric,
        onClick: () => handleGenerateRubric(record),
      },
      {
        type: "divider",
      },
      {
        key: "edit",
        label: "Edit",
        icon: <EditOutlined />,
        onClick: () => handleEditAssessment(record),
      },
      {
        key: "delete",
        label: "Delete",
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => handleDeleteAssessment(record),
      },
    ];

    return {
      items: menuItems,
    };
  };

  // Columns for lesson-based assessments table
  const lessonBasedColumns = [
    {
      title: "Assessment Details",
      key: "assessmentDetails",
      width: 300,
      render: (_, record) => (
        <div>
          <div className="assessment-title">
            {record.title || "Untitled Assessment"}
          </div>
          <div className="assessment-description">
            {record.description || "No description"}
          </div>
          <div className="assessment-meta">
            <Tag color="blue">
              {record.classId?.className || "Unknown Class"}
            </Tag>
            <Tag color="green">
              {record.lessonPlanSnapshot?.grade || "Unknown Grade"}
            </Tag>
            <Tag color="purple">{record.activityType}</Tag>
          </div>
        </div>
      ),
    },
    {
      title: "Lesson Plan",
      key: "lessonPlan",
      width: 200,
      render: (_, record) => (
        <div>
          <div className="lesson-title">
            {record.lessonPlanSnapshot?.title || "Unknown Lesson"}
          </div>
          <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
            Subject: {record.lessonPlanSnapshot?.subject || "N/A"}
          </div>
        </div>
      ),
    },
    {
      title: "Assessment Info",
      key: "assessmentInfo",
      width: 150,
      render: (_, record) => (
        <div>
          <div className="assessment-type">{record.assessmentType}</div>
          <div className="assessment-info">
            {record.questionCount} questions • {record.duration}
          </div>
        </div>
      ),
    },
    {
      title: "Progress",
      key: "progress",
      width: 120,
      render: (_, record) => (
        <div>
          <div style={{ marginBottom: 4 }}>
            <Tag
              color={record.hasActivity ? "success" : "default"}
              size="small"
            >
              {record.hasActivity ? "Activity ✓" : "Activity ✗"}
            </Tag>
          </div>
          <div>
            <Tag color={record.hasRubric ? "success" : "default"} size="small">
              {record.hasRubric ? "Rubric ✓" : "Rubric ✗"}
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) => {
        const color =
          status === "Generated"
            ? "success"
            : status === "Completed"
            ? "green"
            : "processing";
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            size="small"
            disabled={!record.hasActivity}
            onClick={() => handleViewActivity(record)}
            title="View Activity"
          />
          <Button
            type="text"
            icon={<TrophyOutlined />}
            size="small"
            disabled={!record.hasRubric}
            onClick={() => handleViewRubric(record)}
            title="View Rubric"
          />
          <Dropdown
            menu={getActionMenu(record)}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button type="text" icon={<MoreOutlined />} size="small" />
          </Dropdown>
        </Space>
      ),
    },
  ];

  // Columns for standalone assessments table
  const standaloneColumns = [
    {
      title: "Assessment Title",
      dataIndex: "title",
      key: "title",
      width: 250,
      render: (text, record) => (
        <div>
          <div className="assessment-title">{text}</div>
          <div className="assessment-description">{record.description}</div>
          <div className="assessment-meta">
            <Tag color="blue">{record.subject}</Tag>
            <Tag color="green">{record.grade}</Tag>
          </div>
        </div>
      ),
    },
    {
      title: "Assessment Details",
      key: "assessmentDetails",
      width: 200,
      render: (_, record) => (
        <div>
          <div className="assessment-type">{record.assessmentType}</div>
          <div className="assessment-info">
            {record.questionCount} questions • {record.duration}
          </div>
        </div>
      ),
    },
    {
      title: "Skills",
      dataIndex: "skills",
      key: "skills",
      width: 150,
      render: (skills) => (
        <div>
          {skills?.slice(0, 2).map((skill) => (
            <Tag key={skill} size="small" color="purple">
              {skill}
            </Tag>
          ))}
          {skills?.length > 2 && (
            <Tag size="small" color="default">
              +{skills.length - 2}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Progress",
      key: "progress",
      width: 120,
      render: (_, record) => (
        <div>
          <div style={{ marginBottom: 4 }}>
            <Tag
              color={record.hasActivity ? "success" : "default"}
              size="small"
            >
              {record.hasActivity ? "Activity ✓" : "Activity ✗"}
            </Tag>
          </div>
          <div>
            <Tag color={record.hasRubric ? "success" : "default"} size="small">
              {record.hasRubric ? "Rubric ✓" : "Rubric ✗"}
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: "Difficulty",
      dataIndex: "difficulty",
      key: "difficulty",
      width: 100,
      render: (difficulty) => {
        const color =
          difficulty === "Advanced"
            ? "red"
            : difficulty === "Intermediate"
            ? "orange"
            : "green";
        return <Tag color={color}>{difficulty}</Tag>;
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) => {
        const color = status === "Generated" ? "success" : "processing";
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            size="small"
            disabled={!record.hasActivity}
            onClick={() => handleViewActivity(record)}
            title="View Activity"
          />
          <Button
            type="text"
            icon={<TrophyOutlined />}
            size="small"
            disabled={!record.hasRubric}
            onClick={() => handleViewRubric(record)}
            title="View Rubric"
          />
          <Dropdown
            menu={getActionMenu(record)}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button type="text" icon={<MoreOutlined />} size="small" />
          </Dropdown>
        </Space>
      ),
    },
  ];

  // Standalone assessment options
  const standaloneOptions = [
    {
      id: "activity-in-class",
      title: "Activity in Class",
      description:
        "Interactive classroom activities with group work and discussions",
      icon: <ThunderboltOutlined />,
      color: "#ff4757",
    },
    {
      id: "assessment",
      title: "Assessment",
      description: "Comprehensive assessments with various question types",
      icon: <FileIcon />,
      color: "#42a5f5",
    },
    {
      id: "essay",
      title: "Essay",
      description: "Writing assignments and essay-based assessments",
      icon: <EditIcon />,
      color: "#ffa726",
    },
    {
      id: "textbook",
      title: "Textbook",
      description: "Textbook-based activities and exercises",
      icon: <BookIcon />,
      color: "#66bb6a",
    },
  ];

  // Handle create assessment button click
  const handleCreateAssessment = () => {
    if (activeTab === "lesson-based") {
      setIsLessonSelectionModalVisible(true);
    } else {
      setIsStandaloneOptionsVisible(true);
    }
  };

  // Handle standalone option selection
  const handleStandaloneOptionSelect = (optionId) => {
    setIsStandaloneOptionsVisible(false);
    setActiveStandaloneModal(optionId);
  };

  // Handle lesson-based assessment submission
  const handleLessonBasedSubmit = (data) => {
    console.log("Assessment created successfully:", data);
    setIsLessonSelectionModalVisible(false);
    message.success("Assessment created successfully!");
    loadAssessments(); // Refresh the assessments list
  };

  // Handle standalone assessment submission
  const handleStandaloneModalSubmit = async (data) => {
    console.log("Standalone Assessment data:", data);
    setActiveStandaloneModal(null);

    try {
      // TODO: Implement standalone assessment creation with backend
      // For now, just show success message
      message.success(
        "Standalone assessment feature will be implemented soon!"
      );

      // When implemented, this should:
      // 1. Call appropriate standalone assessment API
      // 2. Save the assessment to backend
      // 3. Refresh the assessments list
      // loadAssessments();
    } catch (error) {
      console.error("Error creating standalone assessment:", error);
      message.error("Failed to create standalone assessment");
    }
  };

  // Close all modals
  const closeAllModals = () => {
    setIsLessonSelectionModalVisible(false);
    setIsStandaloneOptionsVisible(false);
    setActiveStandaloneModal(null);
  };

  // Show loading spinner on initial load
  if (
    loading &&
    lessonBasedAssessments.length === 0 &&
    standaloneAssessments.length === 0
  ) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "400px",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="assessment-page">
      <div className="page-header">
        <div className="header-content">
          <div className="header-info">
            <h2>
              <FileTextOutlined /> Assessment Management
            </h2>
            <p>Create and manage assessments for your classes</p>
          </div>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={refreshing}
              title="Refresh assessments"
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={handleCreateAssessment}
              className="create-btn"
            >
              Create Assessment
            </Button>
          </Space>
        </div>
      </div>

      <Card className="main-content-card">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          className="assessment-tabs"
        >
          <TabPane
            tab={
              <span>
                <BookOutlined />
                From Lesson Plans ({lessonBasedAssessments.length})
              </span>
            }
            key="lesson-based"
          >
            <div className="tab-content">
              <div className="filters-section">
                <div className="filters-row">
                  <Search
                    placeholder="Search assessments..."
                    allowClear
                    style={{ width: 300 }}
                    prefix={<SearchOutlined />}
                    value={filters.search}
                    onChange={(e) =>
                      handleFilterChange("search", e.target.value)
                    }
                    onSearch={(value) => handleFilterChange("search", value)}
                  />
                  <Select
                    placeholder="Filter by activity type"
                    style={{ width: 180 }}
                    allowClear
                    value={filters.activityType}
                    onChange={(value) =>
                      handleFilterChange("activityType", value)
                    }
                  >
                    <Option value="assessment">Assessment</Option>
                    <Option value="essay">Essay</Option>
                    <Option value="textbook">Textbook</Option>
                    <Option value="activityInClass">Activity</Option>
                  </Select>
                  <Select
                    placeholder="Filter by status"
                    style={{ width: 150 }}
                    allowClear
                    value={filters.status}
                    onChange={(value) => handleFilterChange("status", value)}
                  >
                    <Option value="Generated">Generated</Option>
                    <Option value="Draft">Draft</Option>
                    <Option value="Completed">Completed</Option>
                  </Select>
                </div>
              </div>

              {lessonBasedAssessments.length === 0 && !loading ? (
                <Alert
                  message="No Lesson-Based Assessments Found"
                  description="Create your first assessment from an existing lesson plan to get started."
                  type="info"
                  showIcon
                  style={{ margin: "20px 0" }}
                />
              ) : (
                <Table
                  columns={lessonBasedColumns}
                  dataSource={lessonBasedAssessments}
                  rowKey="_id"
                  loading={loading}
                  pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `Total ${total} assessments`,
                    onChange: handleTableChange,
                  }}
                  className="assessment-table"
                />
              )}
            </div>
          </TabPane>

          <TabPane
            tab={
              <span>
                <BulbOutlined />
                Standalone Assessment ({standaloneAssessments.length})
              </span>
            }
            key="standalone"
          >
            <div className="tab-content">
              <div className="filters-section">
                <div className="filters-row">
                  <Search
                    placeholder="Search assessments..."
                    allowClear
                    style={{ width: 300 }}
                    prefix={<SearchOutlined />}
                    value={filters.search}
                    onChange={(e) =>
                      handleFilterChange("search", e.target.value)
                    }
                    onSearch={(value) => handleFilterChange("search", value)}
                  />
                  <Select
                    placeholder="Filter by grade"
                    style={{ width: 150 }}
                    allowClear
                    value={filters.grade}
                    onChange={(value) => handleFilterChange("grade", value)}
                  >
                    <Option value="form1">Form 1</Option>
                    <Option value="form2">Form 2</Option>
                    <Option value="form3">Form 3</Option>
                    <Option value="form4">Form 4</Option>
                    <Option value="form5">Form 5</Option>
                  </Select>
                  <Select
                    placeholder="Filter by type"
                    style={{ width: 200 }}
                    allowClear
                    value={filters.assessmentType}
                    onChange={(value) =>
                      handleFilterChange("assessmentType", value)
                    }
                  >
                    <Option value="comprehensive">Comprehensive Test</Option>
                    <Option value="portfolio">Portfolio Assessment</Option>
                    <Option value="literature">Literature Analysis</Option>
                    <Option value="activity">Activity Assessment</Option>
                    <Option value="essay">Essay Assessment</Option>
                  </Select>
                  <Select
                    placeholder="Filter by status"
                    style={{ width: 150 }}
                    allowClear
                    value={filters.status}
                    onChange={(value) => handleFilterChange("status", value)}
                  >
                    <Option value="Generated">Generated</Option>
                    <Option value="Draft">Draft</Option>
                    <Option value="Completed">Completed</Option>
                  </Select>
                </div>
              </div>

              {standaloneAssessments.length === 0 && !loading ? (
                <Alert
                  message="No Standalone Assessments Found"
                  description="Create your first standalone assessment to get started."
                  type="info"
                  showIcon
                  style={{ margin: "20px 0" }}
                />
              ) : (
                <Table
                  columns={standaloneColumns}
                  dataSource={standaloneAssessments}
                  rowKey="_id"
                  loading={loading}
                  pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: standaloneAssessments.length,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `Total ${total} assessments`,
                  }}
                  className="assessment-table"
                />
              )}
            </div>
          </TabPane>
        </Tabs>
      </Card>

      {/* Lesson-Based Assessment Modal (Entry Point) */}
      <LessonSelectionModal
        isOpen={isLessonSelectionModalVisible}
        onClose={() => setIsLessonSelectionModalVisible(false)}
        onSubmit={handleLessonBasedSubmit}
      />

      {/* Standalone Assessment Options Modal */}
      <Modal
        title="Choose Assessment Type"
        open={isStandaloneOptionsVisible}
        onCancel={() => setIsStandaloneOptionsVisible(false)}
        footer={null}
        width={800}
        className="creative-options-modal"
      >
        <div style={{ padding: "20px 0" }}>
          <p style={{ marginBottom: 24, color: "#666", textAlign: "center" }}>
            Select the type of assessment you would like to create:
          </p>
          <Row gutter={[16, 16]}>
            {standaloneOptions.map((option) => (
              <Col xs={24} sm={12} key={option.id}>
                <Card
                  hoverable
                  className="creative-option-card"
                  onClick={() => handleStandaloneOptionSelect(option.id)}
                  style={{
                    textAlign: "center",
                    border: "2px solid #f0f0f0",
                    borderRadius: "12px",
                    transition: "all 0.3s ease",
                  }}
                  bodyStyle={{ padding: "24px 16px" }}
                >
                  <div
                    style={{
                      fontSize: "48px",
                      color: option.color,
                      marginBottom: "16px",
                    }}
                  >
                    {option.icon}
                  </div>
                  <h3
                    style={{
                      margin: "0 0 8px 0",
                      color: "#262626",
                      fontSize: "18px",
                    }}
                  >
                    {option.title}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      color: "#666",
                      fontSize: "14px",
                      lineHeight: 1.4,
                    }}
                  >
                    {option.description}
                  </p>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </Modal>

      {/* Standalone Assessment Modals */}
      <ActivityInClassStandaloneModal
        isOpen={activeStandaloneModal === "activity-in-class"}
        onClose={closeAllModals}
        onSubmit={handleStandaloneModalSubmit}
      />

      <AssessmentStandaloneModal
        isOpen={activeStandaloneModal === "assessment"}
        onClose={closeAllModals}
        onSubmit={handleStandaloneModalSubmit}
      />

      <EssayStandaloneModal
        isOpen={activeStandaloneModal === "essay"}
        onClose={closeAllModals}
        onSubmit={handleStandaloneModalSubmit}
      />

      <TextbookStandaloneModal
        isOpen={activeStandaloneModal === "textbook"}
        onClose={closeAllModals}
        onSubmit={handleStandaloneModalSubmit}
      />
    </div>
  );
};

export default AssessmentPage;
