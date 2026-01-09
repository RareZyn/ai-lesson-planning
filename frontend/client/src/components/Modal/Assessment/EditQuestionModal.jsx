// src/components/Modal/Assessment/EditQuestionModal.jsx
import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Alert,
  Space,
  Divider,
  Typography,
} from "antd";
import {
  ExclamationCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

// Form for editing questions (assessment/spm-exam types)
const QuestionEditForm = ({ question, form, options, setOptions }) => {
  const questionType = Form.useWatch("type", form);

  const handleAddOption = () => {
    setOptions([...options, `${String.fromCharCode(65 + options.length)}. `]);
  };

  const handleRemoveOption = (index) => {
    const newOptions = options.filter((_, i) => i !== index);
    const reletteredOptions = newOptions.map(
      (opt, i) => `${String.fromCharCode(65 + i)}. ${opt.replace(/^[A-Z]\.\s*/, "")}`
    );
    setOptions(reletteredOptions);
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        <Form.Item
          name="questionNumber"
          label="Question Number"
          rules={[{ required: true, message: "Required" }]}
        >
          <InputNumber min={1} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          name="type"
          label="Question Type"
          rules={[{ required: true, message: "Required" }]}
        >
          <Select>
            <Option value="multiple_choice">Multiple Choice</Option>
            <Option value="short_answer">Short Answer</Option>
            <Option value="long_answer">Long Answer</Option>
            <Option value="fill_in_blank">Fill in the Blank</Option>
            <Option value="true_false">True/False</Option>
            <Option value="matching">Matching</Option>
          </Select>
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
        name="question"
        label="Question Text"
        rules={[{ required: true, message: "Please enter the question" }]}
      >
        <TextArea
          rows={4}
          placeholder="Enter the question text..."
          showCount
          maxLength={2000}
        />
      </Form.Item>

      {questionType === "multiple_choice" && (
        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ display: "block", marginBottom: 8 }}>
            Answer Options
          </Text>
          <Space direction="vertical" style={{ width: "100%" }}>
            {options.map((option, index) => (
              <div
                key={index}
                style={{ display: "flex", gap: 8, alignItems: "center" }}
              >
                <Input
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${String.fromCharCode(65 + index)}`}
                  style={{ flex: 1 }}
                />
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveOption(index)}
                  disabled={options.length <= 2}
                />
              </div>
            ))}
            {options.length < 6 && (
              <Button
                type="dashed"
                onClick={handleAddOption}
                icon={<PlusOutlined />}
                style={{ width: "100%" }}
              >
                Add Option
              </Button>
            )}
          </Space>
        </div>
      )}

      {(questionType === "short_answer" || questionType === "long_answer") && (
        <Form.Item name="answerSpace" label="Answer Space">
          <Select>
            <Option value="2 lines">2 lines</Option>
            <Option value="3 lines">3 lines</Option>
            <Option value="5 lines">5 lines</Option>
            <Option value="10 lines">10 lines</Option>
            <Option value="half page">Half page</Option>
            <Option value="full page">Full page</Option>
          </Select>
        </Form.Item>
      )}

      <Form.Item name="hint" label="Hint (Optional)">
        <Input placeholder="Optional hint for students..." />
      </Form.Item>
    </>
  );
};

// Form for editing generic content (essay prompts, guidelines, tasks, etc.)
const ContentEditForm = ({ item, form }) => {
  const getContentLabel = () => {
    switch (item?.type) {
      case "prompt": return "Essay Prompt";
      case "guideline": return "Guideline";
      case "instruction": return "Instruction";
      case "task": return "Task";
      case "preActivity": return "Pre-Activity Task";
      case "mainActivity": return "Main Activity Task";
      case "postActivity": return "Post-Activity Task";
      case "question": return "Question";
      default: return "Content";
    }
  };

  return (
    <Form.Item
      name="content"
      label={getContentLabel()}
      rules={[{ required: true, message: "Please enter the content" }]}
    >
      <TextArea
        rows={6}
        placeholder={`Enter the ${getContentLabel().toLowerCase()}...`}
        showCount
        maxLength={3000}
      />
    </Form.Item>
  );
};

const EditQuestionModal = ({
  isOpen,
  onClose,
  question,
  questionIndex,
  onSave,
  activityType,
}) => {
  const [form] = Form.useForm();
  const [options, setOptions] = useState([]);
  const [saving, setSaving] = useState(false);

  // Determine if this is a "content" type (non-question items like prompts, tasks)
  const isContentType = question?.type &&
    ["prompt", "guideline", "instruction", "task", "preActivity", "mainActivity", "postActivity"].includes(question.type);

  // Check if this is an SPM question (has part info)
  const isSpmQuestion = question?._partIndex !== undefined;

  useEffect(() => {
    if (question && isOpen) {
      if (isContentType) {
        // Content item (essay, activity, textbook)
        form.setFieldsValue({
          content: question.content || "",
        });
      } else {
        // Question item
        form.setFieldsValue({
          questionNumber: question.questionNumber || questionIndex + 1,
          question: question.question || question.text || "",
          type: question.type || "short_answer",
          points: question.points || question.marks || 1,
          answerSpace: question.answerSpace || "3 lines",
          hint: question.hint || "",
        });

        if (question.options && Array.isArray(question.options)) {
          setOptions(question.options);
        } else {
          setOptions([]);
        }
      }
    }
  }, [question, questionIndex, isOpen, form, isContentType]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const values = await form.validateFields();

      let updatedItem;

      if (isContentType) {
        // Update content item
        updatedItem = {
          ...question,
          content: values.content,
        };
      } else {
        // Update question item
        updatedItem = {
          ...question,
          questionNumber: values.questionNumber,
          question: values.question,
          type: values.type,
          points: values.points,
          answerSpace: values.answerSpace,
          hint: values.hint,
          options: values.type === "multiple_choice" ? options : undefined,
        };
      }

      await onSave(updatedItem, questionIndex);
      onClose();
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setSaving(false);
    }
  };

  const getTitle = () => {
    if (isContentType) {
      return `Edit ${question?.label || "Content"}`;
    }
    if (isSpmQuestion && question?.partTitle) {
      return `Edit ${question.partTitle} - Question ${question?.questionNumber || questionIndex + 1}`;
    }
    return `Edit Question ${question?.questionNumber || questionIndex + 1}`;
  };

  return (
    <Modal
      title={getTitle()}
      open={isOpen}
      onCancel={onClose}
      width={700}
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
      <Alert
        message="Important Reminder"
        description={
          <span>
            If you modify this {isContentType ? "content" : "question"}, you must{" "}
            <strong>manually update</strong> the corresponding{" "}
            {isContentType ? "rubric criteria" : "answer"} in the{" "}
            <strong>Answer Key / Rubric</strong> section to ensure consistency.
          </span>
        }
        type="warning"
        icon={<ExclamationCircleOutlined />}
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Form form={form} layout="vertical">
        {isContentType ? (
          <ContentEditForm item={question} form={form} />
        ) : (
          <QuestionEditForm
            question={question}
            form={form}
            options={options}
            setOptions={setOptions}
          />
        )}
      </Form>

      <Divider />

      <Text type="secondary" style={{ fontSize: 12 }}>
        Changes will be saved to the assessment. Make sure to review and update
        the {isContentType ? "rubric" : "answer key"} accordingly.
      </Text>
    </Modal>
  );
};

export default EditQuestionModal;
