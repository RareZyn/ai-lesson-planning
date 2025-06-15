// src/pages/assessment/AssessmentPage.jsx - Fixed version
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

  // Load assessments when tab changes or filters change
  useEffect(() => {
    if (activeTab === "lesson-based") {
      loadLessonBasedData(); // This will show lesson plans and their assessment status
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

  // FIXED: New function to load lesson plans with assessment status
  const loadLessonBasedData = async () => {
    try {
      setLoading(true);

      // Get all lesson plans for the user
      const allLessonPlans = await getAllLessonPlans();

      // Get all assessments that have lesson plans
      const assessmentResponse = await assessmentAPI.getUserAssessments({
        ...filters,
        hasLessonPlan: "true", // FIXED: Pass as string
      });

      const assessmentsWithLessonPlans = assessmentResponse.success
        ? assessmentResponse.data || []
        : [];

      // Create a map of lesson plan IDs to their assessments
      const lessonPlanAssessmentMap = {};
      assessmentsWithLessonPlans.forEach((assessment) => {
        if (assessment.lessonPlanId) {
          const lessonPlanId =
            typeof assessment.lessonPlanId === "object"
              ? assessment.lessonPlanId._id
              : assessment.lessonPlanId;

          if (!lessonPlanAssessmentMap[lessonPlanId]) {
            lessonPlanAssessmentMap[lessonPlanId] = [];
          }
          lessonPlanAssessmentMap[lessonPlanId].push(assessment);
        }
      });

      // Transform lesson plans into displayable format with assessment status
      const lessonPlanRows = allLessonPlans.map((lessonPlan) => {
        const assessments = lessonPlanAssessmentMap[lessonPlan._id] || [];
        const hasAssessments = assessments.length > 0;

        return {
          ...lessonPlan,
          assessmentStatus: hasAssessments ? "generated" : "not_generated",
          assessments: assessments,
          hasActivity: assessments.some((a) => a.hasActivity),
          hasRubric: assessments.some((a) => a.hasRubric),
          // For display purposes, we'll use the lesson plan data
          title: lessonPlan.parameters?.specificTopic || "Untitled Lesson",
          description: lessonPlan.plan?.learningObjective || "",
          activityType: lessonPlan.parameters?.activityType || "lesson",
          createdAt: lessonPlan.createdAt,
          updatedAt: lessonPlan.updatedAt,
          status: hasAssessments ? "Generated" : "Not Generated",
        };
      });

      // Apply filters to lesson plans
      let filteredRows = lessonPlanRows;

      if (filters.search) {
        filteredRows = filteredRows.filter(
          (row) =>
            row.title.toLowerCase().includes(filters.search.toLowerCase()) ||
            row.description.toLowerCase().includes(filters.search.toLowerCase())
        );
      }

      if (filters.classId) {
        filteredRows = filteredRows.filter(
          (row) =>
            row.classId?._id === filters.classId ||
            row.classId === filters.classId
        );
      }

      if (filters.status) {
        if (filters.status === "Generated") {
          filteredRows = filteredRows.filter(
            (row) => row.assessmentStatus === "generated"
          );
        } else if (filters.status === "Not Generated") {
          filteredRows = filteredRows.filter(
            (row) => row.assessmentStatus === "not_generated"
          );
        }
      }

      setAssessments(filteredRows);
    } catch (error) {
      console.error("Error loading lesson-based data:", error);
      message.error("Failed to load lesson plans and assessments");
    } finally {
      setLoading(false);
    }
  };

  const loadStandaloneAssessments = async () => {
    try {
      setLoading(true);
      const response = await assessmentAPI.getUserAssessments({
        ...filters,
        hasLessonPlan: "false", // FIXED: Pass as string
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

      console.log("Received assessment data:", data);

      message.success("Assessment created successfully!");
      setIsLessonSelectionModalVisible(false);

      // Refresh the lesson plans list to show updated status
      loadLessonBasedData();

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
    if (
      record.assessmentStatus === "generated" &&
      record.assessments?.length > 0
    ) {
      // Find the first assessment with activity
      const assessmentWithActivity = record.assessments.find(
        (a) => a.hasActivity
      );
      if (assessmentWithActivity) {
        navigate(`/app/assessment/activity/${assessmentWithActivity._id}`);
      } else {
        message.warning("No activity available for this assessment");
      }
    } else {
      message.warning("No assessment activity available for this lesson plan");
    }
  };

  // Handle viewing assessment rubric
  const handleViewRubric = (record) => {
    if (
      record.assessmentStatus === "generated" &&
      record.assessments?.length > 0
    ) {
      // Find the first assessment with rubric
      const assessmentWithRubric = record.assessments.find((a) => a.hasRubric);
      if (assessmentWithRubric) {
        navigate(`/app/assessment/rubric/${assessmentWithRubric._id}`);
      } else {
        message.warning("No rubric available for this assessment");
      }
    } else {
      message.warning("No assessment rubric available for this lesson plan");
    }
  };

  // Handle deleting assessment
  const handleDeleteAssessment = async (record) => {
    if (record.assessments?.length > 0) {
      Modal.confirm({
        title: "Delete Assessment",
        content: `Are you sure you want to delete the assessment(s) for "${record.title}"?`,
        onOk: async () => {
          try {
            // Delete all assessments for this lesson plan
            await Promise.all(
              record.assessments.map((assessment) =>
                assessmentAPI.deleteAssessment(assessment._id)
              )
            );
            message.success("Assessment(s) deleted successfully");
            loadLessonBasedData(); // Refresh the list
          } catch (error) {
            console.error("Error deleting assessment:", error);
            message.error("Failed to delete assessment(s)");
          }
        },
      });
    } else {
      message.info("No assessments to delete for this lesson plan");
    }
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // FIXED: Updated columns for lesson-based view
  const lessonBasedColumns = [
    {
      title: "Lesson Plan",
      key: "lessonPlan",
      width: 250,
      render: (_, record) => (
        <div>
          <div className="lesson-title">{record.title}</div>
          <div className="lesson-meta">
            {record.classId && (
              <>
                <Tag color="blue">
                  {typeof record.classId === "object"
                    ? record.classId.className
                    : "Unknown Class"}
                </Tag>
                <Tag color="green">
                  {typeof record.classId === "object"
                    ? record.classId.grade
                    : record.parameters?.grade || "Unknown Grade"}
                </Tag>
              </>
            )}
            <Tag color="purple">{record.activityType}</Tag>
          </div>
        </div>
      ),
    },
    {
      title: "Assessment Status",
      key: "assessmentStatus",
      width: 150,
      render: (_, record) => (
        <div>
          <Tag
            color={
              record.assessmentStatus === "generated" ? "success" : "warning"
            }
          >
            {record.assessmentStatus === "generated"
              ? "Generated"
              : "Not Generated"}
          </Tag>
          {record.assessments?.length > 0 && (
            <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
              {record.assessments.length} assessment(s)
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Content Available",
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
          {record.assessmentStatus === "not_generated" && (
            <Tag color="default">No Content</Tag>
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
          {record.assessments?.length > 0 && (
            <Button
              type="text"
              icon={<DeleteOutlined />}
              size="small"
              danger
              onClick={() => handleDeleteAssessment(record)}
              title="Delete Assessment"
            />
          )}
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
                    placeholder="Search lesson plans..."
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
                    placeholder="Filter by status"
                    style={{ width: 150 }}
                    allowClear
                    value={filters.status}
                    onChange={(value) => handleFilterChange("status", value)}
                  >
                    <Option value="Generated">Generated</Option>
                    <Option value="Not Generated">Not Generated</Option>
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
                    showTotal: (total) => `Total ${total} lesson plans`,
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
