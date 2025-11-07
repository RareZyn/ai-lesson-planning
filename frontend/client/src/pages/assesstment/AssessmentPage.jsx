//src/pages/assessment/AssessmentPage.jsx 
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
  CalculatorOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

// Import services
import { getAllLessonPlans } from "../../services/lessonService";
import { getAllClasses } from "../../services/classService";
import { assessmentAPI } from "../../services/assessmentService";
import { useUser } from "../../context/UserContext";

// Import modals for lesson-based assessments
import ActivityInClassLessonModal from "../../components/Modal/LessonBasedAssessment/ActivityInClassLessonModal";
import EssayLessonModal from "../../components/Modal/LessonBasedAssessment/EssayLessonModal";
import AssessmentLessonModal from "../../components/Modal/LessonBasedAssessment/AssessmentLessonModal";
import TextbookLessonModal from "../../components/Modal/LessonBasedAssessment/TextbookLessonModal";
import SPMExamLessonModal from "../../components/Modal/LessonBasedAssessment/SPMExamLessonModal";

// Import modals for standalone assessments
import StandAloneAssessmentModal from "../../components/Modal/StandaloneAssessment/StandAloneAssessmentModal";
import ActivityInClassStandaloneModal from "../../components/Modal/StandaloneAssessment/ActivityInClassStandaloneModal";
import AssessmentStandaloneModal from "../../components/Modal/StandaloneAssessment/AssessmentStandaloneModal";
import EssayStandaloneModal from "../../components/Modal/StandaloneAssessment/EssayStandaloneModal";
import TextbookStandaloneModal from "../../components/Modal/StandaloneAssessment/TextbookStandaloneModal";
import SPMExamStandaloneModal from "../../components/Modal/StandaloneAssessment/SPMExamStandaloneModal";

import "./AssessmentPage.css";

const { Search } = Input;
const { Option } = Select;

// FIXED: Activity types with proper SPM exam configuration
const activityTypes = [
  {
    key: "activityInClass",
    title: "Activity in Class",
    description: "Interactive classroom activities and group work",
    icon: (
      <ThunderboltOutlined style={{ fontSize: "32px", color: "#1890ff" }} />
    ),
    color: "#1890ff",
  },
  {
    key: "assessment",
    title: "Assessment (Exam)",
    description: "Formal assessments, tests, and examinations",
    icon: <FileTextOutlined style={{ fontSize: "32px", color: "#52c41a" }} />,
    color: "#52c41a",
  },
  {
    key: "essay",
    title: "Essay Writing",
    description: "Essay prompts and writing assignments",
    icon: <EditOutlined style={{ fontSize: "32px", color: "#fa8c16" }} />,
    color: "#fa8c16",
  },
  {
    key: "textbook",
    title: "Textbook Exercise",
    description: "Textbook-based activities and exercises",
    icon: <BookOutlined style={{ fontSize: "32px", color: "#722ed1" }} />,
    color: "#722ed1",
  },
  {
    key: "spm-exam",
    title: "SPM Examination",
    description: "Malaysian SPM English Paper 1 & 2 examinations",
    icon: <CalculatorOutlined style={{ fontSize: "32px", color: "#eb2f96" }} />,
    color: "#eb2f96",
  },
];

const AssessmentPage = () => {
  const navigate = useNavigate();
  const { userId } = useUser();

  const [activeTab, setActiveTab] = useState("lesson-based");
  const [loading, setLoading] = useState(false);
  const [generatingAssessment, setGeneratingAssessment] = useState(null);

  // Modal states for regeneration (lesson-based)
  const [regenerateModalOpen, setRegenerateModalOpen] = useState(false);
  const [regenerateModalType, setRegenerateModalType] = useState(null);
  const [regeneratingLessonPlan, setRegeneratingLessonPlan] = useState(null);
  const [existingAssessment, setExistingAssessment] = useState(null);

  // Modal states for standalone assessments
  const [standaloneModalOpen, setStandaloneModalOpen] = useState(false);
  const [standaloneActivityModalOpen, setStandaloneActivityModalOpen] =
    useState(false);
  const [standaloneActivityType, setStandaloneActivityType] = useState(null);
  const [standaloneAssessmentData, setStandaloneAssessmentData] =
    useState(null);

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

  // FIXED: Helper functions for activity type handling with SPM exam support
  const getActivityTypeDisplay = (activityType) => {
    const displayMap = {
      activityInClass: "Activity",
      activity: "Activity",
      assessment: "Assessment",
      essay: "Essay",
      textbook: "Textbook",
      "spm-exam": "SPM Exam",
    };
    return displayMap[activityType] || activityType?.toUpperCase() || "Unknown";
  };

  const getActivityTypeColor = (activityType) => {
    const colorMap = {
      activityInClass: "blue",
      activity: "blue",
      assessment: "green",
      essay: "orange",
      textbook: "purple",
      "spm-exam": "magenta", // Handle legacy typo
      "spm-exam": "magenta",
    };
    return colorMap[activityType] || "default";
  };

  // FIXED: Enhanced content checking function for SPM exams
  const hasStudentContent = (record) => {
    if (record.assessments?.length > 0) {
      return record.assessments.some((assessment) => {
        const content = assessment.generatedContent || {};
        return !!(
          (
            assessment.hasActivity ||
            content.activityHTML ||
            content.assessmentHTML ||
            content.examHTML
          ) // CRITICAL: Check for SPM exam HTML
        );
      });
    }
    return false;
  };

  const hasTeacherContent = (record) => {
    if (record.assessments?.length > 0) {
      return record.assessments.some((assessment) => {
        const content = assessment.generatedContent || {};
        return !!(
          assessment.hasRubric ||
          content.rubricHTML ||
          content.answerKeyHTML
        );
      });
    }
    return false;
  };

  // FIXED: Enhanced view activity handler with SPM exam support
  const handleViewActivity = (record) => {
    if (
      record.assessmentStatus === "generated" &&
      record.assessments?.length > 0
    ) {
      // Find the first assessment with activity content (including SPM exams)
      const assessmentWithActivity = record.assessments.find((assessment) => {
        const content = assessment.generatedContent || {};
        return !!(
          (
            assessment.hasActivity ||
            content.activityHTML ||
            content.assessmentHTML ||
            content.examHTML
          ) // CRITICAL: Include SPM exam content
        );
      });

      if (assessmentWithActivity) {
        console.log("🎯 Navigating to assessment:", {
          assessmentId: assessmentWithActivity._id,
          activityType: assessmentWithActivity.activityType,
          hasActivity: assessmentWithActivity.hasActivity,
          contentStatus: {
            activityHTML:
              !!assessmentWithActivity.generatedContent?.activityHTML,
            assessmentHTML:
              !!assessmentWithActivity.generatedContent?.assessmentHTML,
            examHTML: !!assessmentWithActivity.generatedContent?.examHTML,
          },
        });
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
      const assessmentWithRubric = record.assessments.find((assessment) => {
        const content = assessment.generatedContent || {};
        return !!(
          assessment.hasRubric ||
          content.rubricHTML ||
          content.answerKeyHTML
        );
      });

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

  const loadLessonBasedData = async () => {
    try {
      setLoading(true);

      // Get all lesson plans for the user
      const allLessonPlans = await getAllLessonPlans();

      // Get all assessments that have lesson plans
      const assessmentResponse = await assessmentAPI.getUserAssessments({
        ...filters,
        hasLessonPlan: "true",
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

      // Transform lesson plans with correct assessment status logic
      let lessonPlanRows = allLessonPlans.map((lessonPlan) => {
        const assessments = lessonPlanAssessmentMap[lessonPlan._id] || [];
        const hasAssessments = assessments.length > 0;

        // Determine assessment status correctly
        const assessmentStatus = hasAssessments ? "generated" : "not_generated";

        const row = {
          ...lessonPlan,
          assessmentStatus: assessmentStatus,
          assessments: assessments,
          hasActivity: hasStudentContent({ assessments }),
          hasRubric: hasTeacherContent({ assessments }),
          title: lessonPlan.parameters?.specificTopic || "Untitled Lesson",
          description: lessonPlan.plan?.learningObjective || "",
          activityType: lessonPlan.parameters?.activityType || "lesson",
          createdAt: lessonPlan.createdAt,
          updatedAt: lessonPlan.updatedAt,
          status: hasAssessments ? "Generated" : "Not Generated",
        };

        return row;
      });

      // Apply filters correctly
      let filteredRows = [...lessonPlanRows];

      // Search filter
      if (filters.search) {
        filteredRows = filteredRows.filter(
          (row) =>
            row.title.toLowerCase().includes(filters.search.toLowerCase()) ||
            row.description.toLowerCase().includes(filters.search.toLowerCase())
        );
      }

      // Class filter
      if (filters.classId) {
        filteredRows = filteredRows.filter(
          (row) =>
            row.classId?._id === filters.classId ||
            row.classId === filters.classId
        );
      }

      // Status filter
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
      console.error("Error loading standalone assessments:", error);
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

  // Handle regenerate assessment button click
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

  // Handle modal submission for regeneration
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
        assessmentTitle: `${regeneratingLessonPlan.title} (Regenerated)`,
        assessmentDescription:
          regeneratingLessonPlan.plan?.learningObjective || "",
      };

      // Use the new form data for regeneration
      const activityFormData = {
        activityType: regenerateModalType,
        ...formData,
        configuredFor: regenerateModalType,
      };

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

  // Close regenerate modal and reset states
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
        assessmentTitle: `${record.title}`,
        assessmentDescription: record.plan?.learningObjective || "",
      };

      // Use the saved activity configuration instead of opening modal
      const activityFormData = {
        activityType: activityConfig.type,
        ...activityConfig.parameters,
        configuredFor: activityConfig.configuredFor,
      };

      console.log("🚀 Generating assessment with:", {
        activityType: activityConfig.type,
        lessonPlanId: record._id,
        hasConfiguration: !!activityConfig,
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
          console.log(
            "✅ Assessment generated, navigating to:",
            response.data._id
          );
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

  const handleCreateStandaloneAssessment = () => {
    setStandaloneModalOpen(true);
  };

  const handleStandaloneActivitySelect = (activityType, assessmentData) => {
    console.log("🎯 Activity selected:", { activityType, assessmentData });

    setStandaloneActivityType(activityType);
    setStandaloneAssessmentData(assessmentData);
    setStandaloneModalOpen(false);
    setStandaloneActivityModalOpen(true);
  };

  // FIXED: Handle standalone activity submission with proper activity type mapping
  const handleStandaloneActivitySubmit = async (formData) => {
    try {
      setLoading(true);
      console.log("📝 Submitting standalone activity:", {
        formData,
        standaloneAssessmentData,
        activityType: standaloneActivityType,
      });

      let mappedActivityType = standaloneActivityType;

      // Prepare the data for standalone assessment creation
      const standaloneData = {
        ...standaloneAssessmentData,
        ...formData,
        activityType: mappedActivityType, // Use mapped type
        isStandalone: true,
        assessmentTitle: `${
          standaloneAssessmentData.subject
        } ${getActivityTypeDisplay(mappedActivityType)} - ${
          standaloneAssessmentData.grade
        }`,
        assessmentDescription:
          formData.additionalRequirement ||
          `Standalone ${getActivityTypeDisplay(mappedActivityType)} assessment`,
      };

      console.log("🔄 Calling API with:", standaloneData);

      // Call the standalone assessment API
      const response = await assessmentAPI.createStandaloneAssessment(
        standaloneData
      );

      if (response.success) {
        message.success("Standalone assessment created successfully!");

        // Close modal and reset states
        handleCloseStandaloneModals();

        // Refresh the standalone assessments list
        if (activeTab === "standalone") {
          await loadStandaloneAssessments();
        }

        // Navigate to view the created assessment
        if (response.data?._id) {
          console.log(
            "✅ Standalone assessment created, navigating to:",
            response.data._id
          );
          setTimeout(() => {
            navigate(`/app/assessment/${response.data._id}`);
          }, 1000);
        }
      } else {
        throw new Error(
          response.message || "Failed to create standalone assessment"
        );
      }
    } catch (error) {
      console.error("❌ Error creating standalone assessment:", error);
      message.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to create standalone assessment"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCloseStandaloneModals = () => {
    console.log("🔒 Closing standalone modals");
    setStandaloneModalOpen(false);
    setStandaloneActivityModalOpen(false);
    setStandaloneActivityType(null);
    setStandaloneAssessmentData(null);
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

  // FIXED: Lesson-based columns with enhanced SPM exam content checking
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
            <Tag
              color={getActivityTypeColor(record.activityType)}
              data-activity={record.activityType}
            >
              {getActivityTypeDisplay(record.activityType)}
            </Tag>
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
        const hasStudentContentFlag = hasStudentContent(record);
        const hasTeacherContentFlag = hasTeacherContent(record);

        return (
          <Space>
            {hasStudentContentFlag && (
              <Tag
                color="blue"
                style={{ cursor: "pointer" }}
                onClick={() => handleViewActivity(record)}
              >
                {record.activityType === "spm-exam" ? "Exam" : "Activity"}
              </Tag>
            )}
            {hasTeacherContentFlag && (
              <Tag
                color="green"
                style={{ cursor: "pointer" }}
                onClick={() => handleViewRubric(record)}
              >
                {record.activityType === "spm-exam" ? "Answer Key" : "Rubric"}
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
        const hasStudentContentFlag = hasStudentContent(record);
        const hasTeacherContentFlag = hasTeacherContent(record);

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

            {hasStudentContentFlag && (
              <Button
                type="text"
                icon={<EyeOutlined />}
                size="small"
                onClick={() => handleViewActivity(record)}
                title={`View ${
                  record.activityType === "spm-exam" ? "Exam" : "Activity"
                }`}
              />
            )}
            {hasTeacherContentFlag && (
              <Button
                type="text"
                icon={<FileExclamationOutlined />}
                size="small"
                onClick={() => handleViewRubric(record)}
                title={`View ${
                  record.activityType === "spm-exam" ? "Answer Key" : "Rubric"
                }`}
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

  // Standalone assessments columns
  const standaloneColumns = [
    {
      title: "Assessment",
      key: "assessment",
      width: 250,
      render: (_, record) => (
        <div>
          <div className="assessment-title">{record.title}</div>
          <div className="assessment-description">{record.description}</div>
          <div className="assessment-meta">
            <Tag
              color={getActivityTypeColor(record.activityType)}
              data-activity={record.activityType}
            >
              {getActivityTypeDisplay(record.activityType)}
            </Tag>
            <Tag color="green">{record.grade}</Tag>
            <Tag color="purple">{record.subject}</Tag>
            <Tag color="orange">Standalone</Tag>
          </div>
        </div>
      ),
    },
    {
      title: "Class Info",
      key: "classInfo",
      width: 150,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.className || "General"}</div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            {record.grade} • {record.subject}
          </div>
        </div>
      ),
    },
    {
      title: "Content Available",
      key: "content",
      width: 150,
      render: (_, record) => (
        <Space>
          {record.hasActivity && (
            <Tag
              color="blue"
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/app/assessment/${record._id}`)}
            >
              {record.activityType === "spm-exam" ? "Exam" : "Activity"}
            </Tag>
          )}
          {record.hasRubric && (
            <Tag
              color="green"
              style={{ cursor: "pointer" }}
              onClick={() =>
                navigate(`/app/assessment/${record._id}/${record._id}`)
              }
            >
              {record.activityType === "spm-exam" ? "Answer Key" : "Rubric"}
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
      render: (date) => new Date(date).toLocaleDateString("en-GB"),
    },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => navigate(`/app/assessment/${record._id}`)}
            title="View Assessment"
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            onClick={() => message.info("Edit functionality coming soon")}
            title="Edit Assessment"
          />
          <Button
            type="text"
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => {
              Modal.confirm({
                title: "Delete Assessment",
                content: `Are you sure you want to delete "${record.title}"?`,
                onOk: async () => {
                  try {
                    await assessmentAPI.deleteAssessment(record._id);
                    message.success("Assessment deleted successfully");
                    loadStandaloneAssessments();
                  } catch (error) {
                    message.error("Failed to delete assessment");
                  }
                },
              });
            }}
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

  // Render the appropriate regeneration modal with SPM exam support
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
      case "activityInClass":
        return <ActivityInClassLessonModal {...commonProps} />;
      case "spm-exam":
        return <SPMExamLessonModal {...commonProps} />;
      default:
        return <ActivityInClassLessonModal {...commonProps} />;
    }
  };

  // Render standalone activity modal with SPM exam support
  const renderStandaloneActivityModal = () => {
    console.log("🎭 Rendering standalone activity modal:", {
      isOpen: standaloneActivityModalOpen,
      activityType: standaloneActivityType,
      hasAssessmentData: !!standaloneAssessmentData,
    });

    if (!standaloneActivityModalOpen || !standaloneActivityType) {
      return null;
    }

    const commonProps = {
      isOpen: standaloneActivityModalOpen,
      onClose: handleCloseStandaloneModals,
      onSubmit: handleStandaloneActivitySubmit,
      assessmentData: standaloneAssessmentData,
    };

    console.log("🔧 Modal props:", commonProps);

    switch (standaloneActivityType) {
      case "activity":
      case "activityInClass":
        return <ActivityInClassStandaloneModal {...commonProps} />;
      case "assessment":
        return <AssessmentStandaloneModal {...commonProps} />;
      case "essay":
        return <EssayStandaloneModal {...commonProps} />;
      case "textbook":
        return <TextbookStandaloneModal {...commonProps} />;
      case "spm-exam":
        return <SPMExamStandaloneModal {...commonProps} />;
      default:
        console.warn("⚠️ Unknown activity type:", standaloneActivityType);
        return <ActivityInClassStandaloneModal {...commonProps} />;
    }
  };

  // Define tab items with enhanced activity type filtering
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
              <Select
                placeholder="Filter by activity type"
                style={{ width: 200 }}
                allowClear
                value={filters.activityType}
                onChange={(value) => handleFilterChange("activityType", value)}
              >
                <Option value="activity">Activity in Class</Option>
                <Option value="assessment">Assessment</Option>
                <Option value="essay">Essay</Option>
                <Option value="textbook">Textbook</Option>
                <Option value="spm-exam">SPM Exam</Option>
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

          <div className="filters-section">
            <div className="filters-row">
              <Search
                placeholder="Search standalone assessments..."
                allowClear
                style={{ width: 300 }}
                prefix={<SearchOutlined />}
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
              <Select
                placeholder="Filter by activity type"
                style={{ width: 200 }}
                allowClear
                value={filters.activityType}
                onChange={(value) => handleFilterChange("activityType", value)}
              >
                <Option value="activity">Activity in Class</Option>
                <Option value="assessment">Assessment</Option>
                <Option value="essay">Essay</Option>
                <Option value="textbook">Textbook</Option>
                <Option value="spm-exam">SPM Exam</Option>
              </Select>
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
              columns={standaloneColumns}
              dataSource={assessments}
              rowKey="_id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `Total ${total} standalone assessments`,
              }}
              className="assessment-table"
              locale={{
                emptyText: (
                  <div style={{ textAlign: "center", padding: "60px 20px" }}>
                    <BulbOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />
                    <h3 style={{ color: "#666", marginTop: 16 }}>
                      No Standalone Assessments
                    </h3>
                    <p style={{ color: "#999" }}>
                      Create your first standalone assessment to get started
                    </p>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleCreateStandaloneAssessment}
                      style={{ marginTop: 16 }}
                    >
                      Create Assessment
                    </Button>
                  </div>
                ),
              }}
            />
          </Spin>
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
              assessments including SPM examinations
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

      {/* Regeneration Modal for Lesson-based assessments with SPM support */}
      {renderRegenerateModal()}

      {/* Standalone Assessment Modals with SPM support */}
      <StandAloneAssessmentModal
        isOpen={standaloneModalOpen}
        onClose={handleCloseStandaloneModals}
        onActivitySelect={handleStandaloneActivitySelect}
      />

      {/* Standalone Activity Modal with SPM support */}
      {renderStandaloneActivityModal()}
    </div>
  );
};

export default AssessmentPage;
