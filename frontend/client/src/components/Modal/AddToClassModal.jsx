// src/components/Modal/AddToClassModal.jsx
import React, { useState, useEffect } from "react";
import { Modal, Select, Button, message, Spin, Empty, Tag } from "antd";
import {
  PlusOutlined,
  BookOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { getClassesByGrade } from "../../services/classService";
import { communityAPI } from "../../services/communityService";

const { Option } = Select;

const AddToClassModal = ({
  visible,
  onClose,
  lesson,
  assessments = [],
  currentUserId,
  onSuccess,
}) => {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingClasses, setFetchingClasses] = useState(false);

  // Fetch classes when modal opens
  useEffect(() => {
    if (visible && lesson?.parameters?.grade) {
      fetchClasses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, lesson?.parameters?.grade]);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setSelectedClassId(null);
      setClasses([]);
    }
  }, [visible]);

  const fetchClasses = async () => {
    if (!lesson?.parameters?.grade) {
      message.error("Lesson grade information is missing");
      return;
    }

    setFetchingClasses(true);
    try {
      const classesData = await getClassesByGrade(lesson.parameters.grade);
      setClasses(classesData);

      if (classesData.length === 0) {
        message.info(
          `No classes found for ${lesson.parameters.grade}. Please create a class first.`
        );
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
      message.error("Failed to fetch your classes");
    } finally {
      setFetchingClasses(false);
    }
  };

  const handleAddToClass = async () => {
    if (!selectedClassId) {
      message.warning("Please select a class");
      return;
    }

    if (!currentUserId) {
      message.error("Please log in to add lessons to your class");
      return;
    }

    setLoading(true);
    try {
      const response = await communityAPI.copyLessonToClass(
        lesson._id,
        selectedClassId,
        currentUserId
      );

      if (response.success) {
        const selectedClass = classes.find((c) => c._id === selectedClassId);
        message.success(
          `Lesson plan added to ${selectedClass?.className || "your class"} successfully!` +
            (response.data.assessmentsCopied > 0
              ? ` (${response.data.assessmentsCopied} assessment(s) included)`
              : "")
        );

        if (onSuccess) {
          onSuccess(response.data);
        }
        onClose();
      }
    } catch (error) {
      console.error("Error adding lesson to class:", error);
      message.error(
        error.response?.data?.message || "Failed to add lesson to class"
      );
    } finally {
      setLoading(false);
    }
  };

  const lessonGrade = lesson?.parameters?.grade || "Unknown";
  const lessonTitle =
    lesson?.communityData?.title ||
    lesson?.parameters?.specificTopic ||
    "Lesson Plan";

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <PlusOutlined style={{ color: "#1890ff" }} />
          <span>Add to My Class</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="add"
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddToClass}
          loading={loading}
          disabled={!selectedClassId || fetchingClasses}
        >
          Add to Class
        </Button>,
      ]}
      width={500}
    >
      {/* Lesson Info Summary */}
      <div
        style={{
          padding: "12px 16px",
          backgroundColor: "#f6f8fa",
          borderRadius: "8px",
          marginBottom: "16px",
        }}
      >
        <h4 style={{ margin: "0 0 8px 0", color: "#1890ff" }}>
          <FileTextOutlined style={{ marginRight: "6px" }} />
          {lessonTitle}
        </h4>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <Tag color="blue">{lessonGrade}</Tag>
          {lesson?.parameters?.proficiencyLevel && (
            <Tag color="green">{lesson.parameters.proficiencyLevel}</Tag>
          )}
          {assessments.length > 0 && (
            <Tag color="purple">
              <CheckCircleOutlined style={{ marginRight: "4px" }} />
              {assessments.length} Assessment(s)
            </Tag>
          )}
        </div>
      </div>

      {/* Class Selection */}
      <div style={{ marginBottom: "16px" }}>
        <label
          style={{
            display: "block",
            marginBottom: "8px",
            fontWeight: 500,
            color: "#333",
          }}
        >
          <BookOutlined style={{ marginRight: "6px" }} />
          Select a Class ({lessonGrade})
        </label>

        {fetchingClasses ? (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <Spin size="small" />
            <p style={{ marginTop: "8px", color: "#888" }}>
              Loading your classes...
            </p>
          </div>
        ) : classes.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span>
                No {lessonGrade} classes found.
                <br />
                <span style={{ fontSize: "12px", color: "#888" }}>
                  Create a class with grade "{lessonGrade}" to add this lesson.
                </span>
              </span>
            }
            style={{
              padding: "20px",
              backgroundColor: "#fafafa",
              borderRadius: "8px",
            }}
          />
        ) : (
          <Select
            placeholder="Choose a class"
            value={selectedClassId}
            onChange={setSelectedClassId}
            style={{ width: "100%" }}
            size="large"
          >
            {classes.map((classItem) => (
              <Option key={classItem._id} value={classItem._id}>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span>{classItem.className}</span>
                  <span style={{ color: "#888", fontSize: "12px" }}>
                    {classItem.subject} - {classItem.year}
                  </span>
                </div>
              </Option>
            ))}
          </Select>
        )}
      </div>

      {/* Info Note */}
      <div
        style={{
          padding: "12px",
          backgroundColor: "#e6f7ff",
          borderRadius: "6px",
          fontSize: "13px",
          color: "#0050b3",
        }}
      >
        <strong>Note:</strong> This will create a copy of the lesson plan
        {assessments.length > 0
          ? ` and its ${assessments.length} assessment(s)`
          : ""}{" "}
        in your selected class. The original lesson will remain in the
        community.
      </div>
    </Modal>
  );
};

export default AddToClassModal;
