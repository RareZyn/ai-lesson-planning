import React, { useState } from "react";
import {
  Upload,
  Button,
  Card,
  Typography,
  Progress,
  Alert,
  Spin,
  Image,
  Space,
  Divider,
  Tag,
  Statistic,
  Row,
  Col,
} from "antd";
import {
  InboxOutlined,
  EyeOutlined,
  DownloadOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import "bootstrap/dist/css/bootstrap.min.css";
import { ocrAPI, ocrUtils } from "../../services/ocrService";

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

const OCRUploadComponent = () => {
  const [extractedText, setExtractedText] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Upload configuration
  const uploadProps = {
    name: "image",
    multiple: false,
    accept: "image/*",
    showUploadList: false,
    beforeUpload: async (file) => {
      console.log(
        `📁 File: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`
      );

      // Validate file
      const validation = ocrAPI.validateImage(file);

      if (!validation.isValid) {
        setError(validation.errors.join(". "));
        return false;
      }

      if (validation.warnings.length > 0) {
        console.warn("⚠️ Warnings:", validation.warnings);
      }

      // Reset state
      setError("");
      setSuccess("");
      setLoading(true);

      try {
        // Convert to base64 and display preview
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          setUploadedImage(reader.result);
        };

        // Extract text using Gemini
        const result = await ocrAPI.extractText(file, true);

        if (result.success) {
          setExtractedText(result.data.extractedText);
          setConfidence(result.data.confidence);
          setMetadata(result.data.metadata);
          setSuccess(result.message || "Text extracted successfully!");
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError("Failed to process image: " + err.message);
      } finally {
        setLoading(false);
      }

      return false; // Prevent default upload
    },
  };

  // Copy text to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(extractedText).then(() => {
      setSuccess("Text copied to clipboard!");
      setTimeout(() => setSuccess(""), 2000);
    });
  };

  // Download text as file
  const downloadText = () => {
    const element = document.createElement("a");
    const file = new Blob([extractedText], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `extracted-text-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    setSuccess("File downloaded successfully!");
    setTimeout(() => setSuccess(""), 2000);
  };

  // Clear all data
  const clearAll = () => {
    setExtractedText("");
    setConfidence(0);
    setMetadata(null);
    setUploadedImage(null);
    setError("");
    setSuccess("");
  };

  // Get confidence display info
  const confidenceInfo = ocrUtils.getConfidenceColor(confidence);

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          {/* Header */}
          <div className="mb-4 text-center">
            <Title level={2} className="mb-1">
              <ThunderboltOutlined
                className="me-2"
                style={{ color: "#1890ff" }}
              />
              AI-Powered Handwriting Recognition
            </Title>
            <Text type="secondary" className="lead">
              Powered by Google Gemini Vision AI - Extract text from handwritten
              student answers
            </Text>
          </div>

          {/* Alerts */}
          {error && (
            <Alert
              message="Processing Error"
              description={error}
              type="error"
              closable
              className="mb-3"
              onClose={() => setError("")}
              showIcon
            />
          )}

          {success && (
            <Alert
              message="Success"
              description={success}
              type="success"
              className="mb-3"
              showIcon
              closable
              onClose={() => setSuccess("")}
            />
          )}

          <div className="row">
            {/* Upload Section */}
            <div className="col-lg-6 mb-4">
              <Card
                title={
                  <div className="d-flex align-items-center justify-content-between">
                    <span>
                      <InboxOutlined className="me-2" />
                      Upload Student Answer
                    </span>
                    {uploadedImage && (
                      <Button
                        size="small"
                        onClick={clearAll}
                        disabled={loading}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                }
                className="h-100"
              >
                <Dragger {...uploadProps} className="mb-3" disabled={loading}>
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">
                    Click or drag image to upload
                  </p>
                  <p className="ant-upload-hint">
                    Supports JPG, PNG formats. Max 50MB.
                    <br />
                    <Text type="secondary" className="small">
                      Large images will be automatically compressed
                    </Text>
                  </p>
                </Dragger>

                {uploadedImage && (
                  <div className="mt-3">
                    <Text strong>Uploaded Image:</Text>
                    <div className="mt-2">
                      <Image
                        width="100%"
                        height={200}
                        style={{
                          objectFit: "cover",
                          border: "1px solid #d9d9d9",
                          borderRadius: "8px",
                        }}
                        src={uploadedImage}
                        preview={{
                          mask: (
                            <div>
                              <EyeOutlined /> View Full Image
                            </div>
                          ),
                        }}
                      />
                    </div>
                  </div>
                )}

                {loading && (
                  <div className="text-center mt-4">
                    <Spin size="large" />
                    <div className="mt-3">
                      <Text>Processing with Gemini AI...</Text>
                      <br />
                      <Text type="secondary" className="small">
                        This may take 10-30 seconds depending on image
                        complexity
                      </Text>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* Results Section */}
            <div className="col-lg-6">
              <Card
                title={
                  <div className="d-flex align-items-center justify-content-between">
                    <span>
                      <EyeOutlined className="me-2" />
                      Extracted Text
                    </span>
                    {extractedText && (
                      <Space>
                        <Button
                          size="small"
                          icon={<CopyOutlined />}
                          onClick={copyToClipboard}
                          type="primary"
                          ghost
                        >
                          Copy
                        </Button>
                        <Button
                          size="small"
                          icon={<DownloadOutlined />}
                          onClick={downloadText}
                          type="primary"
                          ghost
                        >
                          Download
                        </Button>
                      </Space>
                    )}
                  </div>
                }
                className="h-100"
              >
                {extractedText ? (
                  <div>
                    {/* Statistics */}
                    <Row gutter={16} className="mb-3">
                      <Col span={8}>
                        <Card size="small" style={{ textAlign: "center" }}>
                          <Statistic
                            title="Confidence"
                            value={Math.round(confidence * 100)}
                            suffix="%"
                            valueStyle={{ color: confidenceInfo.color }}
                            prefix={
                              confidence >= 0.8 ? (
                                <CheckCircleOutlined />
                              ) : (
                                <ExclamationCircleOutlined />
                              )
                            }
                          />
                          <Tag color={confidenceInfo.color} className="mt-2">
                            {confidenceInfo.label}
                          </Tag>
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card size="small" style={{ textAlign: "center" }}>
                          <Statistic
                            title="Characters"
                            value={extractedText.length}
                            valueStyle={{ color: "#1890ff" }}
                          />
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card size="small" style={{ textAlign: "center" }}>
                          <Statistic
                            title="Words"
                            value={
                              extractedText.split(/\s+/).filter(Boolean).length
                            }
                            valueStyle={{ color: "#52c41a" }}
                          />
                        </Card>
                      </Col>
                    </Row>

                    <Divider />

                    {/* Metadata */}
                    {metadata && (
                      <div className="mb-3">
                        <Space wrap>
                          {metadata.language && (
                            <Tag color="blue">
                              Language: {metadata.language}
                            </Tag>
                          )}
                          {metadata.textType && (
                            <Tag color="purple">Type: {metadata.textType}</Tag>
                          )}
                          {metadata.legibility && (
                            <Tag
                              color={
                                metadata.legibility === "high"
                                  ? "green"
                                  : metadata.legibility === "medium"
                                  ? "orange"
                                  : "red"
                              }
                            >
                              Legibility: {metadata.legibility}
                            </Tag>
                          )}
                          {metadata.processingTime && (
                            <Tag color="cyan">
                              Time: {metadata.processingTime}
                            </Tag>
                          )}
                        </Space>
                        {metadata.notes && (
                          <Alert
                            message={metadata.notes}
                            type="info"
                            className="mt-2"
                            showIcon
                            closable
                          />
                        )}
                      </div>
                    )}

                    {/* Extracted Text Display */}
                    <div>
                      <Text strong>Extracted Text:</Text>
                      <div
                        className="mt-2 p-3 border rounded"
                        style={{
                          backgroundColor: "#fafafa",
                          minHeight: "200px",
                          maxHeight: "400px",
                          overflowY: "auto",
                        }}
                      >
                        <Paragraph
                          style={{
                            whiteSpace: "pre-wrap",
                            marginBottom: 0,
                            fontSize: "14px",
                            lineHeight: "1.8",
                            fontFamily: "'Courier New', monospace",
                          }}
                        >
                          {extractedText}
                        </Paragraph>
                      </div>
                    </div>

                    {/* Confidence Guide */}
                    {confidence < 0.8 && (
                      <Alert
                        message="Tips for Better Results"
                        description={
                          <ul className="mb-0 ps-3">
                            <li>Ensure good lighting without shadows</li>
                            <li>Keep text horizontal and properly oriented</li>
                            <li>Use higher resolution images if possible</li>
                            <li>Avoid blur or motion in the photo</li>
                          </ul>
                        }
                        type="warning"
                        className="mt-3"
                        showIcon
                        closable
                      />
                    )}
                  </div>
                ) : (
                  <div
                    className="d-flex align-items-center justify-content-center text-muted"
                    style={{ minHeight: "300px" }}
                  >
                    <div className="text-center">
                      <ThunderboltOutlined
                        style={{
                          fontSize: "64px",
                          marginBottom: "16px",
                          opacity: 0.3,
                        }}
                      />
                      <div>
                        <Text type="secondary">
                          Upload a handwritten answer to extract text
                        </Text>
                        <br />
                        <Text type="secondary" className="small">
                          Powered by Google Gemini Vision AI
                        </Text>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>

          {/* Instructions & Best Practices */}
          <Card
            title="Best Practices for Handwriting Recognition"
            className="mt-4"
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Title level={5}>
                  <CheckCircleOutlined
                    className="me-2"
                    style={{ color: "#52c41a" }}
                  />
                  Do's
                </Title>
                <ul>
                  <li>Use well-lit, clear photos without shadows</li>
                  <li>Keep the camera steady to avoid blur</li>
                  <li>Capture text straight-on (not at an angle)</li>
                  <li>Ensure handwriting is legible and not too small</li>
                  <li>Use high contrast (dark ink on white paper)</li>
                  <li>Include entire answer in frame</li>
                </ul>
              </Col>
              <Col xs={24} md={12}>
                <Title level={5}>
                  <ExclamationCircleOutlined
                    className="me-2"
                    style={{ color: "#ff4d4f" }}
                  />
                  Don'ts
                </Title>
                <ul>
                  <li>Avoid dim lighting or harsh shadows</li>
                  <li>Don't upload blurry or out-of-focus images</li>
                  <li>Avoid extreme angles or distorted perspectives</li>
                  <li>Don't use images with excessive background noise</li>
                  <li>Avoid low-resolution or heavily compressed images</li>
                  <li>Don't crop text too tightly</li>
                </ul>
              </Col>
            </Row>

            <Divider />

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Title level={5}>Understanding Confidence Scores</Title>
                <Space direction="vertical" className="w-100">
                  <div>
                    <Tag color="green">High (80-100%)</Tag>
                    <Text>Excellent quality - text is highly accurate</Text>
                  </div>
                  <div>
                    <Tag color="orange">Medium (60-79%)</Tag>
                    <Text>Good quality - minor review recommended</Text>
                  </div>
                  <div>
                    <Tag color="red">Low (&lt;60%)</Tag>
                    <Text>Manual review required - verify accuracy</Text>
                  </div>
                </Space>
              </Col>
              <Col xs={24} md={12}>
                <Title level={5}>Supported Features</Title>
                <ul>
                  <li>English and Malay handwritten text</li>
                  <li>Mixed handwritten and printed text</li>
                  <li>Mathematical expressions and symbols</li>
                  <li>Various handwriting styles</li>
                  <li>Automatic image compression for large files</li>
                  <li>Real-time processing with AI</li>
                </ul>
              </Col>
            </Row>
          </Card>
        </div>
      </div>
    </div>
  );
};
export default OCRUploadComponent;