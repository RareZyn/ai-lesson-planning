// src/pages/community/components/UploadLessonModal.jsx
import React, { useState } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Upload,
  Button,
  message,
  Tag,
  Space,
  Divider,
  Row,
  Col,
} from "antd";
import {
  UploadOutlined,
  InboxOutlined,
  FileTextOutlined,
  PlusOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import "./UploadLessonModal.css";

const { Option } = Select;
const { TextArea } = Input;
const { Dragger } = Upload;

const UploadLessonModal = ({ isOpen, onClose, onSubmit }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [tags, setTags] = useState([]);
  const [inputTag, setInputTag] = useState("");
  const [objectives, setObjectives] = useState([""]);

  const handleSubmit = async (values) => {
    if (fileList.length === 0) {
      message.error("Please upload at least one file");
      return;
    }

    if (tags.length === 0) {
      message.error("Please add at least one tag");
      return;
    }

    setLoading(true);
    try {
      const lessonData = {
        ...values,
        tags,
        objectives: objectives.filter((obj) => obj.trim() !== ""),
        files: fileList,
        fileCount: fileList.length,
      };

      await onSubmit(lessonData);
      handleReset();
    } catch (error) {
      message.error("Failed to upload lesson plan");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    setFileList([]);
    setTags([]);
    setInputTag("");
    setObjectives([""]);
  };

  const handleClose = () => {
    if (!loading) {
      handleReset();
      onClose();
    }
  };

  // File upload props
  const uploadProps = {
    name: "file",
    multiple: true,
    fileList,
    beforeUpload: (file) => {
      const isValidType =
        file.type === "application/pdf" ||
        file.type === "application/msword" ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.type === "application/vnd.ms-powerpoint" ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.presentationml.presentation";

      if (!isValidType) {
        message.error("You can only upload PDF, Word, or PowerPoint files!");
        return false;
      }

      const isLt50M = file.size / 1024 / 1024 < 50;
      if (!isLt50M) {
        message.error("File must be smaller than 50MB!");
        return false;
      }

      return false; // Prevent auto upload
    },
    onChange: (info) => {
      setFileList(info.fileList);
    },
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
  };

  // Tag management
  const handleAddTag = () => {
    if (inputTag && !tags.includes(inputTag) && tags.length < 8) {
      setTags([...tags, inputTag]);
      setInputTag("");
    }
  };

  const handleRemoveTag = (removedTag) => {
    setTags(tags.filter((tag) => tag !== removedTag));
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Objectives management
  const handleObjectiveChange = (index, value) => {
    const newObjectives = [...objectives];
    newObjectives[index] = value;
    setObjectives(newObjectives);
  };

  const addObjective = () => {
    if (objectives.length < 5) {
      setObjectives([...objectives, ""]);
    }
  };

  const removeObjective = (index) => {
    if (objectives.length > 1) {
      const newObjectives = objectives.filter((_, i) => i !== index);
      setObjectives(newObjectives);
    }
  };

  return (
    <Modal
      title={
        <div className="modal-title">
          <FileTextOutlined />
          <span>Upload Lesson Plan</span>
        </div>
      }
      open={isOpen}
      onCancel={handleClose}
      footer={null}
      width={800}
      className="upload-lesson-modal"
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="upload-form"
      >
        <Row gutter={[16, 0]}>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Lesson Title"
              name="title"
              rules={[{ required: true, message: "Please enter lesson title" }]}
            >
              <Input placeholder="Enter a descriptive title for your lesson" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Subject"
              name="subject"
              rules={[{ required: true, message: "Please select subject" }]}
            >
              <Select placeholder="Select subject">
                <Option value="English">English</Option>
                <Option value="Mathematics">Mathematics</Option>
                <Option value="Science">Science</Option>
                <Option value="History">History</Option>
                <Option value="Geography">Geography</Option>
                <Option value="Bahasa Melayu">Bahasa Melayu</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 0]}>
          <Col xs={24} sm={8}>
            <Form.Item
              label="Level"
              name="level"
              rules={[{ required: true, message: "Please select level" }]}
            >
              <Select placeholder="Select level">
                <Option value="Form 1">Form 1</Option>
                <Option value="Form 2">Form 2</Option>
                <Option value="Form 3">Form 3</Option>
                <Option value="Form 4">Form 4</Option>
                <Option value="Form 5">Form 5</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item
              label="Duration"
              name="duration"
              rules={[{ required: true, message: "Please enter duration" }]}
            >
              <Select placeholder="Select duration">
                <Option value="30 minutes">30 minutes</Option>
                <Option value="45 minutes">45 minutes</Option>
                <Option value="60 minutes">60 minutes</Option>
                <Option value="90 minutes">90 minutes</Option>
                <Option value="120 minutes">120 minutes</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item
              label="Difficulty"
              name="difficulty"
              rules={[{ required: true, message: "Please select difficulty" }]}
            >
              <Select placeholder="Select difficulty">
                <Option value="Beginner">Beginner</Option>
                <Option value="Intermediate">Intermediate</Option>
                <Option value="Advanced">Advanced</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Description"
          name="description"
          rules={[{ required: true, message: "Please enter description" }]}
        >
          <TextArea
            rows={3}
            placeholder="Provide a brief description of your lesson plan..."
            maxLength={500}
            showCount
          />
        </Form.Item>

        {/* Learning Objectives */}
        <Form.Item label="Learning Objectives">
          <div className="objectives-section">
            {objectives.map((objective, index) => (
              <div key={index} className="objective-item">
                <Input
                  placeholder={`Learning objective ${index + 1}`}
                  value={objective}
                  onChange={(e) => handleObjectiveChange(index, e.target.value)}
                  suffix={
                    objectives.length > 1 && (
                      <Button
                        type="text"
                        size="small"
                        icon={<CloseOutlined />}
                        onClick={() => removeObjective(index)}
                        className="remove-objective-btn"
                      />
                    )
                  }
                />
              </div>
            ))}
            {objectives.length < 5 && (
              <Button
                type="dashed"
                onClick={addObjective}
                icon={<PlusOutlined />}
                className="add-objective-btn"
              >
                Add Learning Objective
              </Button>
            )}
          </div>
        </Form.Item>

        {/* Tags */}
        <Form.Item label="Tags (Topics Covered)">
          <div className="tags-section">
            <div className="tags-input">
              <Input
                placeholder="Enter a tag and press Enter"
                value={inputTag}
                onChange={(e) => setInputTag(e.target.value)}
                onKeyPress={handleKeyPress}
                suffix={
                  <Button
                    type="text"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={handleAddTag}
                    disabled={!inputTag || tags.length >= 8}
                  />
                }
              />
            </div>
            <div className="tags-display">
              {tags.map((tag) => (
                <Tag
                  key={tag}
                  closable
                  onClose={() => handleRemoveTag(tag)}
                  className="lesson-tag"
                >
                  {tag}
                </Tag>
              ))}
            </div>
            <div className="tags-hint">
              Add up to 8 tags to help others find your lesson plan
            </div>
          </div>
        </Form.Item>

        <Divider />

        {/* File Upload */}
        <Form.Item label="Upload Files" required>
          <Dragger {...uploadProps} className="file-dragger">
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              Click or drag files to this area to upload
            </p>
            <p className="ant-upload-hint">
              Support for PDF, Word documents, PowerPoint presentations. Maximum
              file size: 50MB per file.
            </p>
          </Dragger>
          {fileList.length > 0 && (
            <div className="file-list">
              <div className="file-list-header">
                Uploaded Files ({fileList.length})
              </div>
              {fileList.map((file, index) => (
                <div key={index} className="file-item">
                  <FileTextOutlined />
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              ))}
            </div>
          )}
        </Form.Item>

        {/* Footer */}
        <div className="modal-footer">
          <Space>
            <Button onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleReset} disabled={loading}>
              Reset
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<UploadOutlined />}
            >
              Upload Lesson Plan
            </Button>
          </Space>
        </div>
      </Form>
    </Modal>
  );
};

export default UploadLessonModal;
