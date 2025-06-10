import React, { useState } from "react";
import {
  Card,
  Radio,
  Checkbox,
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
} from "antd";
import {
  ThunderboltOutlined,
  TeamOutlined,
  BookOutlined,
  BulbOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  SettingOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import {
  bloomTaxonomyLevels,
  classroomActivityTypes,
  studentArrangementOptions,
  resourceOptions,
  timeDurationOptions,
  difficultyLevels,
} from "../../data/activityTypesInClass";
import "./ModalStyles.css";

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Option } = Select;

const ActivityInClassModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    studentArrangement: "small_group",
    resourceUsage: "classroom_only",
    bloomTaxonomy: [],
    activityType: "",
    duration: "",
    difficultyLevel: "",
    additionalRequirement: "",
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBloomTaxonomyToggle = (level) => {
    setFormData((prev) => ({
      ...prev,
      bloomTaxonomy: prev.bloomTaxonomy.includes(level)
        ? prev.bloomTaxonomy.filter((l) => l !== level)
        : [...prev.bloomTaxonomy, level],
    }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.studentArrangement || !formData.resourceUsage) {
      message.warning("Please fill in all required fields");
      return;
    }

    if (formData.bloomTaxonomy.length === 0) {
      message.warning("Please select at least one Bloom Taxonomy level");
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
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
      bloomTaxonomy: [],
      activityType: "",
      duration: "",
      difficultyLevel: "",
      additionalRequirement: "",
    });
  };

  const getBloomTagColor = (level) => {
    const bloomLevel = bloomTaxonomyLevels.find((b) => b.level === level);
    return bloomLevel ? bloomLevel.color : "#1890ff";
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "800px", background: "white" }}
      >
        {/* Header */}
        <div
          className="modal-header"
          style={{ background: "white", borderBottom: "1px solid #f0f0f0" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <ThunderboltOutlined
              style={{ fontSize: "24px", color: "#ff4d4f" }}
            />
            <Title level={3} style={{ margin: 0, color: "#262626" }}>
              Activity in Class
            </Title>
          </div>
          <Button
            type="text"
            onClick={onClose}
            style={{ position: "absolute", right: "16px", top: "16px" }}
          >
            ×
          </Button>
        </div>

        {/* Body */}
        <div
          className="modal-body"
          style={{ background: "white", padding: "24px" }}
        >
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
                style={{ background: "white" }}
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
                            background: "white",
                          }}
                        >
                          <div>
                            <div
                              style={{ fontSize: "18px", marginBottom: "4px" }}
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
                style={{ background: "white" }}
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
                            background: "white",
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
                style={{ background: "white" }}
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

            {/* Duration and Difficulty */}
            <Col span={24}>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
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
                        <span>Duration</span>
                      </div>
                    }
                    style={{ background: "white" }}
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
                          <Text
                            type="secondary"
                            style={{ fontSize: "12px", display: "block" }}
                          >
                            {option.description}
                          </Text>
                        </Option>
                      ))}
                    </Select>
                  </Card>
                </Col>

                <Col xs={24} sm={12}>
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
                        <BarChartOutlined style={{ color: "#eb2f96" }} />
                        <span>Difficulty</span>
                      </div>
                    }
                    style={{ background: "white" }}
                  >
                    <Select
                      placeholder="Select difficulty"
                      value={formData.difficultyLevel}
                      onChange={(value) =>
                        handleInputChange("difficultyLevel", value)
                      }
                      style={{ width: "100%" }}
                      size="large"
                      allowClear
                    >
                      {difficultyLevels.map((level) => (
                        <Option key={level.value} value={level.value}>
                          <Tag
                            color={level.color}
                            style={{ marginRight: "8px" }}
                          >
                            {level.label}
                          </Tag>
                          {level.description}
                        </Option>
                      ))}
                    </Select>
                  </Card>
                </Col>
              </Row>
            </Col>

            {/* Bloom Taxonomy */}
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
                    <SettingOutlined style={{ color: "#13c2c2" }} />
                    <span>Bloom's Taxonomy Levels</span>
                  </div>
                }
                style={{ background: "white" }}
              >
                <Row gutter={[12, 12]}>
                  {bloomTaxonomyLevels.map((bloom) => (
                    <Col xs={12} sm={8} md={6} key={bloom.level}>
                      <Tooltip
                        title={
                          <div>
                            <div>
                              <strong>{bloom.description}</strong>
                            </div>
                            <div style={{ marginTop: "4px" }}>
                              Keywords: {bloom.keywords.join(", ")}
                            </div>
                          </div>
                        }
                      >
                        <div
                          onClick={() => handleBloomTaxonomyToggle(bloom.level)}
                          style={{
                            padding: "12px",
                            border: `2px solid ${
                              formData.bloomTaxonomy.includes(bloom.level)
                                ? bloom.color
                                : "#d9d9d9"
                            }`,
                            borderRadius: "8px",
                            textAlign: "center",
                            cursor: "pointer",
                            backgroundColor: formData.bloomTaxonomy.includes(
                              bloom.level
                            )
                              ? `${bloom.color}15`
                              : "white",
                            transition: "all 0.3s ease",
                            position: "relative",
                          }}
                        >
                          {formData.bloomTaxonomy.includes(bloom.level) && (
                            <CheckCircleOutlined
                              style={{
                                position: "absolute",
                                top: "4px",
                                right: "4px",
                                color: bloom.color,
                              }}
                            />
                          )}
                          <div
                            style={{
                              fontWeight: "600",
                              color: formData.bloomTaxonomy.includes(
                                bloom.level
                              )
                                ? bloom.color
                                : "#666",
                              fontSize: "14px",
                            }}
                          >
                            {bloom.level}
                          </div>
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#999",
                              marginTop: "2px",
                            }}
                          >
                            {bloom.description}
                          </div>
                        </div>
                      </Tooltip>
                    </Col>
                  ))}
                </Row>

                {formData.bloomTaxonomy.length > 0 && (
                  <div style={{ marginTop: "16px" }}>
                    <Text strong>Selected Levels: </Text>
                    <Space wrap>
                      {formData.bloomTaxonomy.map((level) => (
                        <Tag
                          key={level}
                          color={getBloomTagColor(level)}
                          closable
                          onClose={() => handleBloomTaxonomyToggle(level)}
                        >
                          {level}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                )}
              </Card>
            </Col>

            {/* Additional Requirements */}
            <Col span={24}>
              <Card
                size="small"
                title="Additional Requirements & Notes (Optional)"
                style={{ background: "white" }}
              >
                <TextArea
                  rows={3}
                  value={formData.additionalRequirement}
                  onChange={(e) =>
                    handleInputChange("additionalRequirement", e.target.value)
                  }
                  placeholder="Enter specific instructions, materials needed, learning objectives, or any special considerations for this activity..."
                  maxLength={300}
                  showCount
                  style={{ background: "white" }}
                />
              </Card>
            </Col>
          </Row>
        </div>

        {/* Footer */}
        <div
          className="modal-footer"
          style={{
            background: "white",
            borderTop: "1px solid #f0f0f0",
            padding: "16px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Button onClick={handleReset} disabled={loading}>
            Reset All
          </Button>

          <div style={{ display: "flex", gap: "12px" }}>
            <Button onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={loading}
              disabled={formData.bloomTaxonomy.length === 0}
              icon={<CheckCircleOutlined />}
            >
              Create Activity
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityInClassModal;
