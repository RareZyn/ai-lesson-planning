// src/components/Modal/AssessmentCreative/LessonPlannerAssessmentModal.jsx - Updated with dynamic forms
import React, { useState } from "react";
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
} from "@ant-design/icons";

// Import the dynamic assessment form
import AssessmentLesson from "../AssessmentLessonPlanner/AssessmentLeson";
import EssayLesson from "../AssessmentLessonPlanner/EssayLesson";
import TextbookLesson from "../AssessmentLessonPlanner/TextbookLesson";
import ActivityInClassLesson from "../AssessmentLessonPlanner/ActivityInClassLesson";

import "./ModalStyles.css";

const { Option } = Select;
const { Text } = Typography;

const LessonPlannerAssessmentModal = ({
  isOpen,
  onClose,
  onSubmit,
  currentUserId,
}) => {
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedLessonPlan, setSelectedLessonPlan] = useState(null);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [lessonPlansLoading, setLessonPlansLoading] = useState(false);

  // Dummy lesson plans data with activity types
  const lessonPlans = [
    {
      id: "684da7f4b96de6d12b6b124e",
      title: "Making our school community safer",
      class: "5 Anggerik",
      grade: "Form 5",
      subject: "English",
      theme: "People and Culture",
      topic: "It's Personal!",
      focus: "evaluate",
      proficiencyLevel: "B1 Mid",
      activityType: "assessment", // This determines which form to show
      learningObjective:
        "Students will be able to evaluate the effectiveness of different safety measures in creating a safer school community.",
      date: "2025-06-08",
    },
    {
      id: "684da7f4b96de6d12b6b125f",
      title: "An informal email to a friend about a celebrity I admire",
      class: "5 UM",
      grade: "Form 5",
      subject: "English",
      theme: "People and Culture",
      topic: "It's Personal!",
      focus: "create",
      proficiencyLevel: "B1 High",
      activityType: "essay", // Essay type
      learningObjective:
        "By the end of the lesson, students will be able to write a multi-paragraph informal email, using appropriate structure, tone, and descriptive language to express admiration for a famous person.",
      date: "2025-06-10",
    },
    {
      id: "684da7f4b96de6d12b6b126g",
      title: "Understanding different text types and their purposes",
      class: "Biruni",
      grade: "Form 5",
      subject: "English",
      theme: "Science and Technology",
      topic: "Tomorrow's World",
      focus: "understand",
      proficiencyLevel: "B1 Low",
      activityType: "textbook", // Textbook type
      learningObjective:
        "Students will be able to identify different text types and understand their specific purposes and language features.",
      date: "2025-06-15",
    },
    {
      id: "684da7f4b96de6d12b6b127h",
      title: "Group discussion about cultural diversity",
      class: "5 UTHM",
      grade: "Form 5",
      subject: "English",
      theme: "People and Culture",
      topic: "Celebrating Differences",
      focus: "apply",
      proficiencyLevel: "B1 Mid",
      activityType: "activity", // Activity type
      learningObjective:
        "Students will be able to engage in meaningful discussions about cultural diversity and express their opinions respectfully.",
      date: "2025-06-12",
    },
  ];

  // Dummy classes data
  const classes = [
    {
      _id: "684ae8e1f20a7dd141136657",
      className: "Biruni",
      grade: "Form 5",
      subject: "English",
      year: "2025",
    },
    {
      _id: "684af0958396c2624a5350d9",
      className: "5 UTHM",
      grade: "Form 5",
      subject: "English",
      year: "2025",
    },
    {
      _id: "684af4608396c2624a535137",
      className: "5 UM",
      grade: "Form 5",
      subject: "English",
      year: "2025",
    },
  ];

  const handleClassChange = (classId) => {
    setSelectedClass(classId);
    setSelectedLessonPlan(null);
    setShowActivityForm(false);
  };

  const handleLessonPlanChange = (lessonPlanId) => {
    const lessonPlan = lessonPlans.find((plan) => plan.id === lessonPlanId);
    setSelectedLessonPlan(lessonPlan);
    setShowActivityForm(false);
  };

  const handleProceedToForm = () => {
    if (!selectedLessonPlan) {
      message.warning("Please select a lesson plan first");
      return;
    }
    setShowActivityForm(true);
  };

  const handleActivityFormSubmit = (data) => {
    console.log("Activity form data:", data);
    onSubmit(data);
    handleReset();
  };

  const handleReset = () => {
    setSelectedClass(null);
    setSelectedLessonPlan(null);
    setShowActivityForm(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const getSelectedClassDetails = () => {
    return classes.find((cls) => cls._id === selectedClass);
  };

  const formatLessonPlanOption = (plan) => {
    const topic = plan.title || "No Topic";
    const grade = plan.grade || "Unknown Grade";
    const date = plan.date || "No Date";

    return {
      label: topic,
      details: `${grade} | ${date}`,
      hots: plan.focus || null,
      proficiency: plan.proficiencyLevel || null,
      activityType: plan.activityType || "assessment",
    };
  };

  const renderLessonPlanOptions = () => {
    const plansToShow = selectedClass
      ? lessonPlans.filter(
          (plan) => plan.class === getSelectedClassDetails()?.className
        )
      : lessonPlans;

    return plansToShow.map((plan) => {
      const formatted = formatLessonPlanOption(plan);
      return (
        <Option key={plan.id} value={plan.id}>
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
    ? lessonPlans.filter(
        (plan) => plan.class === getSelectedClassDetails()?.className
      )
    : lessonPlans;

  // Render the appropriate activity form based on the selected lesson plan's activity type
  const renderActivityForm = () => {
    if (!selectedLessonPlan || !showActivityForm) return null;

    const { activityType } = selectedLessonPlan;

    switch (activityType) {
      case "assessment":
        return (
          <AssessmentLesson
            isOpen={true}
            onClose={() => setShowActivityForm(false)}
            onSubmit={handleActivityFormSubmit}
            selectedLessonPlan={selectedLessonPlan}
            activityType="assessment"
          />
        );
      case "essay":
        return (
          <EssayLesson
            isOpen={true}
            onClose={() => setShowActivityForm(false)}
            onSubmit={handleActivityFormSubmit}
            selectedLessonPlan={selectedLessonPlan}
            activityType="essay"
          />
        );
      case "textbook":
        return (
          <TextbookLesson
            isOpen={true}
            onClose={() => setShowActivityForm(false)}
            onSubmit={handleActivityFormSubmit}
            selectedLessonPlan={selectedLessonPlan}
            activityType="textbook"
          />
        );
      case "activity":
        return (
          <ActivityInClassLesson
            isOpen={true}
            onClose={() => setShowActivityForm(false)}
            onSubmit={handleActivityFormSubmit}
            selectedLessonPlan={selectedLessonPlan}
            activityType="activity"
          />
        );
      default:
        return (
          <AssessmentLesson
            isOpen={true}
            onClose={() => setShowActivityForm(false)}
            onSubmit={handleActivityFormSubmit}
            selectedLessonPlan={selectedLessonPlan}
            activityType="assessment"
          />
        );
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
          <button className="modal-close" onClick={handleClose}>
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
                <Select
                  placeholder="Choose a class to filter lessons"
                  value={selectedClass}
                  onChange={handleClassChange}
                  size="large"
                  style={{ width: "100%" }}
                  allowClear
                >
                  {classes.map((classItem) => (
                    <Option key={classItem._id} value={classItem._id}>
                      {classItem.className} - {classItem.grade}{" "}
                      {classItem.subject}
                    </Option>
                  ))}
                </Select>

                {selectedClass && getSelectedClassDetails() && (
                  <div
                    style={{
                      marginTop: "12px",
                      padding: "8px",
                      background: "#f6ffed",
                      borderRadius: "6px",
                    }}
                  >
                    <Text strong>Selected Class:</Text>
                    <div style={{ marginTop: "4px" }}>
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
                    value={selectedLessonPlan?.id}
                    onChange={handleLessonPlanChange}
                    size="large"
                    style={{ width: "100%" }}
                    loading={lessonPlansLoading}
                    showSearch
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
                  <div
                    style={{
                      marginTop: "16px",
                      padding: "16px",
                      background: "#f6ffed",
                      borderRadius: "8px",
                      border: "1px solid #b7eb8f",
                    }}
                  >
                    <Text strong style={{ color: "#52c41a" }}>
                      Selected Lesson Plan:
                    </Text>
                    <div style={{ marginTop: "8px" }}>
                      <div style={{ fontWeight: 600, marginBottom: "8px" }}>
                        {selectedLessonPlan.title}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          marginBottom: "8px",
                        }}
                      >
                        <Tag color="blue">{selectedLessonPlan.class}</Tag>
                        <Tag color="green">{selectedLessonPlan.grade}</Tag>
                        <Tag color="purple">
                          {selectedLessonPlan.focus?.toUpperCase()}
                        </Tag>
                        <Tag color="orange">
                          {selectedLessonPlan.proficiencyLevel}
                        </Tag>
                        <Tag color="cyan">
                          {selectedLessonPlan.activityType?.toUpperCase()}{" "}
                          Activity
                        </Tag>
                      </div>
                      <div style={{ color: "#666", fontSize: "13px" }}>
                        <strong>Theme:</strong> {selectedLessonPlan.theme} |{" "}
                        <strong>Topic:</strong> {selectedLessonPlan.topic}
                      </div>
                      <div
                        style={{
                          color: "#666",
                          fontSize: "13px",
                          marginTop: "8px",
                          padding: "8px",
                          background: "white",
                          borderRadius: "4px",
                          border: "1px solid #d9d9d9",
                        }}
                      >
                        <strong>Learning Objective:</strong>{" "}
                        {selectedLessonPlan.learningObjective}
                      </div>
                    </div>
                  </div>
                )}

                {availablePlans.length === 0 && !lessonPlansLoading && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "20px",
                      color: "#666",
                      background: "#fafafa",
                      borderRadius: "6px",
                      border: "1px dashed #d9d9d9",
                      marginTop: "12px",
                    }}
                  >
                    <Text type="secondary">
                      {selectedClass
                        ? "No lesson plans found for this class."
                        : "No lesson plans available. Create some lesson plans first."}
                    </Text>
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </div>

        {/* Standardized Footer */}
        <div className="modal-footer">
          <div className="modal-footer-left">
            <button
              className="btn-reset"
              onClick={handleReset}
              disabled={lessonPlansLoading}
            >
              Reset All
            </button>
          </div>
          <div className="modal-footer-right">
            <button
              className="btn-cancel"
              onClick={handleClose}
              disabled={lessonPlansLoading}
            >
              Cancel
            </button>
            <button
              className={`btn-submit ${!selectedLessonPlan ? "disabled" : ""}`}
              onClick={handleProceedToForm}
              disabled={!selectedLessonPlan || lessonPlansLoading}
            >
              {selectedLessonPlan
                ? `📝 Create ${
                    selectedLessonPlan.activityType?.charAt(0).toUpperCase() +
                    selectedLessonPlan.activityType?.slice(1)
                  } Assessment`
                : "📝 Proceed to Assessment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonPlannerAssessmentModal;
