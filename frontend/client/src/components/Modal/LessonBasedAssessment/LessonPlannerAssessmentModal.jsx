// Fixed LessonPlannerAssessmentModal.jsx - Map activity types correctly
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  Select,
  Button,
  Input,
  Row,
  Col,
  Typography,
  Tag,
  Spin,
  Alert,
  message,
} from "antd";
import {
  FileTextOutlined,
  BookOutlined,
  TeamOutlined,
  LoadingOutlined,
} from "@ant-design/icons";

// FIXED: Import the correct class service
import { getAllClasses } from "../../../services/classService";
import { assessmentAPI } from "../../../services/assessmentService";
import { useUser } from "../../../context/UserContext";

// Import the dynamic assessment forms
import AssessmentLesson from "./AssessmentLessonModal";
import EssayLesson from "./EssayLessonModal";
import TextbookLesson from "./TextbookLessonModal";
import ActivityInClassLesson from "./ActivityInClassLessonModal";

import "./ModalStyles.css";

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

// FIXED: Activity type mapping to ensure valid enum values
const ACTIVITY_TYPE_MAPPING = {
  activityInClass: "activity",
  "activity-in-class": "activity",
  activity: "activity",
  essay: "essay",
  textbook: "textbook",
  assessment: "assessment",
};

const LessonPlannerAssessmentModal = ({ isOpen, onClose, onSubmit }) => {
  const { userId } = useUser(); // Get userId from context
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedLessonPlan, setSelectedLessonPlan] = useState(null);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Data states
  const [classes, setClasses] = useState([]);
  const [lessonPlans, setLessonPlans] = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [lessonPlansLoading, setLessonPlansLoading] = useState(false);

  // Assessment details
  const [assessmentTitle, setAssessmentTitle] = useState("");
  const [assessmentDescription, setAssessmentDescription] = useState("");

  // Load data when modal opens
  useEffect(() => {
    if (isOpen && userId) {
      loadInitialData();
    }
  }, [isOpen, userId]);

  const loadInitialData = async () => {
    await Promise.all([fetchClasses(), fetchAvailableLessonPlans()]);
  };

  // FIXED: Use the existing classService instead of manual fetch
  const fetchClasses = async () => {
    setClassesLoading(true);
    try {
      // Add timeout to catch hanging requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("API call timeout after 10 seconds")),
          10000
        );
      });

      const apiCallPromise = getAllClasses();

      // Race between API call and timeout
      const classesData = await Promise.race([apiCallPromise, timeoutPromise]);
      const finalClasses = Array.isArray(classesData) ? classesData : [];
      setClasses(finalClasses);
    } catch (error) {
      if (error.message.includes("timeout")) {
        message.error(
          "Request timed out. Please check your network connection."
        );
      } else {
        message.error(`Failed to fetch classes: ${error.message}`);
      }
      setClasses([]);
    } finally {
      setClassesLoading(false);
    }
  };

  // FIXED: Fetch only lesson plans that don't have assessments yet
  const fetchAvailableLessonPlans = async () => {
    setLessonPlansLoading(true);
    try {
      // Use the backend endpoint that specifically gets lesson plans without assessments
      const response = await assessmentAPI.getLessonPlansWithoutAssessments();

      if (response && response.success) {
        setLessonPlans(Array.isArray(response.data) ? response.data : []);
      } else {
        setLessonPlans([]);
      }
    } catch (error) {
      console.error("Error fetching available lesson plans:", error);
      message.error("Failed to fetch available lesson plans");
      setLessonPlans([]);
    } finally {
      setLessonPlansLoading(false);
    }
  };

  const handleClassChange = (classId) => {
    setSelectedClass(classId);
    setSelectedLessonPlan(null);
    setShowActivityForm(false);
  };

  const handleLessonPlanChange = (lessonPlanId) => {
    const lessonPlan = lessonPlans.find((plan) => plan._id === lessonPlanId);
    setSelectedLessonPlan(lessonPlan);
    setShowActivityForm(false);

    // Auto-fill assessment title
    if (lessonPlan && !assessmentTitle) {
      const autoTitle = `${
        lessonPlan.parameters?.specificTopic || "Assessment"
      } - ${lessonPlan.parameters?.grade || "Form 4"}`;
      setAssessmentTitle(autoTitle);
    }
  };

  const handleProceedToForm = () => {
    if (!selectedLessonPlan) {
      message.warning("Please select a lesson plan first");
      return;
    }
    setShowActivityForm(true);
  };

  const handleActivityFormSubmit = async (activityData) => {
    setIsGenerating(true);

    try {
      // Prepare the lesson plan data for the backend
      const lessonPlanData = {
        lessonPlanId: selectedLessonPlan._id,
        classId: selectedClass || selectedLessonPlan.classId?._id,
        lesson: selectedLessonPlan.parameters?.specificTopic || "Lesson",
        subject:
          getSelectedClassDetails()?.subject ||
          selectedLessonPlan.classId?.subject ||
          "English",
        theme: selectedLessonPlan.parameters?.sow?.theme || "General",
        topic: selectedLessonPlan.parameters?.specificTopic || "Topic",
        grade: selectedLessonPlan.parameters?.grade || "Form 4",
        contentStandard: {
          main: selectedLessonPlan.parameters?.sow?.contentStandard?.main || "",
          component:
            selectedLessonPlan.parameters?.sow?.contentStandard?.comp || "",
        },
        learningStandard: {
          main:
            selectedLessonPlan.parameters?.sow?.learningStandard?.main || "",
          component:
            selectedLessonPlan.parameters?.sow?.learningStandard?.comp || "",
        },
        learningOutline: {
          pre: selectedLessonPlan.parameters?.sow?.learningOutline?.pre || "",
          during:
            selectedLessonPlan.parameters?.sow?.learningOutline?.during || "",
          post: selectedLessonPlan.parameters?.sow?.learningOutline?.post || "",
        },
        assessmentTitle:
          assessmentTitle ||
          `Assessment - ${selectedLessonPlan.parameters?.specificTopic}`,
        assessmentDescription:
          assessmentDescription ||
          selectedLessonPlan.plan?.learningObjective ||
          "",
      };

      // FIXED: Map activity type to valid enum value
      const originalActivityType =
        selectedLessonPlan.parameters?.activityType || "activity";
      const mappedActivityType =
        ACTIVITY_TYPE_MAPPING[originalActivityType] || "activity";

      console.log("Activity type mapping:", {
        original: originalActivityType,
        mapped: mappedActivityType,
      });

      // Add activity type metadata with proper mapping
      const activityFormData = {
        ...activityData,
        activityType: mappedActivityType, // Use mapped activity type
      };

      console.log("Generating assessment with data:", {
        lessonPlanData,
        activityFormData,
      });

      // Use the wrapper function that generates and saves
      const response = await assessmentAPI.generateFromLessonPlan(
        lessonPlanData,
        activityFormData
      );

      if (response.success) {
        message.success("Assessment generated and saved successfully!");

        // Call parent callback with the response data
        if (onSubmit) {
          onSubmit({
            ...response,
            lessonPlan: selectedLessonPlan,
            class: getSelectedClassDetails(),
          });
        }

        handleReset();
        onClose();
      } else {
        throw new Error(response.message || "Failed to generate assessment");
      }
    } catch (error) {
      console.error("Error generating assessment:", error);
      message.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to generate assessment. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setSelectedClass(null);
    setSelectedLessonPlan(null);
    setShowActivityForm(false);
    setAssessmentTitle("");
    setAssessmentDescription("");
  };

  const handleClose = () => {
    if (!isGenerating) {
      handleReset();
      onClose();
    }
  };

  const getSelectedClassDetails = () => {
    return classes.find((cls) => cls._id === selectedClass);
  };

  const formatLessonPlanOption = (plan) => {
    const topic = plan.parameters?.specificTopic || "No Topic";
    const grade = plan.parameters?.grade || "Unknown Grade";
    const date = plan.lessonDate
      ? new Date(plan.lessonDate).toLocaleDateString()
      : "No Date";

    // FIXED: Map activity type for display
    const originalActivityType = plan.parameters?.activityType || "assessment";
    const mappedActivityType =
      ACTIVITY_TYPE_MAPPING[originalActivityType] || "activity";

    return {
      label: topic,
      details: `${grade} | ${date}`,
      hots: plan.parameters?.hotsFocus || null,
      proficiency: plan.parameters?.proficiencyLevel || null,
      activityType: mappedActivityType,
    };
  };

  const renderLessonPlanOptions = () => {
    const plansToShow = selectedClass
      ? lessonPlans.filter((plan) => {
          // Handle both populated and non-populated classId
          const planClassId =
            typeof plan.classId === "object" ? plan.classId._id : plan.classId;
          return planClassId === selectedClass;
        })
      : lessonPlans;

    if (plansToShow.length === 0) {
      return [];
    }

    return plansToShow.map((plan) => {
      const formatted = formatLessonPlanOption(plan);
      return (
        <Option key={plan._id} value={plan._id}>
          <div>
            <div style={{ fontWeight: 500 }}>{formatted.label}</div>
            <div style={{ fontSize: "12px", color: "#8c8c8c" }}>
              {formatted.details}
              {formatted.hots && ` • ${formatted.hots}`}
              <Tag size="small" color="blue" style={{ marginLeft: 8 }}>
                {formatted.activityType}
              </Tag>
            </div>
          </div>
        </Option>
      );
    });
  };

  const availablePlans = selectedClass
    ? lessonPlans.filter((plan) => {
        const planClassId =
          typeof plan.classId === "object" ? plan.classId._id : plan.classId;
        return planClassId === selectedClass;
      })
    : lessonPlans;

  // Render the appropriate activity form based on the selected lesson plan's activity type
  const renderActivityForm = () => {
    if (!selectedLessonPlan || !showActivityForm) return null;

    // FIXED: Map activity type correctly
    const originalActivityType =
      selectedLessonPlan.parameters?.activityType || "assessment";
    const mappedActivityType =
      ACTIVITY_TYPE_MAPPING[originalActivityType] || "activity";

    const commonProps = {
      isOpen: true,
      onClose: () => setShowActivityForm(false),
      onSubmit: handleActivityFormSubmit,
      selectedLessonPlan: selectedLessonPlan,
      activityType: mappedActivityType, // Use mapped type
      isLoading: isGenerating,
    };

    // FIXED: Switch based on mapped activity type
    switch (mappedActivityType) {
      case "assessment":
        return <AssessmentLesson {...commonProps} />;
      case "essay":
        return <EssayLesson {...commonProps} />;
      case "textbook":
        return <TextbookLesson {...commonProps} />;
      case "activity":
        return <ActivityInClassLesson {...commonProps} />;
      default:
        return <AssessmentLesson {...commonProps} />;
    }
  };

  if (!isOpen) return null;

  // If activity form is shown, render it instead of the main modal
  if (showActivityForm) {
    return renderActivityForm();
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "900px" }}
      >
        {/* Standardized Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-icon">
              <FileTextOutlined />
            </div>
            <h3 className="modal-title">Assessment from Lesson Planner</h3>
          </div>
          <button
            className="modal-close"
            onClick={handleClose}
            disabled={isGenerating}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <Alert
            message="Create Assessment Based on Lesson Plan"
            description="Select an existing lesson plan to generate a targeted assessment that aligns with your teaching objectives and learning outcomes."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Row gutter={[16, 24]}>
            {/* Class Selection */}
            <Col span={24}>
              <Card
                size="small"
                title={
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <TeamOutlined style={{ color: "#1890ff" }} />
                    <span>Select Class (Optional)</span>
                  </div>
                }
                className="selection-card"
              >
                <Spin spinning={classesLoading}>
                  <Select
                    placeholder="Choose a class to filter lessons"
                    value={selectedClass}
                    onChange={handleClassChange}
                    size="large"
                    style={{ width: "100%" }}
                    loading={classesLoading}
                    allowClear
                    disabled={isGenerating}
                  >
                    {classes.map((classItem) => (
                      <Option key={classItem._id} value={classItem._id}>
                        {classItem.className} - {classItem.grade}{" "}
                        {classItem.subject}
                      </Option>
                    ))}
                  </Select>
                </Spin>

                {selectedClass && getSelectedClassDetails() && (
                  <div className="selected-preview">
                    <Text strong>Selected Class:</Text>
                    <div className="preview-content">
                      <Tag color="blue">
                        {getSelectedClassDetails().className}
                      </Tag>
                      <Text type="secondary">
                        {getSelectedClassDetails().grade} •{" "}
                        {getSelectedClassDetails().subject} •{" "}
                        {getSelectedClassDetails().year}
                      </Text>
                    </div>
                  </div>
                )}

                {/* FIXED: Enhanced debug info for classes */}
                {classesLoading && (
                  <div style={{ textAlign: "center", padding: "10px" }}>
                    <Text type="secondary">Loading classes...</Text>
                  </div>
                )}

                {!classesLoading && classes.length === 0 && (
                  <div
                    style={{
                      marginTop: "10px",
                      padding: "10px",
                      background: "#fff7e6",
                      borderRadius: "4px",
                    }}
                  >
                    <Text type="warning">
                      No classes found. Please create a class first in{" "}
                      <strong>Class Management</strong>.
                    </Text>
                  </div>
                )}

                {/* FIXED: Add debug information */}
                {process.env.NODE_ENV === "development" && (
                  <div
                    style={{
                      marginTop: "10px",
                      fontSize: "12px",
                      color: "#999",
                    }}
                  >
                    Debug: Found {classes.length} classes | User ID: {userId}
                  </div>
                )}
              </Card>
            </Col>

            {/* Lesson Plan Selection */}
            <Col span={24}>
              <Card
                size="small"
                title={
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <BookOutlined style={{ color: "#52c41a" }} />
                    <span>Select Lesson Plan</span>
                  </div>
                }
                className="selection-card"
              >
                <Spin spinning={lessonPlansLoading}>
                  <Select
                    placeholder="Choose a lesson plan to base assessment on"
                    value={selectedLessonPlan?._id}
                    onChange={handleLessonPlanChange}
                    size="large"
                    style={{ width: "100%" }}
                    loading={lessonPlansLoading}
                    showSearch
                    disabled={isGenerating}
                    filterOption={(input, option) =>
                      option.children.props.children[0].props.children
                        .toLowerCase()
                        .indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {renderLessonPlanOptions()}
                  </Select>
                </Spin>

                {selectedLessonPlan && (
                  <div className="selected-preview">
                    <Text strong>Selected Lesson:</Text>
                    <div className="preview-content">
                      <div className="lesson-preview">
                        <div className="lesson-title">
                          {selectedLessonPlan.parameters?.specificTopic ||
                            "Lesson Plan"}
                        </div>
                        <div className="lesson-meta">
                          <Tag color="green">
                            {selectedLessonPlan.parameters?.grade}
                          </Tag>
                          {selectedLessonPlan.parameters?.hotsFocus && (
                            <Tag color="purple">
                              {selectedLessonPlan.parameters.hotsFocus.toUpperCase()}
                            </Tag>
                          )}
                          {selectedLessonPlan.parameters?.proficiencyLevel && (
                            <Tag color="orange">
                              {selectedLessonPlan.parameters.proficiencyLevel}
                            </Tag>
                          )}
                          <Tag color="cyan">
                            {/* FIXED: Display mapped activity type */}
                            {(
                              ACTIVITY_TYPE_MAPPING[
                                selectedLessonPlan.parameters?.activityType
                              ] || "activity"
                            ).toUpperCase()}{" "}
                            Activity
                          </Tag>
                        </div>
                        <Text type="secondary" className="lesson-objective">
                          {selectedLessonPlan.plan?.learningObjective}
                        </Text>
                      </div>
                    </div>
                  </div>
                )}

                {availablePlans.length === 0 && !lessonPlansLoading && (
                  <div className="empty-state">
                    <Text type="secondary">
                      {selectedClass
                        ? "No lesson plans available for assessment creation in this class. All lesson plans may already have assessments."
                        : "No lesson plans available for assessment creation. Either create some lesson plans first, or all existing lesson plans already have assessments."}
                    </Text>
                  </div>
                )}
              </Card>
            </Col>

            {/* Assessment Details */}
            {selectedLessonPlan && (
              <Col span={24}>
                <Card
                  size="small"
                  title="Assessment Details"
                  className="selection-card"
                >
                  <Row gutter={[16, 16]}>
                    <Col span={24}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          fontWeight: 500,
                        }}
                      >
                        Assessment Title
                      </label>
                      <Input
                        placeholder="Enter assessment title"
                        value={assessmentTitle}
                        onChange={(e) => setAssessmentTitle(e.target.value)}
                        size="large"
                        disabled={isGenerating}
                      />
                    </Col>
                    <Col span={24}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          fontWeight: 500,
                        }}
                      >
                        Description (Optional)
                      </label>
                      <TextArea
                        rows={3}
                        placeholder="Enter assessment description..."
                        value={assessmentDescription}
                        onChange={(e) =>
                          setAssessmentDescription(e.target.value)
                        }
                        disabled={isGenerating}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>
            )}
          </Row>
        </div>

        {/* Standardized Footer */}
        <div className="modal-footer">
          <div className="modal-footer-left">
            <button
              className="btn-reset"
              onClick={handleReset}
              disabled={isGenerating}
            >
              Reset All
            </button>
          </div>
          <div className="modal-footer-right">
            <button
              className="btn-cancel"
              onClick={handleClose}
              disabled={isGenerating}
            >
              Cancel
            </button>
            <button
              className={`btn-submit ${!selectedLessonPlan ? "disabled" : ""} ${
                isGenerating ? "loading" : ""
              }`}
              onClick={handleProceedToForm}
              disabled={!selectedLessonPlan || isGenerating}
            >
              {isGenerating ? (
                <>
                  <LoadingOutlined /> Generating...
                </>
              ) : selectedLessonPlan ? (
                `📝 Create ${
                  (
                    ACTIVITY_TYPE_MAPPING[
                      selectedLessonPlan.parameters?.activityType
                    ] || "activity"
                  )
                    .charAt(0)
                    .toUpperCase() +
                  (
                    ACTIVITY_TYPE_MAPPING[
                      selectedLessonPlan.parameters?.activityType
                    ] || "activity"
                  ).slice(1)
                } Assessment`
              ) : (
                "📝 Proceed to Assessment"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonPlannerAssessmentModal;
