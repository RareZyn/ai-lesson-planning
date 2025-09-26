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
} from "antd";
import {
  InboxOutlined,
  EyeOutlined,
  DownloadOutlined,
  CopyOutlined,
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
  const textAreaRef = useRef(null);

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
      console.log(`File size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

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

      setError("");
      setSuccess("");
      setLoading(true);

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

  // Extract text from image using API
  const extractTextFromImage = async (imageData) => {
    try {
      const response = await axios.post("/api/ocr/extract-text", {
        image: imageData,
        preprocess: preprocess,
      });

      if (response.data.success) {
        const data = response.data.data;
        setExtractedText(data.extractedText);
        setConfidence(Math.round(data.confidence * 100));
        setWords(data.words || []);
        setSuccess("Text extracted successfully!");
      } else {
        setError("Failed to extract text: " + response.data.message);
      }
    } catch (err) {
      setError(
        "Error extracting text: " + (err.response?.data?.message || err.message)
      );
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
    element.download = "extracted-text.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Clear all data
  const clearAll = () => {
    setExtractedText("");
    setConfidence(0);
    setWords([]);
    setUploadedImage(null);
    setError("");
    setSuccess("");
  };

  // Get confidence color
  const getConfidenceColor = (conf) => {
    if (conf >= 80) return "#52c41a"; // green
    if (conf >= 60) return "#faad14"; // yellow
    return "#ff4d4f"; // red
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

          {/* Settings */}
          <Card className="mb-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <Text strong>Preprocessing: </Text>
                <Switch
                  checked={preprocess}
                  onChange={setPreprocess}
                  checkedChildren="ON"
                  unCheckedChildren="OFF"
                />
                <br />
                <Text type="secondary" className="small">
                  Enable image preprocessing to improve OCR accuracy
                </Text>
              </div>
              {(extractedText || uploadedImage) && (
                <Button onClick={clearAll} type="default">
                  Clear All
                </Button>
              )}
            </div>
          </Card>

          {/* Alerts */}
          {error && (
            <Alert
              message="Error"
              description={error}
              type="error"
              closable
              className="mb-3"
              onClose={() => setError("")}
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
                <Dragger {...uploadProps} className="mb-3">
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">
                    Click or drag image to this area to upload
                  </p>
                  <p className="ant-upload-hint">
                    Support for JPG, PNG, GIF formats. Maximum file size: 50MB
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
                      <Text>Processing image...</Text>
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
                      <div>
                        <Button
                          size="small"
                          icon={<CopyOutlined />}
                          onClick={copyToClipboard}
                          className="me-2"
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
                      </div>
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
                          ? "High confidence"
                          : confidence >= 60
                          ? "Medium confidence"
                          : "Low confidence"}
                      </Text>
                    </div>

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
                      <div>Upload an image to extract text</div>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>

          {/* Instructions */}
          <Card title="Instructions" className="mt-4">
            <div className="row">
              <div className="col-md-6">
                <Title level={5}>Tips for Better OCR Results:</Title>
                <ul>
                  <li>Use high-resolution images (at least 300 DPI)</li>
                  <li>Ensure good lighting and contrast</li>
                  <li>Keep text horizontal and properly oriented</li>
                  <li>Avoid shadows and glare on the paper</li>
                  <li>Use clear, legible handwriting</li>
                </ul>
              </div>
              <div className="col-md-6">
                <Title level={5}>Supported Features:</Title>
                <ul>
                  <li>English and Malay language detection</li>
                  <li>Handwritten and printed text recognition</li>
                  <li>Automatic image preprocessing</li>
                  <li>Confidence scoring for accuracy assessment</li>
                  <li>Word-level detection and bounding boxes</li>
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
