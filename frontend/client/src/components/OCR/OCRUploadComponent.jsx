import React, { useState, useRef } from "react";
import {
  Upload,
  Button,
  Card,
  Typography,
  Progress,
  Alert,
  Spin,
  Switch,
  Image,
  Space,
  Divider,
} from "antd";
import {
  InboxOutlined,
  EyeOutlined,
  DownloadOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

const OCRUploadComponent = () => {
  const [extractedText, setExtractedText] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [preprocess, setPreprocess] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [processingTime, setProcessingTime] = useState(null);
  const [serviceStatus, setServiceStatus] = useState("unknown");
  const textAreaRef = useRef(null);

  // Enhanced axios configuration with longer timeout
  const apiClient = axios.create({
    timeout: 600000, // 10 minutes
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Check OCR service health on component mount
  React.useEffect(() => {
    checkServiceHealth();
  }, []);

  // Function to check OCR service health
  const checkServiceHealth = async () => {
    try {
      const response = await axios.get("/api/ocr/health", { timeout: 10000 });
      if (response.data.success) {
        setServiceStatus("healthy");
        console.log("✅ OCR service is healthy:", response.data.serviceStatus);
      }
    } catch (err) {
      setServiceStatus("unhealthy");
      console.error("❌ OCR service health check failed:", err.message);
    }
  };

  // Function to convert file to base64
  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Upload configuration for Ant Design
  const uploadProps = {
    name: "image",
    multiple: false,
    accept: "image/*",
    showUploadList: false,
    beforeUpload: async (file) => {
      console.log(`📁 File: ${file.name}`);
      console.log(`📏 Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

      // Validate file type
      const isImage = file.type.startsWith("image/");
      if (!isImage) {
        setError("You can only upload image files!");
        return false;
      }

      // Validate file size (50MB)
      const isLt50M = file.size / 1024 / 1024 < 50;
      if (!isLt50M) {
        setError(
          `Image must be smaller than 50MB! Current size: ${(
            file.size /
            1024 /
            1024
          ).toFixed(2)} MB`
        );
        return false;
      }

      // Check service health before processing
      if (serviceStatus === "unhealthy") {
        setError(
          "OCR service is not available. Please check if the Python service is running."
        );
        return false;
      }

      setError("");
      setSuccess("");
      setLoading(true);
      setProcessingTime(null);

      try {
        // Convert to base64
        const base64Image = await getBase64(file);
        setUploadedImage(base64Image);

        // Extract text
        await extractTextFromImage(base64Image);
      } catch (err) {
        setError("Failed to process image: " + err.message);
        setLoading(false);
      }

      return false; // Prevent default upload
    },
  };

  // Extract text from image using API with enhanced error handling
  const extractTextFromImage = async (imageData) => {
    const startTime = Date.now();

    try {
      console.log("🚀 Starting OCR extraction...");

      const response = await apiClient.post("/api/ocr/extract-text", {
        image: imageData,
        preprocess: preprocess,
      });

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      setProcessingTime(duration);

      if (response.data.success) {
        const data = response.data.data;
        setExtractedText(data.extractedText);
        setConfidence(Math.round(data.confidence * 100));
        setWords(data.words || []);
        setSuccess(`Text extracted successfully in ${duration} seconds!`);

        console.log("✅ OCR Success:", {
          textLength: data.extractedText.length,
          confidence: Math.round(data.confidence * 100),
          processingTime: duration,
        });
      } else {
        throw new Error(response.data.message || "Unknown error");
      }
    } catch (err) {
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      console.error("❌ OCR Error:", err);

      let errorMessage = "Failed to extract text";

      if (err.code === "ECONNABORTED" || err.message.includes("timeout")) {
        errorMessage = `Processing timed out after ${duration}s. Try with a smaller image or enable preprocessing.`;
      } else if (err.response?.status === 503) {
        errorMessage =
          "OCR service is unavailable. Please ensure the Python service is running.";
        setServiceStatus("unhealthy");
      } else if (err.response?.status === 408) {
        errorMessage = "Request timed out. Please try with a smaller image.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
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
    setWords([]);
    setUploadedImage(null);
    setError("");
    setSuccess("");
    setProcessingTime(null);
  };

  // Get confidence color
  const getConfidenceColor = (conf) => {
    if (conf >= 80) return "#52c41a"; // green
    if (conf >= 60) return "#faad14"; // yellow
    return "#ff4d4f"; // red
  };

  // Get service status indicator
  const getServiceStatusIcon = () => {
    switch (serviceStatus) {
      case "healthy":
        return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
      case "unhealthy":
        return <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />;
      default:
        return <ClockCircleOutlined style={{ color: "#faad14" }} />;
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          {/* Header */}
          <div className="mb-4 text-center">
            <Title level={2} className="mb-1">
              AI-Powered Answer Recognition
            </Title>
            <Text type="secondary" className="lead">
              Upload student handwritten answers to extract text using OCR
              technology
            </Text>
          </div>

          {/* Service Status */}
          <Card className="mb-3" size="small">
            <div className="d-flex justify-content-between align-items-center">
              <Space>
                {getServiceStatusIcon()}
                <Text strong>
                  OCR Service Status:{" "}
                  {serviceStatus === "healthy"
                    ? "Online"
                    : serviceStatus === "unhealthy"
                    ? "Offline"
                    : "Checking..."}
                </Text>
                {processingTime && (
                  <Text type="secondary">
                    Last processing time: {processingTime}s
                  </Text>
                )}
              </Space>
              <Button size="small" onClick={checkServiceHealth}>
                Refresh Status
              </Button>
            </div>
          </Card>

          {/* Settings */}
          <Card className="mb-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <Space direction="vertical" size="small">
                  <div>
                    <Text strong>Preprocessing: </Text>
                    <Switch
                      checked={preprocess}
                      onChange={setPreprocess}
                      checkedChildren="ON"
                      unCheckedChildren="OFF"
                      disabled={loading}
                    />
                  </div>
                  <Text type="secondary" className="small">
                    Enable image preprocessing to improve OCR accuracy
                    (recommended for handwritten text)
                  </Text>
                </Space>
              </div>
              {(extractedText || uploadedImage) && (
                <Button onClick={clearAll} type="default" disabled={loading}>
                  Clear All
                </Button>
              )}
            </div>
          </Card>

          {/* Alerts */}
          {error && (
            <Alert
              message="Processing Error"
              description={error}
              type="error"
              closable
              className="mb-3"
              onClose={() => setError("")}
              action={
                serviceStatus === "unhealthy" && (
                  <Button size="small" onClick={checkServiceHealth}>
                    Check Service
                  </Button>
                )
              }
            />
          )}

          {success && (
            <Alert
              message="Success"
              description={success}
              type="success"
              className="mb-3"
              showIcon
            />
          )}

          <div className="row">
            {/* Upload Section */}
            <div className="col-lg-6 mb-4">
              <Card
                title={
                  <div className="d-flex align-items-center">
                    <InboxOutlined className="me-2" />
                    Upload Image
                  </div>
                }
                className="h-100"
              >
                <Dragger
                  {...uploadProps}
                  className="mb-3"
                  disabled={loading || serviceStatus === "unhealthy"}
                >
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">
                    Click or drag image to this area to upload
                  </p>
                  <p className="ant-upload-hint">
                    Support for JPG, PNG, GIF formats. Maximum file size: 50MB
                    <br />
                    {serviceStatus === "unhealthy" && (
                      <Text type="danger">OCR service is offline</Text>
                    )}
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
                  <div className="text-center mt-3">
                    <Spin size="large" />
                    <div className="mt-2">
                      <Text>Processing image with AI...</Text>
                      <br />
                      <Text type="secondary" className="small">
                        This may take 1-5 minutes depending on image complexity
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
                    {/* Confidence Score */}
                    <div className="mb-3">
                      <Text strong>Confidence Score:</Text>
                      <Progress
                        percent={confidence}
                        strokeColor={getConfidenceColor(confidence)}
                        className="mb-2"
                      />
                      <Text type="secondary" className="small">
                        {confidence >= 80
                          ? "High confidence - text should be very accurate"
                          : confidence >= 60
                          ? "Medium confidence - review for accuracy"
                          : "Low confidence - manual review recommended"}
                      </Text>
                    </div>

                    <Divider />

                    {/* Extracted Text */}
                    <div>
                      <Text strong>Extracted Text:</Text>
                      <div
                        className="mt-2 p-3 border rounded"
                        style={{
                          backgroundColor: "#fafafa",
                          minHeight: "200px",
                          maxHeight: "300px",
                          overflowY: "auto",
                        }}
                      >
                        <Paragraph
                          style={{
                            whiteSpace: "pre-wrap",
                            marginBottom: 0,
                            fontSize: "14px",
                            lineHeight: "1.6",
                          }}
                        >
                          {extractedText || "No text extracted"}
                        </Paragraph>
                      </div>
                    </div>

                    {/* Word Details */}
                    {words.length > 0 && (
                      <div className="mt-3">
                        <Text strong>Detected Words ({words.length}):</Text>
                        <div
                          className="mt-2 p-2 border rounded"
                          style={{
                            backgroundColor: "#f6ffed",
                            maxHeight: "150px",
                            overflowY: "auto",
                          }}
                        >
                          {words.map((word, index) => (
                            <span
                              key={index}
                              className="badge me-1 mb-1"
                              style={{
                                backgroundColor: getConfidenceColor(
                                  word.confidence * 100
                                ),
                                fontSize: "11px",
                              }}
                              title={`Confidence: ${Math.round(
                                word.confidence * 100
                              )}%`}
                            >
                              {word.text}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className="d-flex align-items-center justify-content-center text-muted"
                    style={{ minHeight: "200px" }}
                  >
                    <div className="text-center">
                      <EyeOutlined
                        style={{ fontSize: "48px", marginBottom: "16px" }}
                      />
                      <div>
                        {serviceStatus === "unhealthy"
                          ? "OCR service is offline. Please start the Python service."
                          : "Upload an image to extract text"}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>

          {/* Instructions */}
          <Card title="Instructions & Troubleshooting" className="mt-4">
            <div className="row">
              <div className="col-md-6">
                <Title level={5}>Tips for Better OCR Results:</Title>
                <ul>
                  <li>Use high-resolution images (at least 300 DPI)</li>
                  <li>Ensure good lighting and contrast</li>
                  <li>Keep text horizontal and properly oriented</li>
                  <li>Avoid shadows and glare on the paper</li>
                  <li>Use clear, legible handwriting</li>
                  <li>Enable preprocessing for handwritten text</li>
                </ul>
              </div>
              <div className="col-md-6">
                <Title level={5}>Troubleshooting:</Title>
                <ul>
                  <li>
                    <strong>Service Offline:</strong> Start Python service with{" "}
                    <code>python ocr_service_qwen.py</code>
                  </li>
                  <li>
                    <strong>Timeout:</strong> Try smaller images or enable
                    preprocessing
                  </li>
                  <li>
                    <strong>Low Confidence:</strong> Improve image quality and
                    lighting
                  </li>
                  <li>
                    <strong>No Text Found:</strong> Ensure text is clearly
                    visible and not too small
                  </li>
                  <li>
                    <strong>Processing Slow:</strong> Normal for first request
                    (model loading)
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OCRUploadComponent;
