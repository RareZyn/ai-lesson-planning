// src/components/Modal/Assessment/EditAnswerModal.jsx
import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Button,
  Divider,
  Typography,
} from "antd";

const { TextArea } = Input;
const { Text } = Typography;

// Component for editing Answer Key entries (for assessment/spm-exam types)
const EditAnswerKeyForm = ({ answer, form }) => {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Form.Item
          name="questionNumber"
          label="Question Number"
          rules={[{ required: true, message: "Required" }]}
        >
          <InputNumber min={1} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          name="points"
          label="Points"
          rules={[{ required: true, message: "Required" }]}
        >
          <InputNumber min={1} max={100} style={{ width: "100%" }} />
        </Form.Item>
      </div>

      <Form.Item
        name="correctAnswer"
        label="Correct Answer"
        rules={[{ required: true, message: "Please enter the correct answer" }]}
      >
        <TextArea
          rows={3}
          placeholder="Enter the correct answer..."
          showCount
          maxLength={2000}
        />
      </Form.Item>

      <Form.Item name="explanation" label="Explanation">
        <TextArea
          rows={3}
          placeholder="Explanation of why this is the correct answer..."
          showCount
          maxLength={1000}
        />
      </Form.Item>

      <Form.Item name="markingGuidance" label="Marking Guidance">
        <TextArea
          rows={2}
          placeholder="Guidance for marking this answer..."
          showCount
          maxLength={500}
        />
      </Form.Item>

      <Form.Item name="markingNotes" label="Marking Notes">
        <TextArea
          rows={2}
          placeholder="Additional marking notes..."
          showCount
          maxLength={500}
        />
      </Form.Item>

      <Form.Item name="acceptableAlternatives" label="Acceptable Alternatives">
        <TextArea
          rows={2}
          placeholder="Alternative answers that are also acceptable..."
          showCount
          maxLength={500}
        />
      </Form.Item>

      <Form.Item name="commonErrors" label="Common Student Errors">
        <TextArea
          rows={2}
          placeholder="Common mistakes students make..."
          showCount
          maxLength={500}
        />
      </Form.Item>
    </>
  );
};

// Component for editing Rubric entries (for essay/textbook/activity types)
const EditRubricForm = ({ criterion, form }) => {
  return (
    <>
      <Form.Item
        name="category"
        label="Criteria Category"
        rules={[{ required: true, message: "Please enter the category" }]}
      >
        <Input placeholder="e.g., Content, Organization, Language Use..." />
      </Form.Item>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Form.Item
          name="excellent"
          label="Excellent (4)"
          rules={[{ required: true, message: "Required" }]}
        >
          <TextArea rows={3} placeholder="Description for excellent performance..." />
        </Form.Item>

        <Form.Item
          name="good"
          label="Good (3)"
          rules={[{ required: true, message: "Required" }]}
        >
          <TextArea rows={3} placeholder="Description for good performance..." />
        </Form.Item>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Form.Item
          name="satisfactory"
          label="Satisfactory (2)"
          rules={[{ required: true, message: "Required" }]}
        >
          <TextArea rows={3} placeholder="Description for satisfactory performance..." />
        </Form.Item>

        <Form.Item
          name="needsImprovement"
          label="Needs Improvement (1)"
          rules={[{ required: true, message: "Required" }]}
        >
          <TextArea rows={3} placeholder="Description for needs improvement..." />
        </Form.Item>
      </div>

      <Form.Item
        name="points"
        label="Maximum Points"
        rules={[{ required: true, message: "Required" }]}
      >
        <InputNumber min={1} max={100} style={{ width: 150 }} />
      </Form.Item>
    </>
  );
};

const EditAnswerModal = ({
  isOpen,
  onClose,
  answer,
  answerIndex,
  onSave,
  activityType,
  contentType, // "answerKey" or "rubric"
}) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const isAnswerKey =
    contentType === "answerKey" ||
    activityType === "assessment" ||
    activityType === "spm-exam";

  useEffect(() => {
    if (answer && isOpen) {
      if (isAnswerKey) {
        // Answer key fields
        form.setFieldsValue({
          questionNumber: answer.questionNumber || answerIndex + 1,
          points: answer.points || answer.marks || 1,
          correctAnswer: answer.correctAnswer || "",
          explanation: answer.explanation || "",
          markingGuidance: answer.markingGuidance || "",
          markingNotes: answer.markingNotes || "",
          acceptableAlternatives: answer.acceptableAlternatives || "",
          commonErrors: answer.commonErrors || "",
        });
      } else {
        // Rubric fields
        form.setFieldsValue({
          category: answer.category || "",
          excellent: answer.excellent || "",
          good: answer.good || "",
          satisfactory: answer.satisfactory || "",
          needsImprovement: answer.needsImprovement || "",
          points: answer.points || 4,
        });
      }
    }
  }, [answer, answerIndex, isOpen, form, isAnswerKey]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const values = await form.validateFields();

      let updatedAnswer;
      if (isAnswerKey) {
        updatedAnswer = {
          ...answer,
          questionNumber: values.questionNumber,
          points: values.points,
          marks: values.points, // Keep both for compatibility
          correctAnswer: values.correctAnswer,
          explanation: values.explanation,
          markingGuidance: values.markingGuidance,
          markingNotes: values.markingNotes,
          acceptableAlternatives: values.acceptableAlternatives,
          commonErrors: values.commonErrors,
        };
      } else {
        updatedAnswer = {
          ...answer,
          category: values.category,
          excellent: values.excellent,
          good: values.good,
          satisfactory: values.satisfactory,
          needsImprovement: values.needsImprovement,
          points: values.points,
        };
      }

      await onSave(updatedAnswer, answerIndex);
      onClose();
    } catch (error) {
      console.error("Error saving answer:", error);
    } finally {
      setSaving(false);
    }
  };

  const getTitle = () => {
    if (isAnswerKey) {
      return `Edit Answer for Question ${answer?.questionNumber || answerIndex + 1}`;
    }
    return `Edit Rubric Criteria: ${answer?.category || `Criterion ${answerIndex + 1}`}`;
  };

  return (
    <Modal
      title={getTitle()}
      open={isOpen}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="save"
          type="primary"
          onClick={handleSave}
          loading={saving}
        >
          Save Changes
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        {isAnswerKey ? (
          <EditAnswerKeyForm answer={answer} form={form} />
        ) : (
          <EditRubricForm criterion={answer} form={form} />
        )}
      </Form>

      <Divider />

      <Text type="secondary" style={{ fontSize: 12 }}>
        {isAnswerKey
          ? "Ensure the answer matches the corresponding question in the assessment paper."
          : "Ensure rubric criteria align with the learning objectives and assessment requirements."}
      </Text>
    </Modal>
  );
};

export default EditAnswerModal;
