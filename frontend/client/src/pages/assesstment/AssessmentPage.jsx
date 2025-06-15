// src/pages/assessment/AssessmentPage.jsx - Updated with backend integration for lesson-based assessments
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
  LoadingOutlined,
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

  // Data States
  const [lessonBasedAssessments, setLessonBasedAssessments] = useState([]);
  const [standaloneAssessments, setStandaloneAssessments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [activityTypeFilter, setActivityTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal States
  const [isLessonSelectionModalVisible, setIsLessonSelectionModalVisible] =
    useState(false);
  const [isStandaloneOptionsVisible, setIsStandaloneOptionsVisible] =
    useState(false);
  const [activeStandaloneModal, setActiveStandaloneModal] = useState(null);

  // Fetch lesson-based assessments from backend
  const fetchLessonBasedAssessments = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: pageSize,
        search: searchTerm,
        classFilter,
        activityTypeFilter,
        statusFilter,
      };

      const response = await assessmentAPI.getUserAssessments(params);

      if (response.success) {
        setLessonBasedAssessments(response.data || []);
        setTotalCount(response.total || 0);
      } else {
        message.error("Failed to fetch assessments");
      }
    } catch (error) {
      console.error("Error fetching assessments:", error);
      message.error("Error loading assessments");
      setLessonBasedAssessments([]);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    if (activeTab === "lesson-based") {
      fetchLessonBasedAssessments();
    }
  }, [
    userId,
    currentPage,
    pageSize,
    searchTerm,
    classFilter,
    activityTypeFilter,
    statusFilter,
    activeTab,
  ]);

  // Navigation functions
  const handleViewActivity = (record) => {
    if (record.hasActivity) {
      navigate(`/app/assessment/activity/${record.id}`);
    } else {
      message.warning("No activity generated for this assessment yet.");
    }
  };

  const handleViewRubric = (record) => {
    if (record.hasRubric) {
      navigate(`/app/assessment/rubric/${record.id}`);
    } else {
      message.warning("No rubric generated for this assessment yet.");
    }
  };

  const handleEditAssessment = (record) => {
    message.info(`Edit functionality for assessment ${record.id}`);
    // TODO: Implement edit functionality
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
          await assessmentAPI.deleteAssessment(record.id);
          message.success(
            `Assessment "${
              record.title || record.lessonTitle
            }" deleted successfully`
          );
          fetchLessonBasedAssessments(); // Refresh the list
        } catch (error) {
          console.error("Error deleting assessment:", error);
          message.error("Failed to delete assessment");
        }
      },
    });
  };

  const handleGenerateActivity = async (record) => {
    message.loading("Generating activity...", 2);
    try {
      // Call the appropriate generation endpoint based on activity type
      let response;

      switch (record.activityType) {
        case "essay":
          response = await assessmentAPI.generateEssayAssessment(
            record.originalData
          );
          break;
        case "textbook":
          response = await assessmentAPI.generateTextbookActivity(
            record.originalData
          );
          break;
        case "activity":
        case "assessment":
        default:
          response = await assessmentAPI.generateActivityAndRubric(
            record.originalData
          );
          break;
      }

      if (response.success) {
        message.success("Activity generated successfully!");
        // Update the record to show it has activity
        setLessonBasedAssessments((prev) =>
          prev.map((item) =>
            item.id === record.id
              ? {
                  ...item,
                  hasActivity: true,
                  activityHTML: response.activityHTML,
                }
              : item
          )
        );
      } else {
        message.error("Failed to generate activity");
      }
    } catch (error) {
      console.error("Error generating activity:", error);
      message.error("Failed to generate activity");
    }
  };

  const handleGenerateRubric = async (record) => {
    message.loading("Generating rubric...", 2);
    try {
      // Call the appropriate generation endpoint based on activity type
      let response;

      switch (record.activityType) {
        case "essay":
          response = await assessmentAPI.generateEssayAssessment(
            record.originalData
          );
          break;
        case "textbook":
          response = await assessmentAPI.generateTextbookActivity(
            record.originalData
          );
          break;
        case "activity":
        case "assessment":
        default:
          response = await assessmentAPI.generateActivityAndRubric(
            record.originalData
          );
          break;
      }

      if (response.success) {
        message.success("Rubric generated successfully!");
        // Update the record to show it has rubric
        setLessonBasedAssessments((prev) =>
          prev.map((item) =>
            item.id === record.id
              ? { ...item, hasRubric: true, rubricHTML: response.rubricHTML }
              : item
          )
        );
      } else {
        message.error("Failed to generate rubric");
      }
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
      title: "Lesson Plan",
      dataIndex: "lessonTitle",
      key: "lessonTitle",
      width: 250,
      render: (text, record) => (
        <div>
          <div className="lesson-title">{text || record.title}</div>
          <div className="lesson-meta">
            <Tag color="blue">{record.class}</Tag>
            <Tag color="green">{record.grade}</Tag>
            <Tag color="purple">{record.activityType}</Tag>
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
          {skills &&
            skills.slice(0, 2).map((skill) => (
              <Tag key={skill} size="small" color="purple">
                {skill}
              </Tag>
            ))}
          {skills && skills.length > 2 && (
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
      dataIndex: "createdDate",
      key: "createdDate",
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

  // Handle modal submissions
  const handleLessonBasedSubmit = async (data) => {
    console.log("Lesson-Based Assessment data:", data);
    try {
      // The data contains the generated assessment from the backend
      if (data.success) {
        message.success("Assessment created successfully!");
        // Refresh the assessments list
        fetchLessonBasedAssessments();
      } else {
        message.error("Failed to create assessment");
      }
    } catch (error) {
      console.error("Error handling lesson-based submission:", error);
      message.error("Failed to create assessment");
    }
    setIsLessonSelectionModalVisible(false);
  };

  const handleStandaloneModalSubmit = (data) => {
    console.log("Standalone Assessment data:", data);
    setActiveStandaloneModal(null);
    message.success("Assessment created successfully!");
  };

  // Close all modals
  const closeAllModals = () => {
    setIsLessonSelectionModalVisible(false);
    setIsStandaloneOptionsVisible(false);
    setActiveStandaloneModal(null);
  };

  // Handle filter changes
  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page
  };

  const handleFilterChange = (filterType, value) => {
    switch (filterType) {
      case "class":
        setClassFilter(value);
        break;
      case "activityType":
        setActivityTypeFilter(value);
        break;
      case "status":
        setStatusFilter(value);
        break;
      default:
        break;
    }
    setCurrentPage(1); // Reset to first page
  };

  // Handle pagination
  const handleTableChange = (pagination) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

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
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={handleCreateAssessment}
            className="create-btn"
          >
            Create Assessment
          </Button>
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
                From Lesson Plans
              </span>
            }
            key="lesson-based"
          >
            <div className="tab-content">
              <div className="filters-section">
                <div className="filters-row">
                  <Search
                    placeholder="Search lesson plans..."
                    allowClear
                    style={{ width: 300 }}
                    prefix={<SearchOutlined />}
                    onSearch={handleSearch}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Select
                    placeholder="Filter by class"
                    style={{ width: 150 }}
                    allowClear
                    onChange={(value) => handleFilterChange("class", value)}
                  >
                    <Option value="5-anggerik">5 Anggerik</Option>
                    <Option value="5-um">5 UM</Option>
                    <Option value="biruni">Biruni</Option>
                    <Option value="5-uthm">5 UTHM</Option>
                  </Select>
                  <Select
                    placeholder="Filter by activity type"
                    style={{ width: 180 }}
                    allowClear
                    onChange={(value) =>
                      handleFilterChange("activityType", value)
                    }
                  >
                    <Option value="assessment">Assessment</Option>
                    <Option value="essay">Essay</Option>
                    <Option value="textbook">Textbook</Option>
                    <Option value="activity">Activity</Option>
                  </Select>
                  <Select
                    placeholder="Filter by status"
                    style={{ width: 150 }}
                    allowClear
                    onChange={(value) => handleFilterChange("status", value)}
                  >
                    <Option value="generated">Generated</Option>
                    <Option value="draft">Draft</Option>
                  </Select>
                </div>
              </div>

              <Spin spinning={loading}>
                <Table
                  columns={lessonBasedColumns}
                  dataSource={lessonBasedAssessments}
                  rowKey="id"
                  pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: totalCount,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `Total ${total} assessments`,
                    onChange: handleTableChange,
                  }}
                  className="assessment-table"
                  locale={{
                    emptyText: loading ? (
                      <LoadingOutlined />
                    ) : (
                      "No assessments found"
                    ),
                  }}
                />
              </Spin>
            </div>
          </TabPane>

          <TabPane
            tab={
              <span>
                <BulbOutlined />
                Standalone Assessment
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
                  />
                  <Select
                    placeholder="Filter by grade"
                    style={{ width: 150 }}
                    allowClear
                  >
                    <Option value="form4">Form 4</Option>
                    <Option value="form5">Form 5</Option>
                  </Select>
                  <Select
                    placeholder="Filter by type"
                    style={{ width: 200 }}
                    allowClear
                  >
                    <Option value="comprehensive">Comprehensive Test</Option>
                    <Option value="portfolio">Portfolio Assessment</Option>
                    <Option value="literature">Literature Analysis</Option>
                    <Option value="activity">Activity Assessment</Option>
                  </Select>
                </div>
              </div>

              {/* Placeholder for standalone assessments - implement later */}
              <div style={{ padding: 40, textAlign: "center", color: "#666" }}>
                <BulbOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <h3>Standalone Assessments</h3>
                <p>
                  Create assessments without requiring existing lesson plans
                </p>
              </div>
            </div>
          </TabPane>
        </Tabs>
      </Card>

      {/* Lesson-Based Assessment Modal (Entry Point) */}
      <LessonSelectionModal
        isOpen={isLessonSelectionModalVisible}
        onClose={() => setIsLessonSelectionModalVisible(false)}
        onSubmit={handleLessonBasedSubmit}
        currentUserId={userId}
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
