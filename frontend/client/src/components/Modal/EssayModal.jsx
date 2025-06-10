import React, { useState } from "react";
import { Modal, Select, Input, Button, Typography, Row, Col } from "antd";
import { CloseOutlined } from "@ant-design/icons";

const { Option } = Select;
const { TextArea } = Input;
const { Title } = Typography;

const EssayModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    essayType: "short_communicative",
    format: "",
    purpose: "",
    theme: "",
    extendedType: "",
    topic: "",
    points: "",
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      closable={false}
      centered
      width={600}
      className="essay-modal"
      styles={{
        body: { padding: 0 },
        content: { padding: 0 },
      }}
    >
      {/* Custom Header */}
      <div className="d-flex justify-content-between align-items-center p-4 border-bottom">
        <Title level={4} className="mb-0 text-primary">
          📝 Select Essay Details
        </Title>
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={onClose}
          className="d-flex align-items-center justify-content-center"
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            color: "#666",
          }}
        />
      </div>

      {/* Modal Body */}
      <div className="p-4">
        <Row gutter={[0, 24]}>
          {/* Essay Type */}
          <Col span={24}>
            <div>
              <label className="d-block fw-semibold mb-2 text-dark">
                Essay Type
              </label>
              <Select
                value={formData.essayType}
                onChange={(value) => handleInputChange("essayType", value)}
                className="w-100"
                size="large"
              >
                <Option value="short_communicative">
                  Short Communicative Message
                </Option>
                <Option value="guided">Guided Writing</Option>
                <Option value="extended">Extended Writing</Option>
              </Select>
            </div>
          </Col>

          {/* Short Communicative Fields */}
          {formData.essayType === "short_communicative" && (
            <>
              <Col span={24}>
                <div>
                  <label className="d-block fw-semibold mb-2 text-dark">
                    Format
                  </label>
                  <Select
                    value={formData.format}
                    onChange={(value) => handleInputChange("format", value)}
                    className="w-100"
                    size="large"
                    placeholder="Select format..."
                  >
                    <Option value="note">📄 Note</Option>
                    <Option value="email">✉️ Email</Option>
                  </Select>
                </div>
              </Col>

              <Col span={24}>
                <div>
                  <label className="d-block fw-semibold mb-2 text-dark">
                    Purpose
                  </label>
                  <Select
                    value={formData.purpose}
                    onChange={(value) => handleInputChange("purpose", value)}
                    className="w-100"
                    size="large"
                    placeholder="Select purpose..."
                  >
                    <Option value="inform">ℹ️ Inform</Option>
                    <Option value="invite">🎉 Invite</Option>
                    <Option value="thank">🙏 Thank</Option>
                    <Option value="apologize">😔 Apologize</Option>
                    <Option value="remind">⏰ Remind</Option>
                    <Option value="ask">❓ Ask</Option>
                    <Option value="congratulate">🎊 Congratulate</Option>
                  </Select>
                </div>
              </Col>
            </>
          )}

          {/* Guided Writing Fields */}
          {formData.essayType === "guided" && (
            <>
              <Col span={24}>
                <div>
                  <label className="d-block fw-semibold mb-2 text-dark">
                    Theme
                  </label>
                  <Select
                    value={formData.theme}
                    onChange={(value) => handleInputChange("theme", value)}
                    className="w-100"
                    size="large"
                    placeholder="Select theme..."
                  >
                    <Option value="personal_experience">
                      🌟 Personal Experience
                    </Option>
                    <Option value="school_life">🎓 School Life</Option>
                    <Option value="hobbies_leisure">
                      🎨 Hobbies / Leisure
                    </Option>
                    <Option value="advice_tips">💡 Advice / Tips</Option>
                  </Select>
                </div>
              </Col>

              <Col span={24}>
                <div>
                  <label className="d-block fw-semibold mb-2 text-dark">
                    Key Points
                  </label>
                  <TextArea
                    rows={4}
                    placeholder="List 3–4 points here..."
                    value={formData.points}
                    onChange={(e) =>
                      handleInputChange("points", e.target.value)
                    }
                    className="rounded"
                  />
                </div>
              </Col>
            </>
          )}

          {/* Extended Writing Fields */}
          {formData.essayType === "extended" && (
            <>
              <Col span={24}>
                <div>
                  <label className="d-block fw-semibold mb-2 text-dark">
                    Extended Type
                  </label>
                  <Select
                    value={formData.extendedType}
                    onChange={(value) =>
                      handleInputChange("extendedType", value)
                    }
                    className="w-100"
                    size="large"
                    placeholder="Select type..."
                  >
                    <Option value="review">⭐ Review</Option>
                    <Option value="article">📰 Article</Option>
                    <Option value="report">📊 Report</Option>
                    <Option value="story">📚 Story</Option>
                  </Select>
                </div>
              </Col>

              <Col span={24}>
                <div>
                  <label className="d-block fw-semibold mb-2 text-dark">
                    Topic
                  </label>
                  <Input
                    placeholder="Enter topic"
                    value={formData.topic}
                    onChange={(e) => handleInputChange("topic", e.target.value)}
                    size="large"
                    className="rounded"
                  />
                </div>
              </Col>

              <Col span={24}>
                <div>
                  <label className="d-block fw-semibold mb-2 text-dark">
                    Key Points / Guidelines
                  </label>
                  <TextArea
                    rows={4}
                    placeholder="Add elaboration, evidence or points"
                    value={formData.points}
                    onChange={(e) =>
                      handleInputChange("points", e.target.value)
                    }
                    className="rounded"
                  />
                </div>
              </Col>
            </>
          )}
        </Row>
      </div>

      <div className="p-4 border-top bg-light d-flex justify-content-end">
        <div className="d-flex gap-2">
          <Button size="large" onClick={onClose} className="px-4">
            Cancel
          </Button>
          <Button
            type="primary"
            size="large"
            onClick={handleSubmit}
            className="px-4 fw-semibold"
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
              boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)",
            }}
          >
            ✨ Generate Essay
          </Button>
        </div>
      </div>

      <style jsx>{`
        .essay-modal .ant-modal-content {
          overflow: hidden;
          border-radius: 16px !important;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15) !important;
        }

        .essay-modal .ant-select-selector {
          border-radius: 8px !important;
          transition: all 0.3s ease !important;
        }

        .essay-modal .ant-select-focused .ant-select-selector {
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
        }

        .essay-modal .ant-input {
          border-radius: 8px !important;
          transition: all 0.3s ease !important;
        }

        .essay-modal .ant-input:focus {
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
        }

        .essay-modal label {
          color: #2c3e50 !important;
          font-size: 14px;
        }

        .bg-light {
          background-color: #f8f9fa !important;
        }
      `}</style>
    </Modal>
  );
};

export default EssayModal;
