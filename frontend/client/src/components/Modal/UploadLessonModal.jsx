// src/components/Modal/UploadLessonModal.jsx - Fixed with direct button handler
import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Select,
  Button,
  message,
  Row,
  Col,
  Card,
  Typography,
  Tag,
  Spin,
  Alert,
  Input,
} from "antd";
import {
  ShareAltOutlined,
  BookOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { getAllClasses } from "../../services/classService";
import { communityAPI } from "../../services/communityService";
import "./UploadLessonModal.css";

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const UploadLessonModal = ({ isOpen, onClose, onSubmit, currentUserId }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [lessonPlans, setLessonPlans] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedLessonPlan, setSelectedLessonPlan] = useState(null);
  const [classesLoading, setClassesLoading] = useState(false);
  const [lessonPlansLoading, setLessonPlansLoading] = useState(false);

  // Load data when modal opens
  useEffect(() => {
    if (isOpen && currentUserId) {
      loadInitialData();
    }
  }, [isOpen, currentUserId]);

  const loadInitialData = async () => {
    await Promise.all([fetchClasses(), fetchUserLessonPlans()]);
  };

  const fetchClasses = async () => {
    setClassesLoading(true);
    try {
      const classesData = await getAllClasses();
      setClasses(Array.isArray(classesData) ? classesData : []);
    } catch (error) {
      console.error("Error fetching classes:", error);
      message.error("Failed to fetch classes");
      setClasses([]);
    } finally {
      setClassesLoading(false);
    }
  };

  const fetchUserLessonPlans = async () => {
    if (!currentUserId) {
      console.error("No currentUserId provided");
      return;
    }

    setLessonPlansLoading(true);
    try {
      console.log("Fetching lesson plans for user:", currentUserId);

      const response = await communityAPI.getUserLessonPlans(currentUserId, {
        shared: "false", // Only get unshared lessons
        page: 1,
        limit: 100,
      });

      console.log("Lesson plans response:", response);

      if (response.success) {
        const plans = response.data || [];
        setLessonPlans(plans);
        console.log("Set lesson plans:", plans);
      } else {
        console.error("API returned success: false", response);
        setLessonPlans([]);
      }
    } catch (error) {
      console.error("Error fetching lesson plans:", error);
      message.error("Failed to fetch lesson plans");
      setLessonPlans([]);
    } finally {
      setLessonPlansLoading(false);
    }
  };

  // Direct button click handler instead of form submission
  const handleShareButtonClick = async () => {
    console.log("Share button clicked!");
    console.log("Current selectedLessonPlan state:", selectedLessonPlan);
    console.log("Current form values:", form.getFieldsValue());

    // Validate form first
    try {
      const values = await form.validateFields();
      console.log("Form validation passed. Values:", values);

      // Use the form value as the source of truth
      const lessonPlanId = values.lessonPlan || selectedLessonPlan;

      if (!lessonPlanId) {
        message.error("Please select a lesson plan to share");
        return;
      }

      if (!currentUserId) {
        message.error("User ID is required to share lesson plans");
        return;
      }

      setLoading(true);

      const shareData = {
        userId: currentUserId,
        title: values.title,
        description: values.description,
        tags: values.tags
          ? values.tags.split(",").map((tag) => tag.trim())
          : [],
      };

      console.log("Sharing lesson plan:", {
        lessonPlanId: lessonPlanId,
        shareData: shareData,
      });

      // Call the backend API directly
      const response = await communityAPI.shareLessonPlan(
        lessonPlanId,
        shareData
      );

      console.log("Share response:", response);

      if (response.success) {
        message.success("Lesson plan shared successfully to the community!");
        handleReset();
        onClose();
        // Call the parent's callback to refresh the data
        if (onSubmit) {
          onSubmit();
        }
      } else {
        message.error(response.message || "Failed to share lesson plan");
      }
    } catch (error) {
      if (error.errorFields) {
        // Form validation error
        console.log("Form validation failed:", error.errorFields);
        message.error("Please fill in all required fields");
      } else {
        // API error
        console.error("Share error:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to share lesson plan";
        message.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    console.log("Resetting form");
    form.resetFields();
    setSelectedClass(null);
    setSelectedLessonPlan(null);
    // Explicitly clear the form values
    form.setFieldsValue({
      class: undefined,
      lessonPlan: undefined,
      title: undefined,
      description: undefined,
      tags: undefined,
    });
  };

  const handleClose = () => {
    if (!loading) {
      handleReset();
      onClose();
    }
  };

  const handleClassChange = (classId) => {
    console.log("Class selected:", classId);
    setSelectedClass(classId);
    setSelectedLessonPlan(null);
    // Clear both the state and the form field
    form.setFieldsValue({
      lessonPlan: undefined,
      class: classId,
    });
  };

  const handleLessonPlanChange = (lessonPlanId) => {
    console.log("Lesson plan selected:", lessonPlanId);
    setSelectedLessonPlan(lessonPlanId);

    // IMPORTANT: Update the form field value
    form.setFieldsValue({ lessonPlan: lessonPlanId });

    // Auto-fill title and description if not already filled
    const selectedPlan = lessonPlans.find((plan) => plan._id === lessonPlanId);
    if (selectedPlan && !form.getFieldValue("title")) {
      const autoTitle = `${
        selectedPlan.parameters?.specificTopic || "Lesson Plan"
      } - ${selectedPlan.parameters?.grade || "Form 4"}`;
      form.setFieldsValue({
        title: autoTitle,
        description: selectedPlan.plan?.learningObjective || "",
        lessonPlan: lessonPlanId, // Make sure this is set
      });
    }
  };

  const getSelectedClassDetails = () => {
    return classes.find((cls) => cls._id === selectedClass);
  };

  const getSelectedLessonPlanDetails = () => {
    return lessonPlans.find((plan) => plan._id === selectedLessonPlan);
  };

  const formatLessonPlanOption = (plan) => {
    const topic = plan.parameters?.specificTopic || "No Topic";
    const grade = plan.parameters?.grade || "Unknown Grade";
    const date = plan.lessonDate
      ? new Date(plan.lessonDate).toLocaleDateString()
      : "No Date";

    return {
      label: `${topic}`,
      details: `${grade} | ${date}`,
      hots: plan.parameters?.hotsFocus || null,
      proficiency: plan.parameters?.proficiencyLevel || null,
    };
  };

  const renderLessonPlanOptions = () => {
    const plansToShow = selectedClass
      ? lessonPlans.filter((plan) => plan.classId?._id === selectedClass)
      : lessonPlans;

    return plansToShow.map((plan) => {
      const formatted = formatLessonPlanOption(plan);
      return (
        <Option key={plan._id} value={plan._id}>
          <div>
            <div style={{ fontWeight: 500 }}>{formatted.label}</div>
            <div style={{ fontSize: "12px", color: "#8c8c8c" }}>
              {formatted.details}
              {formatted.hots && ` • ${formatted.hots}`}
            </div>
          </div>
        </Option>
      );
    });
  };

  const availablePlans = selectedClass
    ? lessonPlans.filter((plan) => plan.classId?._id === selectedClass)
    : lessonPlans;

  return (
    <Modal
      title={
        <div className="modal-title">
          <ShareAltOutlined />
          <span>Share Lesson Plan to Community</span>
        </div>
      }
      open={isOpen}
      onCancel={handleClose}
      footer={null}
      width={900}
      className="upload-lesson-modal"
      destroyOnClose
    >
      <Alert
        message="Share Your Teaching Experience"
        description="Select an existing lesson plan from your collection to share with the teaching community. Help other educators by sharing your successful lessons."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Form
        form={form}
        layout="vertical"
        className="upload-form"
        // Remove onFinish since we're handling the button click directly
      >
        <Row gutter={[24, 16]}>
          {/* Class Selection */}
          <Col span={24}>
            <Card
              size="small"
              title={
                <div className="card-title">
                  <TeamOutlined style={{ color: "#1890ff" }} />
                  <span>Select Class (Optional)</span>
                </div>
              }
              className="selection-card"
            >
              <Form.Item name="class">
                <Spin spinning={classesLoading}>
                  <Select
                    placeholder="Choose a class to filter lessons"
                    value={selectedClass}
                    onChange={handleClassChange}
                    size="large"
                    style={{ width: "100%" }}
                    loading={classesLoading}
                    allowClear
                  >
                    {classes.map((classItem) => (
                      <Option key={classItem._id} value={classItem._id}>
                        {classItem.className} - {classItem.grade}{" "}
                        {classItem.subject}
                      </Option>
                    ))}
                  </Select>
                </Spin>
              </Form.Item>

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
            </Card>
          </Col>

          {/* Lesson Plan Selection */}
          <Col span={24}>
            <Card
              size="small"
              title={
                <div className="card-title">
                  <BookOutlined style={{ color: "#52c41a" }} />
                  <span>Select Lesson Plan</span>
                </div>
              }
              className="selection-card"
            >
              <Form.Item
                name="lessonPlan"
                rules={[
                  { required: true, message: "Please select a lesson plan" },
                ]}
              >
                <Spin spinning={lessonPlansLoading}>
                  <Select
                    placeholder="Choose a lesson plan to share"
                    value={selectedLessonPlan} // Keep the controlled component behavior
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
              </Form.Item>

              {selectedLessonPlan && getSelectedLessonPlanDetails() && (
                <div className="selected-preview">
                  <Text strong>Selected Lesson:</Text>
                  <div className="preview-content">
                    <div className="lesson-preview">
                      <div className="lesson-title">
                        {getSelectedLessonPlanDetails().parameters
                          ?.specificTopic || "Lesson Plan"}
                      </div>
                      <div className="lesson-meta">
                        <Tag color="green">
                          {getSelectedLessonPlanDetails().parameters?.grade}
                        </Tag>
                        {getSelectedLessonPlanDetails().parameters
                          ?.hotsFocus && (
                          <Tag color="purple">
                            {getSelectedLessonPlanDetails().parameters.hotsFocus.toUpperCase()}
                          </Tag>
                        )}
                        {getSelectedLessonPlanDetails().parameters
                          ?.proficiencyLevel && (
                          <Tag color="orange">
                            {
                              getSelectedLessonPlanDetails().parameters
                                .proficiencyLevel
                            }
                          </Tag>
                        )}
                      </div>
                      <Text type="secondary" className="lesson-objective">
                        {getSelectedLessonPlanDetails().plan?.learningObjective}
                      </Text>
                    </div>
                  </div>
                </div>
              )}

              {availablePlans.length === 0 && !lessonPlansLoading && (
                <div className="empty-state">
                  <Text type="secondary">
                    {selectedClass
                      ? "No unshared lesson plans found for this class."
                      : "No unshared lesson plans found. Create some lesson plans first, or all your plans may already be shared."}
                  </Text>
                  {!selectedClass && (
                    <div style={{ marginTop: "8px" }}>
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        Only lesson plans that haven't been shared to the
                        community yet will appear here.
                      </Text>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </Col>
        </Row>

        {/* Sharing Details */}
        <Row gutter={[24, 16]} style={{ marginTop: "24px" }}>
          <Col span={24}>
            <Card
              size="small"
              title="Sharing Details"
              className="selection-card"
            >
              {/* Title */}
              <Form.Item
                name="title"
                label="Community Title"
                rules={[
                  { required: true, message: "Please provide a title" },
                  { min: 5, message: "Title must be at least 5 characters" },
                ]}
              >
                <Input
                  placeholder="Give your lesson plan a catchy title for the community"
                  maxLength={100}
                  showCount
                />
              </Form.Item>

              {/* Description */}
              <Form.Item
                name="description"
                label="Description & Teaching Tips"
                rules={[
                  { required: true, message: "Please provide a description" },
                  {
                    min: 20,
                    message: "Description must be at least 20 characters",
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder="Describe your lesson experience, what worked well, tips for other teachers, student reactions, etc..."
                  maxLength={500}
                  showCount
                />
              </Form.Item>

              {/* Tags */}
              <Form.Item
                name="tags"
                label="Tags (Optional)"
                extra="Separate tags with commas (e.g., creative writing, group work, assessment)"
              >
                <Input
                  placeholder="Add tags to help other teachers find your lesson"
                  maxLength={200}
                />
              </Form.Item>
            </Card>
          </Col>
        </Row>

        {/* Summary Card */}
        {selectedLessonPlan && (
          <Row gutter={[24, 16]} style={{ marginTop: "24px" }}>
            <Col span={24}>
              <Card
                size="small"
                title="Share Summary"
                className="summary-card"
                style={{ background: "#f6ffed", borderColor: "#b7eb8f" }}
              >
                <Row gutter={[16, 8]}>
                  <Col xs={24} sm={12}>
                    <div className="summary-item">
                      <Text strong>Class:</Text>
                      <div>
                        {getSelectedClassDetails()?.className || "Any Class"}
                        {getSelectedClassDetails() &&
                          ` (${getSelectedClassDetails().grade})`}
                      </div>
                    </div>
                  </Col>
                  <Col xs={24} sm={12}>
                    <div className="summary-item">
                      <Text strong>Subject:</Text>
                      <div>
                        {getSelectedClassDetails()?.subject || "General"}
                      </div>
                    </div>
                  </Col>
                  <Col xs={24} sm={12}>
                    <div className="summary-item">
                      <Text strong>Topic:</Text>
                      <div>
                        {
                          getSelectedLessonPlanDetails()?.parameters
                            ?.specificTopic
                        }
                      </div>
                    </div>
                  </Col>
                  <Col xs={24} sm={12}>
                    <div className="summary-item">
                      <Text strong>Grade Level:</Text>
                      <div>
                        {getSelectedLessonPlanDetails()?.parameters?.grade}
                      </div>
                    </div>
                  </Col>
                  <Col span={24}>
                    <div className="summary-item">
                      <Text strong>Learning Objective:</Text>
                      <div style={{ marginTop: "4px" }}>
                        {
                          getSelectedLessonPlanDetails()?.plan
                            ?.learningObjective
                        }
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        )}

        {/* Footer Actions */}
        <div className="modal-footer">
          <div className="footer-left">
            <Button onClick={handleReset} disabled={loading}>
              Reset
            </Button>
          </div>
          <div className="footer-right">
            <Button onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="primary"
              loading={loading}
              icon={<ShareAltOutlined />}
              disabled={!selectedLessonPlan}
              onClick={handleShareButtonClick}
              // Removed htmlType="submit" - now using direct onClick
            >
              Share to Community
            </Button>
          </div>
        </div>
      </Form>
    </Modal>
  );
};

export default UploadLessonModal;
