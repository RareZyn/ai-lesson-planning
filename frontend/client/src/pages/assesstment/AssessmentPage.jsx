// FIXED: src/pages/assessment/AssessmentPage.jsx - Corrected filter logic
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
  ThunderboltOutlined,
  RedoOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

// Import services
import { getAllLessonPlans } from "../../services/lessonService";
import { getAllClasses } from "../../services/classService";
import { assessmentAPI } from "../../services/assessmentService";
import { useUser } from "../../context/UserContext";

// Import modals
import ActivityInClassLessonModal from "../../components/Modal/LessonBasedAssessment/ActivityInClassLessonModal";
import EssayLessonModal from "../../components/Modal/LessonBasedAssessment/EssayLessonModal";
import AssessmentLessonModal from "../../components/Modal/LessonBasedAssessment/AssessmentLessonModal";
import TextbookLessonModal from "../../components/Modal/LessonBasedAssessment/TextbookLessonModal";

import "./AssessmentPage.css";

const { Search } = Input;
const { Option } = Select;

const AssessmentPage = () => {
  const navigate = useNavigate();
  const { userId } = useUser();

  const [activeTab, setActiveTab] = useState("lesson-based");
  const [loading, setLoading] = useState(false);
  const [generatingAssessment, setGeneratingAssessment] = useState(null);

  // Modal states for regeneration
  const [regenerateModalOpen, setRegenerateModalOpen] = useState(false);
  const [regenerateModalType, setRegenerateModalType] = useState(null);
  const [regeneratingLessonPlan, setRegeneratingLessonPlan] = useState(null);
  const [existingAssessment, setExistingAssessment] = useState(null);

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
      loadLessonBasedData();
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
      message.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Completely rewritten loadLessonBasedData function
  const loadLessonBasedData = async () => {
    try {
      setLoading(true);
      console.log("🔄 Loading lesson-based data with filters:", filters);

      // Get all lesson plans for the user
      const allLessonPlans = await getAllLessonPlans();
      console.log("📚 All lesson plans loaded:", allLessonPlans.length);

      // Get all assessments that have lesson plans
      const assessmentResponse = await assessmentAPI.getUserAssessments({
        ...filters,
        hasLessonPlan: "true",
      });

      const assessmentsWithLessonPlans = assessmentResponse.success
        ? assessmentResponse.data || []
        : [];
      console.log(
        "📝 Assessments with lesson plans:",
        assessmentsWithLessonPlans.length
      );

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

      // FIXED: Transform lesson plans with correct assessment status logic
      let lessonPlanRows = allLessonPlans.map((lessonPlan) => {
        const assessments = lessonPlanAssessmentMap[lessonPlan._id] || [];
        const hasAssessments = assessments.length > 0;

        // CRITICAL FIX: Determine assessment status correctly
        const assessmentStatus = hasAssessments ? "generated" : "not_generated";

        const row = {
          ...lessonPlan,
          assessmentStatus: assessmentStatus, // This is the key field for filtering
          assessments: assessments,
          hasActivity: assessments.some((a) => a.hasActivity),
          hasRubric: assessments.some((a) => a.hasRubric),
          title: lessonPlan.parameters?.specificTopic || "Untitled Lesson",
          description: lessonPlan.plan?.learningObjective || "",
          activityType: lessonPlan.parameters?.activityType || "lesson",
          createdAt: lessonPlan.createdAt,
          updatedAt: lessonPlan.updatedAt,
          status: hasAssessments ? "Generated" : "Not Generated", // Display status
        };

        return row;
      });

      console.log("📊 Initial transformation:", {
        total: lessonPlanRows.length,
        generated: lessonPlanRows.filter(
          (r) => r.assessmentStatus === "generated"
        ).length,
        notGenerated: lessonPlanRows.filter(
          (r) => r.assessmentStatus === "not_generated"
        ).length,
      });

      // FIXED: Apply filters correctly with proper logging
      let filteredRows = [...lessonPlanRows]; // Create a copy

      // Search filter
      if (filters.search) {
        const beforeCount = filteredRows.length;
        filteredRows = filteredRows.filter(
          (row) =>
            row.title.toLowerCase().includes(filters.search.toLowerCase()) ||
            row.description.toLowerCase().includes(filters.search.toLowerCase())
        );
        console.log(
          "🔍 Search filter applied:",
          beforeCount,
          "→",
          filteredRows.length
        );
      }

      // Class filter
      if (filters.classId) {
        const beforeCount = filteredRows.length;
        filteredRows = filteredRows.filter(
          (row) =>
            row.classId?._id === filters.classId ||
            row.classId === filters.classId
        );
        console.log(
          "🏫 Class filter applied:",
          beforeCount,
          "→",
          filteredRows.length
        );
      }

      // CRITICAL FIX: Status filter logic
      if (filters.status) {
        const beforeCount = filteredRows.length;
        console.log("📊 Status filter details:", {
          filterValue: filters.status,
          rowsBeforeFilter: beforeCount,
          sampleStatuses: filteredRows.slice(0, 5).map((r) => ({
            title: r.title,
            assessmentStatus: r.assessmentStatus,
            status: r.status,
            hasAssessments: r.assessments?.length || 0,
          })),
        });

        // FIXED: Use the correct field and values for filtering
        if (filters.status === "Generated") {
          filteredRows = filteredRows.filter(
            (row) => row.assessmentStatus === "generated"
          );
        } else if (filters.status === "Not Generated") {
          filteredRows = filteredRows.filter(
            (row) => row.assessmentStatus === "not_generated"
          );
        }

        console.log(
          "📊 Status filter applied:",
          beforeCount,
          "→",
          filteredRows.length
        );

        // Debug: Log the filtered results
        console.log(
          "📊 Filtered rows sample:",
          filteredRows.slice(0, 3).map((r) => ({
            title: r.title,
            assessmentStatus: r.assessmentStatus,
            status: r.status,
            assessmentCount: r.assessments?.length || 0,
          }))
        );
      }

      console.log("✅ Final result:", filteredRows.length, "rows to display");
      setAssessments(filteredRows);
    } catch (error) {
      console.error("❌ Error in loadLessonBasedData:", error);
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
        hasLessonPlan: "false",
      });

      if (response.success) {
        setAssessments(response.data || []);
      }
    } catch (error) {
      message.error("Failed to load assessments");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAssessment = async (record) => {
    try {
      setGeneratingAssessment(record._id);

      // Check if lesson plan has activity configuration
      if (!record.parameters?.activityConfiguration) {
        Modal.confirm({
          title: "Activity Configuration Required",
          content: `This lesson plan "${record.title}" doesn't have activity configuration. You need to configure the activity type first in the lesson planner before generating assessments.`,
          okText: "Go to Lesson Planner",
          cancelText: "Cancel",
          onOk: () => {
            navigate("/app/lesson-planner");
          },
        });
        return;
      }

      await generateNewAssessment(record);
    } catch (error) {
      message.error("Failed to generate assessment");
      console.error("Generate assessment error:", error);
    } finally {
      setGeneratingAssessment(null);
    }
  };

  // NEW: Handle regenerate assessment button click
  const handleRegenerateAssessment = (record) => {
    // Get the activity type from the lesson plan configuration
    const activityConfig = record.parameters?.activityConfiguration;
    const activityType =
      activityConfig?.type || record.parameters?.activityType;

    if (!activityType) {
      message.error("Cannot determine activity type for regeneration");
      return;
    }

    // Get the existing assessment (take the first one)
    const existingAssmt = record.assessments?.[0];
    if (!existingAssmt) {
      message.error("No existing assessment found to regenerate");
      return;
    }

    // Set up modal states
    setRegeneratingLessonPlan(record);
    setExistingAssessment(existingAssmt);
    setRegenerateModalType(activityType);
    setRegenerateModalOpen(true);
  };

  // NEW: Handle modal submission for regeneration
  const handleRegenerateModalSubmit = async (formData) => {
    try {
      setGeneratingAssessment(regeneratingLessonPlan._id);

      // Prepare lesson plan data
      const lessonPlanData = {
        lessonPlanId: regeneratingLessonPlan._id,
        classId:
          regeneratingLessonPlan.classId?._id || regeneratingLessonPlan.classId,
        lesson: regeneratingLessonPlan.title,
        subject:
          regeneratingLessonPlan.classId?.subject ||
          regeneratingLessonPlan.parameters?.subject ||
          "English",
        theme:
          regeneratingLessonPlan.parameters?.sow?.theme ||
          regeneratingLessonPlan.parameters?.theme,
        topic:
          regeneratingLessonPlan.parameters?.specificTopic ||
          regeneratingLessonPlan.title,
        grade:
          regeneratingLessonPlan.parameters?.grade ||
          regeneratingLessonPlan.classId?.grade,
        contentStandard: {
          main:
            regeneratingLessonPlan.parameters?.sow?.contentStandard?.main || "",
          component:
            regeneratingLessonPlan.parameters?.sow?.contentStandard?.comp || "",
        },
        learningStandard: {
          main:
            regeneratingLessonPlan.parameters?.sow?.learningStandard?.main ||
            "",
          component:
            regeneratingLessonPlan.parameters?.sow?.learningStandard?.comp ||
            "",
        },
        learningOutline: {
          pre:
            regeneratingLessonPlan.parameters?.sow?.learningOutline?.pre || "",
          during:
            regeneratingLessonPlan.parameters?.sow?.learningOutline?.during ||
            "",
          post:
            regeneratingLessonPlan.parameters?.sow?.learningOutline?.post || "",
        },
        assessmentTitle: `${regeneratingLessonPlan.title} - Assessment (Regenerated)`,
        assessmentDescription:
          regeneratingLessonPlan.plan?.learningObjective || "",
      };

      // Use the new form data for regeneration
      const activityFormData = {
        activityType: regenerateModalType,
        ...formData,
        configuredFor: regenerateModalType,
      };

      console.log("Regenerating assessment with data:", {
        lessonPlanData,
        activityFormData,
        existingAssessmentId: existingAssessment._id,
      });

      // Call the regeneration API endpoint
      const response = await assessmentAPI.regenerateAssessment(
        existingAssessment._id,
        {
          lessonPlanData,
          activityFormData,
        }
      );

      if (response.success) {
        message.success("Assessment regenerated successfully!");

        // Close modal and reset states
        handleCloseRegenerateModal();

        // Refresh the lesson plans list
        await loadLessonBasedData();

        // Navigate to view the regenerated assessment
        if (response.data?._id) {
          setTimeout(() => {
            navigate(`/app/assessment/${response.data._id}`);
          }, 1000);
        }
      } else {
        throw new Error(response.message || "Failed to regenerate assessment");
      }
    } catch (error) {
      console.error("Error regenerating assessment:", error);
      message.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to regenerate assessment"
      );
    } finally {
      setGeneratingAssessment(null);
    }
  };

  // NEW: Close regenerate modal and reset states
  const handleCloseRegenerateModal = () => {
    setRegenerateModalOpen(false);
    setRegenerateModalType(null);
    setRegeneratingLessonPlan(null);
    setExistingAssessment(null);
  };

  const generateNewAssessment = async (record) => {
    try {
      // Use the activity configuration from the lesson plan
      const activityConfig = record.parameters?.activityConfiguration;

      // Prepare lesson plan data
      const lessonPlanData = {
        lessonPlanId: record._id,
        classId: record.classId?._id || record.classId,
        lesson: record.title,
        subject:
          record.classId?.subject || record.parameters?.subject || "English",
        theme: record.parameters?.sow?.theme || record.parameters?.theme,
        topic: record.parameters?.specificTopic || record.title,
        grade: record.parameters?.grade || record.classId?.grade,
        contentStandard: {
          main: record.parameters?.sow?.contentStandard?.main || "",
          component: record.parameters?.sow?.contentStandard?.comp || "",
        },
        learningStandard: {
          main: record.parameters?.sow?.learningStandard?.main || "",
          component: record.parameters?.sow?.learningStandard?.comp || "",
        },
        learningOutline: {
          pre: record.parameters?.sow?.learningOutline?.pre || "",
          during: record.parameters?.sow?.learningOutline?.during || "",
          post: record.parameters?.sow?.learningOutline?.post || "",
        },
        assessmentTitle: `${record.title} - Assessment`,
        assessmentDescription: record.plan?.learningObjective || "",
      };

      // Use the saved activity configuration instead of opening modal
      const activityFormData = {
        activityType: activityConfig.type,
        ...activityConfig.parameters,
        configuredFor: activityConfig.configuredFor,
      };

      console.log("Generating assessment with saved configuration:", {
        lessonPlanData,
        activityFormData,
      });

      // Call the API to generate assessment
      const response = await assessmentAPI.generateFromLessonPlan(
        lessonPlanData,
        activityFormData
      );

      if (response.success) {
        message.success("Assessment generated successfully!");

        // Refresh the lesson plans list to show updated status
        await loadLessonBasedData();

        // Navigate to view the generated assessment
        if (response.data?._id) {
          setTimeout(() => {
            navigate(`/app/assessment/${response.data._id}`);
          }, 1000);
        }
      } else {
        throw new Error(response.message || "Failed to generate assessment");
      }
    } catch (error) {
      console.error("Error generating assessment:", error);
      throw error;
    }
  };

  // Handle create assessment button click - only for standalone assessments
  const handleCreateStandaloneAssessment = () => {
    message.info("Standalone assessment creation coming soon!");
  };

  // Enhanced view activity handler with better error handling
  const handleViewActivity = (record) => {
    if (
      record.assessmentStatus === "generated" &&
      record.assessments?.length > 0
    ) {
      // Find the first assessment with activity
      const assessmentWithActivity = record.assessments.find(
        (a) =>
          a.hasActivity ||
          a.generatedContent?.activityHTML ||
          a.generatedContent?.assessmentHTML
      );

      if (assessmentWithActivity) {
        navigate(`/app/assessment/${assessmentWithActivity._id}`);
      } else {
        message.warning("No activity content available for this assessment");
      }
    } else {
      message.warning("No assessment activity available for this lesson plan");
    }
  };

  // Enhanced view rubric handler
  const handleViewRubric = (record) => {
    if (
      record.assessmentStatus === "generated" &&
      record.assessments?.length > 0
    ) {
      // Find the first assessment with rubric/answer key
      const assessmentWithRubric = record.assessments.find(
        (a) =>
          a.hasRubric ||
          a.generatedContent?.rubricHTML ||
          a.generatedContent?.answerKeyHTML
      );

      if (assessmentWithRubric) {
        navigate(
          `/app/assessment/${assessmentWithRubric._id}/${assessmentWithRubric._id}`
        );
      } else {
        message.warning("No rubric/answer key available for this assessment");
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
            {record.parameters?.activityConfiguration && (
              <Tag color="cyan">Configured</Tag>
            )}
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
      width: 150,
      render: (_, record) => {
        // Enhanced content checking
        const hasStudentContent = record.assessments?.some(
          (a) =>
            a.hasActivity ||
            a.generatedContent?.activityHTML ||
            a.generatedContent?.assessmentHTML
        );
        const hasTeacherContent = record.assessments?.some(
          (a) =>
            a.hasRubric ||
            a.generatedContent?.rubricHTML ||
            a.generatedContent?.answerKeyHTML
        );

        return (
          <Space>
            {hasStudentContent && (
              <Tag
                color="blue"
                style={{ cursor: "pointer" }}
                onClick={() => handleViewActivity(record)}
              >
                Activity
              </Tag>
            )}
            {hasTeacherContent && (
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
        );
      },
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      render: (date) => new Date(date).toLocaleDateString("en-GB"),
    },
    {
      title: "Actions",
      key: "actions",
      width: 220,
      render: (_, record) => {
        // Enhanced action button logic
        const hasStudentContent = record.assessments?.some(
          (a) =>
            a.hasActivity ||
            a.generatedContent?.activityHTML ||
            a.generatedContent?.assessmentHTML
        );
        const hasTeacherContent = record.assessments?.some(
          (a) =>
            a.hasRubric ||
            a.generatedContent?.rubricHTML ||
            a.generatedContent?.answerKeyHTML
        );

        const isGenerating = generatingAssessment === record._id;
        const hasActivityConfig = record.parameters?.activityConfiguration;
        const hasAssessments = record.assessmentStatus === "generated";

        return (
          <Space>
            {/* Generate/Regenerate Assessment Button */}
            {!hasAssessments ? (
              // Generate button for lesson plans without assessments
              <Button
                type="primary"
                icon={<ThunderboltOutlined />}
                size="small"
                loading={isGenerating}
                onClick={() => handleGenerateAssessment(record)}
                disabled={!hasActivityConfig || isGenerating}
                title={
                  !hasActivityConfig
                    ? "Activity configuration required"
                    : "Generate assessment"
                }
              >
                {isGenerating ? "Generating..." : "Generate"}
              </Button>
            ) : (
              // Regenerate button for lesson plans with assessments
              <Button
                type="default"
                icon={<RedoOutlined />}
                size="small"
                loading={isGenerating}
                onClick={() => handleRegenerateAssessment(record)}
                disabled={!hasActivityConfig || isGenerating}
                title="Regenerate assessment with new settings"
                style={{ borderColor: "#fa8c16", color: "#fa8c16" }}
              >
                {isGenerating ? "Regenerating..." : "Regenerate"}
              </Button>
            )}

            {hasStudentContent && (
              <Button
                type="text"
                icon={<EyeOutlined />}
                size="small"
                onClick={() => handleViewActivity(record)}
                title="View Activity"
              />
            )}
            {hasTeacherContent && (
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
        );
      },
    },
  ];

  // Filter options for classes
  const classOptions = classes.map((cls) => (
    <Option key={cls._id} value={cls._id}>
      {cls.className} - {cls.grade}
    </Option>
  ));

  // NEW: Render the appropriate regeneration modal
  const renderRegenerateModal = () => {
    if (
      !regenerateModalOpen ||
      !regenerateModalType ||
      !regeneratingLessonPlan
    ) {
      return null;
    }

    const commonProps = {
      isOpen: regenerateModalOpen,
      onClose: handleCloseRegenerateModal,
      onSubmit: handleRegenerateModalSubmit,
      selectedLessonPlan: regeneratingLessonPlan,
      activityType: regenerateModalType,
      existingConfiguration:
        regeneratingLessonPlan.parameters?.activityConfiguration?.parameters,
      isRegenerateMode: true,
      existingAssessment: existingAssessment,
    };

    switch (regenerateModalType) {
      case "assessment":
        return <AssessmentLessonModal {...commonProps} />;
      case "essay":
        return <EssayLessonModal {...commonProps} />;
      case "textbook":
        return <TextbookLessonModal {...commonProps} />;
      case "activity":
        return <ActivityInClassLessonModal {...commonProps} />;
      default:
        return <ActivityInClassLessonModal {...commonProps} />;
    }
  };

  // Define tab items for the new Tabs API
  const tabItems = [
    {
      key: "lesson-based",
      label: (
        <span>
          <BookOutlined />
          From Lesson Plans
        </span>
      ),
      children: (
        <div className="tab-content">
          <div className="filters-section">
            <div className="filters-row">
              <Search
                placeholder="Search lesson plans..."
                allowClear
                style={{ width: 300 }}
                prefix={<SearchOutlined />}
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
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
      ),
    },
    {
      key: "standalone",
      label: (
        <span>
          <BulbOutlined />
          Standalone Assessment
        </span>
      ),
      children: (
        <div className="tab-content">
          {/* Create Assessment Button - Only for standalone assessments */}
          <div style={{ marginBottom: "24px", textAlign: "right" }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={handleCreateStandaloneAssessment}
              className="create-btn"
            >
              Create Standalone Assessment
            </Button>
          </div>

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
      ),
    },
  ];

  return (
    <div className="assessment-page">
      <div className="page-header">
        <div className="header-content">
          <div className="header-info">
            <h2>
              <FileTextOutlined /> Assessment Management
            </h2>
            <p>
              Generate assessments from lesson plans or create standalone
              assessments
            </p>
          </div>
        </div>
      </div>

      <Card className="main-content-card">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          className="assessment-tabs"
          items={tabItems}
        />
      </Card>

      {renderRegenerateModal()}
    </div>
  );
};

export default AssessmentPage;
