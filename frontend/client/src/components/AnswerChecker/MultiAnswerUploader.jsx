// frontend/client/src/components/AnswerChecker/MultiAnswerUploader.jsx
import React, { useState, useCallback } from "react";
import { Card, Button, Alert, ProgressBar, Badge, Table } from "react-bootstrap";
import { Upload, message, Spin, Input, Tooltip } from "antd";
import {
  InboxOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  EditOutlined,
  SaveOutlined,
  ReloadOutlined,
  SendOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { ocrAPI, ocrUtils } from "../../services/ocrService";

const { Dragger } = Upload;

const MultiAnswerUploader = ({
  assessmentId,
  expectedQuestionCount,
  onExtractComplete,
  onSubmit,
  disabled = false,
}) => {
  // Upload state
  const [uploadedFile, setUploadedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [base64Image, setBase64Image] = useState(null);

  // Extraction state
  const [extracting, setExtracting] = useState(false);
  const [extractedAnswers, setExtractedAnswers] = useState([]);
  const [extractionMetadata, setExtractionMetadata] = useState(null);
  const [validationResult, setValidationResult] = useState(null);

  // Edit state
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState("");

  // UI state
  const [error, setError] = useState("");

  const processFile = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = () => {
        resolve(reader.result);
      };

      reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
    });
  }, []);

  const handleFileChange = async (info) => {
    setError("");
    const file = info.file.originFileObj || info.file;

    if (!file) return;

    // Validate file type
    const isImage = file.type?.startsWith("image/");
    const isPdf = file.type === "application/pdf";

    if (!isImage && !isPdf) {
      setError("Only image files (JPG, PNG) and PDFs are supported.");
      return;
    }

    // Validate file size
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > 50) {
      setError("File size exceeds 50MB limit.");
      return;
    }

    try {
      const base64 = await processFile(file);
      setUploadedFile(file);
      setBase64Image(base64);

      // Set preview for images
      if (isImage) {
        setImagePreview(base64);
      } else {
        setImagePreview(null); // No preview for PDFs
      }

      // Clear previous extraction results
      setExtractedAnswers([]);
      setExtractionMetadata(null);
      setValidationResult(null);
    } catch (err) {
      setError("Failed to process file: " + err.message);
    }
  };

  const handleExtract = async () => {
    if (!base64Image) {
      setError("Please upload an image first.");
      return;
    }

    setExtracting(true);
    setError("");

    try {
      const result = await ocrAPI.extractMultiAnswers(base64Image, {
        assessmentId,
        expectedQuestionCount,
      });

      if (result.success) {
        setExtractedAnswers(result.data.answers || []);
        setExtractionMetadata(result.data.metadata || {});
        setValidationResult(result.data.validation || null);

        if (onExtractComplete) {
          onExtractComplete(result.data);
        }

        message.success(`Extracted ${result.data.totalDetected} answers successfully!`);
      } else {
        setError(result.message || "Failed to extract answers");
      }
    } catch (err) {
      setError("Extraction failed: " + err.message);
    } finally {
      setExtracting(false);
    }
  };

  const handleStartEdit = (index) => {
    setEditingIndex(index);
    setEditValue(extractedAnswers[index].answerText);
  };

  const handleSaveEdit = (index) => {
    const updatedAnswers = [...extractedAnswers];
    updatedAnswers[index] = {
      ...updatedAnswers[index],
      answerText: editValue,
      isEdited: true,
      confidence: 1.0, // Manual edit = 100% confidence
    };
    setExtractedAnswers(updatedAnswers);
    setEditingIndex(null);
    setEditValue("");
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditValue("");
  };

  const handleDeleteAnswer = (index) => {
    const updatedAnswers = extractedAnswers.filter((_, i) => i !== index);
    setExtractedAnswers(updatedAnswers);
  };

  const handleSubmitAnswers = () => {
    if (extractedAnswers.length === 0) {
      setError("No answers to submit. Please extract answers first.");
      return;
    }

    if (onSubmit) {
      onSubmit({
        answers: extractedAnswers,
        metadata: extractionMetadata,
        originalImage: base64Image,
      });
    }
  };

  const handleClear = () => {
    setUploadedFile(null);
    setImagePreview(null);
    setBase64Image(null);
    setExtractedAnswers([]);
    setExtractionMetadata(null);
    setValidationResult(null);
    setError("");
  };

  const getConfidenceBadge = (confidence) => {
    const { color } = ocrUtils.getConfidenceColor(confidence);
    return (
      <Badge
        style={{ backgroundColor: color }}
        className="ms-2"
      >
        {(confidence * 100).toFixed(0)}%
      </Badge>
    );
  };

  const uploadProps = {
    name: "file",
    multiple: false,
    accept: "image/*,application/pdf",
    showUploadList: false,
    beforeUpload: () => false,
    onChange: handleFileChange,
    disabled: disabled || extracting,
  };

  return (
    <Card className="mb-4">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="mb-1">
              Multi-Answer Image Upload
              {extractedAnswers.length > 0 && (
                <Badge bg="success" className="ms-2">
                  {extractedAnswers.length} answers detected
                </Badge>
              )}
            </h5>
            <small className="text-muted">
              Upload one image containing all numbered student answers
            </small>
          </div>
          {(uploadedFile || extractedAnswers.length > 0) && (
            <Button
              variant="outline-danger"
              size="sm"
              onClick={handleClear}
              disabled={disabled || extracting}
            >
              <DeleteOutlined className="me-1" />
              Clear
            </Button>
          )}
        </div>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError("")}>
            <WarningOutlined className="me-2" />
            {error}
          </Alert>
        )}

        {/* Upload Area */}
        {!uploadedFile && (
          <Dragger {...uploadProps}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ fontSize: "48px", color: "#1890ff" }} />
            </p>
            <p className="ant-upload-text">
              Click or drag image here
            </p>
            <p className="ant-upload-hint">
              Upload an image containing numbered answers
              <br />
              <small className="text-muted">
                Example: 1) False  2) Making new friends  3) True...
              </small>
            </p>
          </Dragger>
        )}

        {/* File Preview & Extract Button */}
        {uploadedFile && extractedAnswers.length === 0 && (
          <div className="mt-3">
            <Alert variant="info">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <CheckCircleOutlined className="me-2" />
                  <strong>{uploadedFile.name}</strong>
                  <span className="text-muted ms-2">
                    ({(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
              </div>
            </Alert>

            {imagePreview && (
              <div className="text-center my-3">
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "300px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                  }}
                />
              </div>
            )}

            <div className="d-flex justify-content-center gap-3 mt-3">
              <Button
                variant="primary"
                size="lg"
                onClick={handleExtract}
                disabled={extracting}
              >
                {extracting ? (
                  <>
                    <Spin size="small" className="me-2" />
                    Extracting Answers...
                  </>
                ) : (
                  <>
                    <SendOutlined className="me-2" />
                    Extract Answers
                  </>
                )}
              </Button>
            </div>

            {extracting && (
              <div className="mt-3">
                <ProgressBar animated now={100} />
                <p className="text-center text-muted mt-2">
                  AI is analyzing the image and extracting answers...
                </p>
              </div>
            )}
          </div>
        )}

        {/* Extracted Answers Table */}
        {extractedAnswers.length > 0 && (
          <div className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">
                Extracted Answers
                <Badge bg="info" className="ms-2">
                  {extractedAnswers.length} found
                </Badge>
              </h6>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={handleExtract}
                disabled={extracting}
              >
                <ReloadOutlined className="me-1" />
                Re-extract
              </Button>
            </div>

            {/* Validation Warnings */}
            {validationResult && validationResult.warnings?.length > 0 && (
              <Alert variant="warning" className="mb-3">
                <WarningOutlined className="me-2" />
                <strong>Warnings:</strong>
                <ul className="mb-0 mt-2">
                  {validationResult.warnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </Alert>
            )}

            {/* Metadata */}
            {extractionMetadata && (
              <div className="mb-3">
                <small className="text-muted">
                  <strong>Text Type:</strong> {extractionMetadata.textType || "unknown"} |{" "}
                  <strong>Legibility:</strong> {extractionMetadata.overallLegibility || "unknown"} |{" "}
                  <strong>Processing Time:</strong> {extractionMetadata.processingTime || "N/A"}
                </small>
              </div>
            )}

            {/* Answers Table */}
            <Table striped bordered hover responsive size="sm">
              <thead>
                <tr>
                  <th style={{ width: "60px" }}>#</th>
                  <th>Answer</th>
                  <th style={{ width: "100px" }}>Confidence</th>
                  <th style={{ width: "100px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {extractedAnswers.map((answer, index) => (
                  <tr key={index}>
                    <td className="text-center fw-bold">
                      {answer.questionNumber}
                    </td>
                    <td>
                      {editingIndex === index ? (
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onPressEnter={() => handleSaveEdit(index)}
                          autoFocus
                        />
                      ) : (
                        <span>
                          {answer.answerText}
                          {answer.isEdited && (
                            <Badge bg="secondary" className="ms-2">edited</Badge>
                          )}
                        </span>
                      )}
                    </td>
                    <td className="text-center">
                      {getConfidenceBadge(answer.confidence)}
                    </td>
                    <td className="text-center">
                      {editingIndex === index ? (
                        <>
                          <Tooltip title="Save">
                            <Button
                              variant="success"
                              size="sm"
                              className="me-1"
                              onClick={() => handleSaveEdit(index)}
                            >
                              <SaveOutlined />
                            </Button>
                          </Tooltip>
                          <Tooltip title="Cancel">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={handleCancelEdit}
                            >
                              X
                            </Button>
                          </Tooltip>
                        </>
                      ) : (
                        <>
                          <Tooltip title="Edit">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-1"
                              onClick={() => handleStartEdit(index)}
                            >
                              <EditOutlined />
                            </Button>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeleteAnswer(index)}
                            >
                              <DeleteOutlined />
                            </Button>
                          </Tooltip>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            {/* Submit Button */}
            <div className="d-flex justify-content-end mt-3">
              <Button
                variant="success"
                size="lg"
                onClick={handleSubmitAnswers}
                disabled={disabled || extractedAnswers.length === 0}
              >
                <CheckCircleOutlined className="me-2" />
                Submit {extractedAnswers.length} Answers for Grading
              </Button>
            </div>
          </div>
        )}

        {/* Tips */}
        {!uploadedFile && !extracting && extractedAnswers.length === 0 && (
          <div className="mt-3">
            <small className="text-muted">
              <strong>Tips for best results:</strong>
              <ul className="mb-0 ps-3 mt-1">
                <li>Write answers in a clear numbered format (1, 2, 3...)</li>
                <li>Ensure good lighting and legible handwriting</li>
                <li>Number formats supported: 1), 1., 1:, (1), Q1</li>
                <li>You can edit any incorrectly detected answers before submitting</li>
              </ul>
            </small>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default MultiAnswerUploader;
