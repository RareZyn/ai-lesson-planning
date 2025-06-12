import React, { useState, useEffect } from "react";
import {
  Select,
  Card,
  Typography,
  Input,
  Row,
  Col,
  Spin,
  message,
  Divider,
} from "antd";
import { BookOutlined, FormOutlined, BulbOutlined } from "@ant-design/icons";
import textbookService from "../../services/textbookService";
import { englishActivityTypes } from "../../data/activityTypes";
import "./ModalStyles.css";

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const TextBookModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    selectedForm: "",
    selectedTopic: "",
    activityType: "",
    additionalRequirement: "",
  });

  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [topicsLoading, setTopicsLoading] = useState(false);

  const forms = [
    { value: "form1", label: "Form 1" },
    { value: "form2", label: "Form 2" },
    { value: "form3", label: "Form 3" },
    { value: "form4", label: "Form 4" },
    { value: "form5", label: "Form 5" },
  ];

  // Fetch topics when form is selected
  useEffect(() => {
    if (formData.selectedForm) {
      fetchTopics(formData.selectedForm);
    }
  }, [formData.selectedForm]);

  const fetchTopics = async (form) => {
    setTopicsLoading(true);
    try {
      const response = await textbookService.getTopicsByForm(form);
      if (response.success) {
        setTopics(response.topics || []);
      } else {
        message.error("Failed to fetch topics");
        setTopics([]);
      }
    } catch (error) {
      console.error("Error fetching topics:", error);
      message.error("Error loading topics");
      setTopics([]);
    } finally {
      setTopicsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Reset topic when form changes
    if (field === "selectedForm") {
      setFormData((prev) => ({
        ...prev,
        selectedTopic: "",
      }));
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (
      !formData.selectedForm ||
      !formData.selectedTopic ||
      !formData.activityType
    ) {
      message.warning("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      message.success("Textbook activity submitted successfully!");
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
      selectedForm: "",
      selectedTopic: "",
      activityType: "",
      additionalRequirement: "",
    });
    setTopics([]);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "700px" }}
      >
        {/* Standardized Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-icon">
              <BookOutlined />
            </div>
            <h3 className="modal-title">English Textbook Activity</h3>
          </div>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <Row gutter={[16, 24]}>
            {/* Form Selection */}
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
                    <FormOutlined style={{ color: "#1890ff" }} />
                    <span>Select Form</span>
                  </div>
                }
              >
                <Select
                  placeholder="Choose a form (Form 1 - Form 5)"
                  value={formData.selectedForm}
                  onChange={(value) => handleInputChange("selectedForm", value)}
                  style={{ width: "100%" }}
                  size="large"
                >
                  {forms.map((form) => (
                    <Option key={form.value} value={form.value}>
                      {form.label}
                    </Option>
                  ))}
                </Select>
              </Card>
            </Col>

            {/* Topic Selection */}
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
                    <span>Select Topic</span>
                  </div>
                }
              >
                <Spin spinning={topicsLoading}>
                  <Select
                    placeholder={
                      formData.selectedForm
                        ? "Choose a topic from the selected form"
                        : "Please select a form first"
                    }
                    value={formData.selectedTopic}
                    onChange={(value) =>
                      handleInputChange("selectedTopic", value)
                    }
                    style={{ width: "100%" }}
                    size="large"
                    disabled={!formData.selectedForm || topicsLoading}
                    showSearch
                    filterOption={(input, option) =>
                      option.children
                        .toLowerCase()
                        .indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {topics.map((topic, index) => (
                      <Option key={index} value={topic}>
                        {topic}
                      </Option>
                    ))}
                  </Select>
                </Spin>
                {topics.length === 0 &&
                  formData.selectedForm &&
                  !topicsLoading && (
                    <Text
                      type="secondary"
                      style={{
                        fontSize: "12px",
                        display: "block",
                        marginTop: "8px",
                      }}
                    >
                      No topics found for the selected form
                    </Text>
                  )}
              </Card>
            </Col>

            {/* Activity Type Selection */}
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
                    <span>Activity Type</span>
                  </div>
                }
              >
                <Select
                  placeholder="Choose an activity type"
                  value={formData.activityType}
                  onChange={(value) => handleInputChange("activityType", value)}
                  style={{ width: "100%" }}
                  size="large"
                  showSearch
                  filterOption={(input, option) =>
                    option.children
                      .toLowerCase()
                      .indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {englishActivityTypes.map((category) => (
                    <React.Fragment key={category.category}>
                      <Option
                        disabled
                        value={category.category}
                        style={{ fontWeight: "bold", color: "#1890ff" }}
                      >
                        {category.category}
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

            {/* Additional Requirements */}
            <Col span={24}>
              <Card size="small" title="Additional Requirements (Optional)">
                <TextArea
                  rows={3}
                  value={formData.additionalRequirement}
                  onChange={(e) =>
                    handleInputChange("additionalRequirement", e.target.value)
                  }
                  placeholder="Enter any specific requirements, instructions, or notes for this activity..."
                  maxLength={200}
                  showCount
                />
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
              disabled={loading}
            >
              Reset
            </button>
          </div>
          <div className="modal-footer-right">
            <button className="btn-cancel" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button
              className={`btn-submit ${loading ? "loading" : ""}`}
              onClick={handleSubmit}
              disabled={
                !formData.selectedForm ||
                !formData.selectedTopic ||
                !formData.activityType ||
                loading
              }
            >
              {loading ? "⏳ Submitting..." : "📚 Submit Activity"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextBookModal;
