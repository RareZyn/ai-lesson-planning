// Fixed ActivityInClassLessonModal.jsx - Change activityType to "activity"
import React, { useState } from "react";
import {
  Card,
  Radio,
  Button,
  Input,
  Row,
  Col,
  Typography,
  Tag,
  Space,
  Tooltip,
  Select,
  Divider,
  message,
  Alert,
} from "antd";
import {
  ThunderboltOutlined,
  TeamOutlined,
  BookOutlined,
  BulbOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import {
  classroomActivityTypes,
  studentArrangementOptions,
  resourceOptions,
  timeDurationOptions,
} from "../../../data/activityTypesInClass";
import "./ModalStyles.css";

const { TextArea } = Input;
const { Text } = Typography;
const { Option } = Select;

const ActivityInClassLesson = ({
  isOpen,
  onClose,
  onSubmit,
  selectedLessonPlan,
  activityType = "activity", // FIXED: Changed from "activityInClass" to "activity"
}) => {
  const [formData, setFormData] = useState({
    studentArrangement: "small_group",
    resourceUsage: "classroom_only",
    activityType: "", // This is for specific activity type selection
    duration: "",
    additionalRequirement: "",
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.studentArrangement || !formData.resourceUsage) {
      message.warning("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        selectedLessonPlan,
        activityType: "activity", // FIXED: Always send "activity" as the main type
      };
      await onSubmit(submitData);
      message.success("Activity settings submitted successfully!");
      onClose();
    } catch (error) {
      console.error("Submit error:", error);
      message.error("Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      studentArrangement: "small_group",
      resourceUsage: "classroom_only",
      activityType: "",
      duration: "",
      additionalRequirement: "",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "800px" }}
      >
        {/* Standardized Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-icon">
              <ThunderboltOutlined />
            </div>
            <h3 className="modal-title">Activity in Class</h3>
          </div>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Selected Lesson Plan Info */}
          {selectedLessonPlan && (
            <Alert
              message={`Based on Lesson Plan: ${
                selectedLessonPlan.title || "Selected Lesson"
              }`}
              description={`Generate classroom activity for: ${
                selectedLessonPlan.class || "Class"
              } | ${selectedLessonPlan.grade || "Grade"}`}
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}

          <Row gutter={[16, 24]}>
            {/* Student Arrangement */}
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
                    <span>Student Arrangement</span>
                  </div>
                }
              >
                <Radio.Group
                  value={formData.studentArrangement}
                  onChange={(e) =>
                    handleInputChange("studentArrangement", e.target.value)
                  }
                  style={{ width: "100%" }}
                >
                  <Row gutter={[16, 16]}>
                    {studentArrangementOptions.map((option) => (
                      <Col xs={24} sm={12} md={8} key={option.value}>
                        <Radio.Button
                          value={option.value}
                          style={{
                            width: "100%",
                            height: "auto",
                            padding: "12px",
                            textAlign: "left",
                          }}
                        >
                          <div>
                            <div
                              style={{ fontSize: "16px", marginBottom: "4px" }}
                            >
                              {option.icon} {option.label}
                            </div>
                            <Text type="secondary" style={{ fontSize: "12px" }}>
                              {option.description}
                            </Text>
                          </div>
                        </Radio.Button>
                      </Col>
                    ))}
                  </Row>
                </Radio.Group>
              </Card>
            </Col>

            {/* Resource Usage */}
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
                    <span>Resource Usage</span>
                  </div>
                }
              >
                <Radio.Group
                  value={formData.resourceUsage}
                  onChange={(e) =>
                    handleInputChange("resourceUsage", e.target.value)
                  }
                  style={{ width: "100%" }}
                >
                  <Row gutter={[16, 16]}>
                    {resourceOptions.map((option) => (
                      <Col xs={24} sm={12} key={option.value}>
                        <Radio.Button
                          value={option.value}
                          style={{
                            width: "100%",
                            height: "auto",
                            padding: "12px",
                            textAlign: "left",
                          }}
                        >
                          <div>
                            <div
                              style={{ fontSize: "16px", marginBottom: "4px" }}
                            >
                              {option.icon} {option.label}
                            </div>
                            <Text type="secondary" style={{ fontSize: "12px" }}>
                              {option.description}
                            </Text>
                          </div>
                        </Radio.Button>
                      </Col>
                    ))}
                  </Row>
                </Radio.Group>
              </Card>
            </Col>

            {/* Activity Type */}
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
                    <BulbOutlined style={{ color: "#fa8c16" }} />
                    <span>Activity Type (Optional)</span>
                  </div>
                }
              >
                <Select
                  placeholder="Choose a specific activity type"
                  value={formData.activityType}
                  onChange={(value) => handleInputChange("activityType", value)}
                  style={{ width: "100%" }}
                  size="large"
                  showSearch
                  allowClear
                  filterOption={(input, option) =>
                    option.children
                      .toLowerCase()
                      .indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {classroomActivityTypes.map((category) => (
                    <React.Fragment key={category.category}>
                      <Option
                        disabled
                        value={category.category}
                        style={{ fontWeight: "bold", color: "#1890ff" }}
                      >
                        📚 {category.category}
                      </Option>
                      {category.activities.map((activity) => (
                        <Option
                          key={activity}
                          value={activity}
                          style={{ paddingLeft: "20px" }}
                        >
                          {activity}
                        </Option>
                      ))}
                      <Option
                        disabled
                        value={`divider-${category.category}`}
                        style={{ height: "1px", padding: 0 }}
                      >
                        <Divider style={{ margin: 0 }} />
                      </Option>
                    </React.Fragment>
                  ))}
                </Select>
              </Card>
            </Col>

            {/* Duration */}
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
                    <ClockCircleOutlined style={{ color: "#722ed1" }} />
                    <span>Duration (Optional)</span>
                  </div>
                }
              >
                <Select
                  placeholder="Select duration"
                  value={formData.duration}
                  onChange={(value) => handleInputChange("duration", value)}
                  style={{ width: "100%" }}
                  size="large"
                  allowClear
                >
                  {timeDurationOptions.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Card>
            </Col>

            {/* Additional Requirements */}
            <Col span={24}>
              <Card
                size="small"
                title="Additional Requirements & Notes (Optional)"
              >
                <TextArea
                  rows={3}
                  value={formData.additionalRequirement}
                  onChange={(e) =>
                    handleInputChange("additionalRequirement", e.target.value)
                  }
                  placeholder="Enter specific instructions, materials needed, learning objectives, or any special considerations for this activity based on the selected lesson plan..."
                  maxLength={300}
                  showCount
                />
              </Card>
            </Col>

            {/* Summary */}
            <Col span={24}>
              <Card
                size="small"
                title="Activity Summary"
                style={{ background: "#f6ffed", borderColor: "#b7eb8f" }}
              >
                <Row gutter={[16, 8]}>
                  <Col xs={24} sm={12} md={6}>
                    <Text strong style={{ color: "#666" }}>
                      Student Setup:
                    </Text>
                    <br />
                    <Tag color="blue">
                      {formData.studentArrangement.replace("_", " ")}
                    </Tag>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Text strong style={{ color: "#666" }}>
                      Resources:
                    </Text>
                    <br />
                    <Tag color="green">
                      {formData.resourceUsage.replace("_", " ")}
                    </Tag>
                  </Col>
                  {formData.activityType && (
                    <Col xs={24} sm={12} md={6}>
                      <Text strong style={{ color: "#666" }}>
                        Activity:
                      </Text>
                      <br />
                      <Tag color="purple">{formData.activityType}</Tag>
                    </Col>
                  )}
                  {formData.duration && (
                    <Col xs={24} sm={12} md={6}>
                      <Text strong style={{ color: "#666" }}>
                        Duration:
                      </Text>
                      <br />
                      <Tag color="orange">{formData.duration}</Tag>
                    </Col>
                  )}
                  {selectedLessonPlan && (
                    <Col span={24}>
                      <Text strong style={{ color: "#666" }}>
                        Based on Lesson:
                      </Text>
                      <br />
                      <Text>{selectedLessonPlan.title}</Text>
                    </Col>
                  )}
                </Row>
              </Card>
            </Col>
          </Row>
        </div>

        {/* Footer Buttons */}
        <div
          className="modal-footer"
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            marginTop: "20px",
          }}
        >
          <Button onClick={handleReset}>Reset</Button>
          <Button type="primary" loading={loading} onClick={handleSubmit}>
            Submit Activity
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ActivityInClassLesson;
