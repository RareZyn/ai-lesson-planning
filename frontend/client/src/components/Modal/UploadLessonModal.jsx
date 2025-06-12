// src/components/Modal/UploadLessonModal.jsx - Restructured for sharing existing lesson plans
import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Select,
  Upload,
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
  UploadOutlined,
  InboxOutlined,
  ShareAltOutlined,
  BookOutlined,
  TeamOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import {
  dummyClasses,
  getLessonPlansByClassId,
} from "../../data/LessonPlanData";
import "./UploadLessonModal.css";

const { Option } = Select;
const { TextArea } = Input;
const { Dragger } = Upload;
const { Text } = Typography;

const UploadLessonModal = ({ isOpen, onClose, onSubmit }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [lessonPlans, setLessonPlans] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedLessonPlan, setSelectedLessonPlan] = useState(null);
  const [classesLoading, setClassesLoading] = useState(false);
  const [lessonPlansLoading, setLessonPlansLoading] = useState(false);
  const [imageFileList, setImageFileList] = useState([]);

  // Fetch classes on modal open
  useEffect(() => {
    if (isOpen) {
      fetchClasses();
    }
  }, [isOpen]);

  // Fetch lesson plans when class is selected
  useEffect(() => {
    if (selectedClass) {
      fetchLessonPlans(selectedClass);
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    setClassesLoading(true);
    try {
      // Using dummy data instead of API call
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate loading
      setClasses(dummyClasses);
    } catch (error) {
      console.error("Error fetching classes:", error);
      message.error("Failed to fetch classes");
      setClasses([]);
    } finally {
      setClassesLoading(false);
    }
  };

  const fetchLessonPlans = async (classId) => {
    setLessonPlansLoading(true);
    try {
      // Using dummy data instead of API call
      await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate loading
      const plans = getLessonPlansByClassId(classId);
      setLessonPlans(plans);
    } catch (error) {
      console.error("Error fetching lesson plans:", error);
      message.error("Failed to fetch lesson plans");
      setLessonPlans([]);
    } finally {
      setLessonPlansLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    if (!selectedClass || !selectedLessonPlan) {
      message.error("Please select both class and lesson plan");
      return;
    }

    setLoading(true);
    try {
      const shareData = {
        classId: selectedClass,
        lessonPlanId: selectedLessonPlan,
        description: values.description,
        images: imageFileList.map((file) => file.originFileObj || file),
        sharedAt: new Date().toISOString(),
        isPublic: true,
      };

      await onSubmit(shareData);
      message.success("Lesson plan shared successfully!");
      handleReset();
      onClose();
    } catch (error) {
      console.error("Share error:", error);
      message.error("Failed to share lesson plan");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    setSelectedClass(null);
    setSelectedLessonPlan(null);
    setImageFileList([]);
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
  };

  // Image upload props
  const imageUploadProps = {
    name: "images",
    multiple: true,
    fileList: imageFileList,
    beforeUpload: (file) => {
      const isValidType = file.type.startsWith("image/");
      if (!isValidType) {
        message.error("You can only upload image files!");
        return false;
      }

      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error("Image must be smaller than 10MB!");
        return false;
      }

      return false; // Prevent auto upload
    },
    onChange: (info) => {
      setImageFileList(info.fileList);
    },
    onRemove: (file) => {
      const index = imageFileList.indexOf(file);
      const newFileList = imageFileList.slice();
      newFileList.splice(index, 1);
      setImageFileList(newFileList);
    },
  };

  const getSelectedClassDetails = () => {
    return classes.find((cls) => cls._id === selectedClass);
  };

  const getSelectedLessonPlanDetails = () => {
    return lessonPlans.find((plan) => plan._id === selectedLessonPlan);
  };

  const formatLessonPlanOption = (plan) => {
    const theme = plan.parameters?.Sow?.theme || "No Theme";
    const topic = plan.parameters?.Sow?.topic || "No Topic";
    const grade = plan.parameters?.grade || "Unknown Grade";
    const date = plan.lessonDate
      ? new Date(plan.lessonDate).toLocaleDateString()
      : "No Date";

    return {
      label: `${theme} - ${topic}`,
      details: `${grade} | ${date}`,
      hots: plan.parameters?.hotsFocus || null,
      proficiency: plan.parameters?.proficiencyLevel || null,
    };
  };

  return (
    <Modal
      title={
        <div className="modal-title">
          <ShareAltOutlined />
          <span>Share Lesson Plan</span>
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
        description="Select an existing lesson plan from your classes to share with the community. Other teachers can learn from your successful lessons."
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
          {/* Class Selection - Full Width */}
          <Col span={24}>
            <Card
              size="small"
              title={
                <div className="card-title">
                  <TeamOutlined style={{ color: "#1890ff" }} />
                  <span>Select Class</span>
                </div>
              }
              className="selection-card"
            >
              <Form.Item
                name="class"
                rules={[{ required: true, message: "Please select a class" }]}
              >
                <Spin spinning={classesLoading}>
                  <Select
                    placeholder="Choose a class"
                    value={selectedClass}
                    onChange={handleClassChange}
                    size="large"
                    style={{ width: "100%" }}
                    loading={classesLoading}
                  >
                    {classes.map((classItem) => (
                      <Option key={classItem._id} value={classItem._id}>
                        {classItem.className}
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

          {/* Lesson Plan Selection - Full Width */}
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
                    placeholder={
                      selectedClass
                        ? "Choose a lesson plan"
                        : "Please select a class first"
                    }
                    value={selectedLessonPlan}
                    onChange={handleLessonPlanChange}
                    size="large"
                    style={{ width: "100%" }}
                    disabled={!selectedClass}
                    loading={lessonPlansLoading}
                    showSearch
                    filterOption={(input, option) =>
                      option.children
                        .toLowerCase()
                        .indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {lessonPlans.map((plan) => {
                      const formatted = formatLessonPlanOption(plan);
                      return (
                        <Option key={plan._id} value={plan._id}>
                          {formatted.label}
                        </Option>
                      );
                    })}
                  </Select>
                </Spin>
              </Form.Item>

              {selectedLessonPlan && getSelectedLessonPlanDetails() && (
                <div className="selected-preview">
                  <Text strong>Selected Lesson:</Text>
                  <div className="preview-content">
                    <div className="lesson-preview">
                      <div className="lesson-title">
                        {getSelectedLessonPlanDetails().parameters?.Sow
                          ?.topic || "English Lesson"}
                      </div>
                      <div className="lesson-meta">
                        <Tag color="green">
                          {
                            getSelectedLessonPlanDetails().parameters?.Sow
                              ?.theme
                          }
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

              {lessonPlans.length === 0 &&
                selectedClass &&
                !lessonPlansLoading && (
                  <div className="empty-state">
                    <Text type="secondary">
                      No lesson plans found for this class. Create some lesson
                      plans first.
                    </Text>
                  </div>
                )}
            </Card>
          </Col>
        </Row>

        {/* Description */}
        <Row gutter={[24, 16]} style={{ marginTop: "24px" }}>
          <Col span={24}>
            <Card
              size="small"
              title="Share Description"
              className="selection-card"
            >
              <Form.Item
                name="description"
                rules={[
                  { required: true, message: "Please provide a description" },
                  {
                    min: 10,
                    message: "Description must be at least 10 characters",
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
              <Text type="secondary" style={{ fontSize: "12px" }}>
                Share your insights and experience with this lesson to help
                other teachers.
              </Text>
            </Card>
          </Col>
        </Row>

        {/* Image Upload */}
        <Row gutter={[24, 16]} style={{ marginTop: "24px" }}>
          <Col span={24}>
            <Card
              size="small"
              title={
                <div className="card-title">
                  <PictureOutlined style={{ color: "#fa8c16" }} />
                  <span>Add Images (Optional)</span>
                </div>
              }
              className="selection-card"
            >
              <div className="image-upload-container">
                <Dragger {...imageUploadProps} className="image-dragger">
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">
                    Click or drag images to upload
                  </p>
                  <p className="ant-upload-hint">
                    Support for JPG, PNG, GIF images. Maximum 10MB per image.
                    Add photos of student work, classroom activities, or
                    materials used.
                  </p>
                </Dragger>
              </div>

              {imageFileList.length > 0 && (
                <div className="image-preview-list">
                  <div className="preview-header">
                    <Text strong>Uploaded Images ({imageFileList.length})</Text>
                  </div>
                  <div className="preview-grid">
                    {imageFileList.map((file, index) => (
                      <div key={index} className="image-preview-item">
                        <div className="image-name">{file.name}</div>
                        <div className="image-size">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </Col>
        </Row>

        {/* Summary Card */}
        {selectedClass && selectedLessonPlan && (
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
                        {getSelectedClassDetails()?.className} (
                        {getSelectedClassDetails()?.grade})
                      </div>
                    </div>
                  </Col>
                  <Col xs={24} sm={12}>
                    <div className="summary-item">
                      <Text strong>Subject:</Text>
                      <div>{getSelectedClassDetails()?.subject}</div>
                    </div>
                  </Col>
                  <Col xs={24} sm={12}>
                    <div className="summary-item">
                      <Text strong>Lesson Topic:</Text>
                      <div>
                        {getSelectedLessonPlanDetails()?.parameters?.Sow?.topic}
                      </div>
                    </div>
                  </Col>
                  <Col xs={24} sm={12}>
                    <div className="summary-item">
                      <Text strong>Theme:</Text>
                      <div>
                        {getSelectedLessonPlanDetails()?.parameters?.Sow?.theme}
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
              disabled={!selectedClass || !selectedLessonPlan}
            >
              Share Lesson Plan
            </Button>
          </div>
        </div>
      </Form>
    </Modal>
  );
};

export default UploadLessonModal;
