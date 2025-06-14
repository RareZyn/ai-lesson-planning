// src/components/Modal/UploadLessonModal.jsx - Updated with backend integration
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

  // Fetch classes on modal open
  useEffect(() => {
    if (isOpen) {
      fetchClasses();
    }
  }, [isOpen]);

  // Fetch lesson plans when class is selected
  useEffect(() => {
    if (selectedClass) {
      fetchUserLessonPlans();
    }
  }, [selectedClass]);

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
    setLessonPlansLoading(true);
    try {
      const response = await communityAPI.getUserLessonPlans(currentUserId, {
        shared: false, // Only get unshared lessons
      });

      if (response.success) {
        // Filter lessons by selected class if needed
        let plans = response.data || [];
        if (selectedClass) {
          plans = plans.filter((plan) => plan.classId?._id === selectedClass);
        }
        setLessonPlans(plans);
      }
    } catch (error) {
      console.error("Error fetching lesson plans:", error);
      message.error("Failed to fetch lesson plans");
      setLessonPlans([]);
    } finally {
      setLessonPlansLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    if (!selectedLessonPlan) {
      message.error("Please select a lesson plan to share");
      return;
    }

    setLoading(true);
    try {
      const shareData = {
        lessonPlanId: selectedLessonPlan,
        title: values.title,
        description: values.description,
        tags: values.tags
          ? values.tags.split(",").map((tag) => tag.trim())
          : [],
      };

      await onSubmit(shareData);
      handleReset();
    } catch (error) {
      console.error("Share error:", error);
      // Error handling is done in parent component
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    setSelectedClass(null);
    setSelectedLessonPlan(null);
    setLessonPlans([]);
  };

  const handleClose = () => {
    if (!loading) {
      handleReset();
      onClose();
    }
  };

  const handleClassChange = (classId) => {
    setSelectedClass(classId);
    setSelectedLessonPlan(null);
    form.setFieldsValue({ lessonPlan: undefined });
  };

  const handleLessonPlanChange = (lessonPlanId) => {
    setSelectedLessonPlan(lessonPlanId);

    // Auto-fill title and description if not already filled
    const selectedPlan = getSelectedLessonPlanDetails();
    if (selectedPlan && !form.getFieldValue("title")) {
      const autoTitle = `${
        selectedPlan.parameters?.specificTopic || "Lesson Plan"
      } - ${selectedPlan.parameters?.grade || "Form 4"}`;
      form.setFieldsValue({
        title: autoTitle,
        description: selectedPlan.plan?.learningObjective || "",
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
    return lessonPlans.map((plan) => {
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
        onFinish={handleSubmit}
        className="upload-form"
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
                    value={selectedLessonPlan}
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

              {lessonPlans.length === 0 && !lessonPlansLoading && (
                <div className="empty-state">
                  <Text type="secondary">
                    {selectedClass
                      ? "No unshared lesson plans found for this class."
                      : "No unshared lesson plans found. Create some lesson plans first."}
                  </Text>
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
              htmlType="submit"
              loading={loading}
              icon={<ShareAltOutlined />}
              disabled={!selectedLessonPlan}
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
