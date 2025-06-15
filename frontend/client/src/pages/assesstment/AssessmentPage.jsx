// src/pages/assessment/AssessmentPage.jsx - Updated with backend integration
import React, { useState, useEffect } from "react";
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
  FileExclamationOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

// Import services
import { getAllLessonPlans } from "../../services/lessonService";
import { getAllClasses } from "../../services/classService";
import { assessmentAPI } from "../../services/assessmentService";
import { useUser } from "../../context/UserContext";

// Lesson-Based Assessment Modal
import LessonSelectionModal from "../../components/Modal/LessonBasedAssessment/LessonSelectionModal";

import "./AssessmentPage.css";

const { TabPane } = Tabs;
const { Search } = Input;
const { Option } = Select;

const AssessmentPage = () => {
  const navigate = useNavigate();
  const { userId } = useUser();

  const [activeTab, setActiveTab] = useState("lesson-based");
  const [loading, setLoading] = useState(false);

  // Lesson-Based Assessment Modal State
  const [isLessonSelectionModalVisible, setIsLessonSelectionModalVisible] =
    useState(false);

  // Data states
  const [lessonPlans, setLessonPlans] = useState([]);
  const [classes, setClasses] = useState([]);
  const [assessments, setAssessments] = useState([]);

  // Filter states
  const [filters, setFilters] = useState({
    search: "",
    classId: null,
    activityType: null,
    status: null,
  });

  // Load data on component mount
  useEffect(() => {
    loadInitialData();
  }, [userId]);

  // Load assessments when tab changes
  useEffect(() => {
    if (activeTab === "lesson-based") {
      loadLessonBasedAssessments();
    } else {
      loadStandaloneAssessments();
    }
  }, [activeTab, filters]);

  const loadInitialData = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const [lessonPlansData, classesData] = await Promise.all([
        getAllLessonPlans(),
        getAllClasses(),
      ]);

      setLessonPlans(Array.isArray(lessonPlansData) ? lessonPlansData : []);
      setClasses(Array.isArray(classesData) ? classesData : []);
    } catch (error) {
      console.error("Error loading initial data:", error);
      message.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const loadLessonBasedAssessments = async () => {
    try {
      setLoading(true);
      const response = await assessmentAPI.getUserAssessments({
        ...filters,
        hasLessonPlan: true, // Only get assessments that were created from lesson plans
      });

      if (response.success) {
        setAssessments(response.data || []);
      }
    } catch (error) {
      console.error("Error loading lesson-based assessments:", error);
      message.error("Failed to load assessments");
    } finally {
      setLoading(false);
    }
  };

  const loadStandaloneAssessments = async () => {
    try {
      setLoading(true);
      const response = await assessmentAPI.getUserAssessments({
        ...filters,
        hasLessonPlan: false, // Only get standalone assessments (no lesson plan)
      });

      if (response.success) {
        setAssessments(response.data || []);
      }
    } catch (error) {
      console.error("Error loading standalone assessments:", error);
      message.error("Failed to load assessments");
    } finally {
      setLoading(false);
    }
  };

  // Handle create assessment button click
  const handleCreateAssessment = () => {
    if (activeTab === "lesson-based") {
      setIsLessonSelectionModalVisible(true);
    } else {
      // Handle standalone assessment creation
      message.info("Standalone assessment creation coming soon!");
    }
  };

  // Handle lesson-based assessment submission
  const handleLessonBasedSubmit = async (data) => {
    try {
      setLoading(true);

      // The data structure comes from LessonSelectionModal
      console.log("Received assessment data:", data);

      message.success("Assessment created successfully!");
      setIsLessonSelectionModalVisible(false);

      // Refresh the assessments list
      loadLessonBasedAssessments();

      // Navigate to the generated assessment
      if (data.data?._id) {
        navigate(`/app/assessment/activity/${data.data._id}`);
      }
    } catch (error) {
      console.error("Error creating assessment:", error);
      message.error("Failed to create assessment");
    } finally {
      setLoading(false);
    }
  };

  // Handle viewing assessment activity
  const handleViewActivity = (record) => {
    if (record.hasActivity) {
      navigate(`/app/assessment/activity/${record._id}`);
    } else {
      message.warning("No activity available for this assessment");
    }
  };

  // Handle viewing assessment rubric
  const handleViewRubric = (record) => {
    if (record.hasRubric) {
      navigate(`/app/assessment/rubric/${record._id}`);
    } else {
      message.warning("No rubric available for this assessment");
    }
  };

  // Handle deleting assessment
  const handleDeleteAssessment = async (record) => {
    Modal.confirm({
      title: "Delete Assessment",
      content: `Are you sure you want to delete "${record.title}"?`,
      onOk: async () => {
        try {
          await assessmentAPI.deleteAssessment(record._id);
          message.success("Assessment deleted successfully");

          // Refresh the list
          if (activeTab === "lesson-based") {
            loadLessonBasedAssessments();
          } else {
            loadStandaloneAssessments();
          }
        } catch (error) {
          console.error("Error deleting assessment:", error);
          message.error("Failed to delete assessment");
        }
      },
    });
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Columns for lesson-based assessments table
  const lessonBasedColumns = [
    {
      title: "Lesson Plan",
      dataIndex: "lessonPlanSnapshot",
      key: "lessonPlan",
      width: 250,
      render: (snapshot, record) => (
        <div>
          <div className="lesson-title">{snapshot?.title || record.title}</div>
          <div className="lesson-meta">
            {record.classId && (
              <>
                <Tag color="blue">{record.classId.className}</Tag>
                <Tag color="green">{record.classId.grade}</Tag>
              </>
            )}
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
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status, record) => {
        const color = status === "Generated" ? "success" : "processing";
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "Content",
      key: "content",
      width: 120,
      render: (_, record) => (
        <Space>
          {record.hasActivity && (
            <Tag
              color="blue"
              style={{ cursor: "pointer" }}
              onClick={() => handleViewActivity(record)}
            >
              Activity
            </Tag>
          )}
          {record.hasRubric && (
            <Tag
              color="green"
              style={{ cursor: "pointer" }}
              onClick={() => handleViewRubric(record)}
            >
              Rubric
            </Tag>
          )}
        </Space>
      ),
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
      width: 150,
      render: (_, record) => (
        <Space>
          {record.hasActivity && (
            <Button
              type="text"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleViewActivity(record)}
              title="View Activity"
            />
          )}
          {record.hasRubric && (
            <Button
              type="text"
              icon={<FileExclamationOutlined />}
              size="small"
              onClick={() => handleViewRubric(record)}
              title="View Rubric"
            />
          )}
          <Button
            type="text"
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => handleDeleteAssessment(record)}
            title="Delete Assessment"
          />
        </Space>
      ),
    },
  ];

  // Filter options for classes
  const classOptions = classes.map((cls) => (
    <Option key={cls._id} value={cls._id}>
      {cls.className} - {cls.grade}
    </Option>
  ));

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
            loading={loading}
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
                    placeholder="Search assessments..."
                    allowClear
                    style={{ width: 300 }}
                    prefix={<SearchOutlined />}
                    value={filters.search}
                    onChange={(e) =>
                      handleFilterChange("search", e.target.value)
                    }
                  />
                  <Select
                    placeholder="Filter by class"
                    style={{ width: 200 }}
                    allowClear
                    value={filters.classId}
                    onChange={(value) => handleFilterChange("classId", value)}
                  >
                    {classOptions}
                  </Select>
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
                    <Option value="activity">Activity</Option>
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
                  </Select>
                </div>
              </div>

              <Spin spinning={loading}>
                <Table
                  columns={lessonBasedColumns}
                  dataSource={assessments}
                  rowKey="_id"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `Total ${total} assessments`,
                  }}
                  className="assessment-table"
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
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <BulbOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />
                <h3 style={{ color: "#666", marginTop: 16 }}>
                  Standalone Assessments
                </h3>
                <p style={{ color: "#999" }}>
                  Create assessments without lesson plans - Coming Soon!
                </p>
              </div>
            </div>
          </TabPane>
        </Tabs>
      </Card>

      {/* Lesson-Based Assessment Modal */}
      <LessonSelectionModal
        isOpen={isLessonSelectionModalVisible}
        onClose={() => setIsLessonSelectionModalVisible(false)}
        onSubmit={handleLessonBasedSubmit}
      />
    </div>
  );
};

export default AssessmentPage;
