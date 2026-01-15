// src/components/Modal/StandaloneAssessment/StandAloneAssessmentModal.jsx
import React, { useState, useEffect } from "react";
import {
  Modal,
  Card,
  Select,
  Button,
  Row,
  Col,
  Typography,
  Alert,
  Spin,
  message,
} from "antd";
import {
  BookOutlined,
  TeamOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  EditOutlined,
  BulbOutlined,
  CalculatorOutlined,
} from "@ant-design/icons";
import { getAllClasses } from "../../../services/classService";
import "./ModalStyles.css";

const { Option } = Select;
const { Text, Title } = Typography;

const StandAloneAssessmentModal = ({ isOpen, onClose, onActivitySelect }) => {
  const [formData, setFormData] = useState({
    classId: "",
    subject: "",
  });

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showActivityOptions, setShowActivityOptions] = useState(false);

  // Subject options
  const subjectOptions = [
    { value: "english", label: "English" },
  ];

  // Activity type options
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
      description: "Collaborative group activities and group projects",
      icon: (
        <CalculatorOutlined style={{ fontSize: "32px", color: "#eb2f96" }} />
      ),
      color: "#eb2f96",
    },
  ];

  useEffect(() => {
    if (isOpen) {
      loadClasses();
      resetForm();
    }
  }, [isOpen]);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const classesData = await getAllClasses();
      setClasses(Array.isArray(classesData) ? classesData : []);
    } catch (error) {
      message.error("Failed to load classes");
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      classId: "",
      subject: "",
    });
    setShowActivityOptions(false);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Auto-populate subject and grade if class is selected
    if (field === "classId" && value) {
      const selectedClass = classes.find((cls) => cls._id === value);
      if (selectedClass && selectedClass.subject) {
        setFormData((prev) => ({
          ...prev,
          subject: selectedClass.subject.toLowerCase().replace(/\s+/g, "_"),
        }));
      }
    }
  };

  const handleProceed = () => {
    // FIXED: Only require subject, not grade
    if (!formData.subject) {
      message.warning("Please select a subject");
      return;
    }
    setShowActivityOptions(true);
  };

  const handleActivitySelect = (activityType) => {
    const selectedClass = classes.find((cls) => cls._id === formData.classId);

    // FIXED: Create assessment data with class info, derive grade from selected class
    const assessmentData = {
      classId: formData.classId,
      className: selectedClass?.className || "",
      grade: selectedClass?.grade || "General", // Use class grade or "General"
      subject: formData.subject,
      activityType: activityType,
      isStandalone: true,
    };

    console.log("🚀 Calling onActivitySelect with:", {
      activityType,
      assessmentData,
    });

    // FIXED: Call the parent callback
    onActivitySelect(activityType, assessmentData);
  };

  const handleBack = () => {
    setShowActivityOptions(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getSelectedClass = () => {
    return classes.find((cls) => cls._id === formData.classId);
  };

  const getSubjectLabel = () => {
    const subject = subjectOptions.find((s) => s.value === formData.subject);
    return subject ? subject.label : formData.subject;
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <BulbOutlined style={{ color: "#1890ff" }} />
          <span>Create Standalone Assessment</span>
        </div>
      }
      open={isOpen}
      onCancel={handleClose}
      footer={null}
      width={900}
      destroyOnClose
      className="creative-options-modal"
    >
      {!showActivityOptions ? (
        // Step 1: Class and Subject Selection (REMOVED GRADE)
        <div>
          <Alert
            message="Setup Assessment Parameters"
            description="Select the class and subject for your standalone assessment. This will help generate targeted content for your students."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Spin spinning={loading}>
            <Row gutter={[24, 24]}>
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
                      <TeamOutlined style={{ color: "#52c41a" }} />
                      <span>Select Class (Optional)</span>
                    </div>
                  }
                  style={{ borderRadius: "8px" }}
                >
                  <Select
                    placeholder="Choose a specific class or leave empty for general assessment"
                    value={formData.classId}
                    onChange={(value) => handleInputChange("classId", value)}
                    style={{ width: "100%" }}
                    size="large"
                    allowClear
                  >
                    {classes.map((classItem) => (
                      <Option key={classItem._id} value={classItem._id}>
                        {classItem.className} - {classItem.grade} (
                        {classItem.subject})
                      </Option>
                    ))}
                  </Select>

                  {formData.classId && getSelectedClass() && (
                    <div
                      style={{
                        marginTop: "12px",
                        padding: "12px",
                        background: "#f6ffed",
                        borderRadius: "6px",
                        border: "1px solid #b7eb8f",
                      }}
                    >
                      <Text strong>Selected Class:</Text>
                      <div style={{ marginTop: "4px" }}>
                        <Text>
                          {getSelectedClass().className} -{" "}
                          {getSelectedClass().grade}
                        </Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                          Subject: {getSelectedClass().subject} | Year:{" "}
                          {getSelectedClass().year}
                        </Text>
                      </div>
                    </div>
                  )}
                </Card>
              </Col>

              {/* Subject Selection */}
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
                      <BookOutlined style={{ color: "#fa8c16" }} />
                      <span>Select Subject *</span>
                    </div>
                  }
                  style={{ borderRadius: "8px" }}
                >
                  <Select
                    placeholder="Choose subject"
                    value={formData.subject}
                    onChange={(value) => handleInputChange("subject", value)}
                    style={{ width: "100%" }}
                    size="large"
                    showSearch
                    filterOption={(input, option) =>
                      option.children
                        .toLowerCase()
                        .indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {subjectOptions.map((subject) => (
                      <Option key={subject.value} value={subject.value}>
                        {subject.label}
                      </Option>
                    ))}
                  </Select>
                </Card>
              </Col>
            </Row>

            {/* Summary Card - UPDATED */}
            {formData.subject && (
              <Card
                style={{
                  marginTop: "24px",
                  background: "#f0f8ff",
                  borderColor: "#91d5ff",
                }}
                size="small"
                title="Assessment Summary"
              >
                <Row gutter={[16, 8]}>
                  <Col xs={24} sm={8}>
                    <Text strong style={{ color: "#666" }}>
                      Subject:
                    </Text>
                    <div style={{ color: "#1890ff", fontWeight: 500 }}>
                      {getSubjectLabel()}
                    </div>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Text strong style={{ color: "#666" }}>
                      Grade:
                    </Text>
                    <div style={{ color: "#1890ff", fontWeight: 500 }}>
                      {getSelectedClass()?.grade || "General"}
                    </div>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Text strong style={{ color: "#666" }}>
                      Class:
                    </Text>
                    <div style={{ color: "#1890ff", fontWeight: 500 }}>
                      {formData.classId
                        ? getSelectedClass()?.className
                        : "General"}
                    </div>
                  </Col>
                </Row>
              </Card>
            )}
          </Spin>

          {/* Footer */}
          <div
            style={{
              marginTop: "32px",
              padding: "16px 0",
              borderTop: "1px solid #f0f0f0",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <Button onClick={handleClose} size="large">
              Cancel
            </Button>
            <Button
              type="primary"
              size="large"
              onClick={handleProceed}
              disabled={!formData.subject} // FIXED: Only require subject
            >
              Proceed to Activity Selection
            </Button>
          </div>
        </div>
      ) : (
        // Step 2: Activity Type Selection
        <div>
          <Alert
            message="Choose Activity Type"
            description={`Create a ${getSubjectLabel()} assessment for ${
              getSelectedClass()?.grade || "General"
            }${
              formData.classId ? ` - ${getSelectedClass()?.className}` : ""
            }. Select the type of activity you want to generate.`}
            type="success"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Row gutter={[16, 16]}>
            {activityTypes.map((activity) => (
              <Col xs={24} sm={12} key={activity.key}>
                <Card
                  hoverable
                  className="creative-option-card"
                  onClick={() => {
                    console.log("🎯 Activity card clicked:", activity.key);
                    handleActivitySelect(activity.key);
                  }}
                  style={{
                    height: "180px",
                    border: `2px solid ${activity.color}20`,
                    borderRadius: "12px",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                  bodyStyle={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    height: "100%",
                    padding: "24px 16px",
                  }}
                >
                  <div style={{ marginBottom: "16px" }}>{activity.icon}</div>
                  <Title
                    level={4}
                    style={{
                      margin: "0 0 8px 0",
                      color: activity.color,
                      fontSize: "18px",
                    }}
                  >
                    {activity.title}
                  </Title>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: "13px",
                      lineHeight: "1.4",
                      textAlign: "center",
                    }}
                  >
                    {activity.description}
                  </Text>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Footer */}
          <div
            style={{
              marginTop: "32px",
              padding: "16px 0",
              borderTop: "1px solid #f0f0f0",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <Button onClick={handleBack} size="large">
              ← Back to Setup
            </Button>
            <Button onClick={handleClose} size="large">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default StandAloneAssessmentModal;
