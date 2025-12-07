// frontend/client/src/components/AnswerChecker/SpmAnswerSheetUploader.jsx
import React, { useState } from "react";
import { Card, Button, Alert, ProgressBar, Modal, Table, Badge } from "react-bootstrap";
import { Upload, Image as AntImage } from "antd";
import {
  InboxOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { gradingService } from "../../services/gradingServiceClient";

const { Dragger } = Upload;

const SpmAnswerSheetUploader = ({
  assessmentId,
  classId,
  studentId,
  studentName,
  onUploadComplete,
  disabled = false,
}) => {
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [fileInfo, setFileInfo] = useState(null);
  const [results, setResults] = useState(null);
  const [showResultsModal, setShowResultsModal] = useState(false);

  const handleUpload = async (file) => {
    setError("");
    setUploading(true);

    try {
      // Validate image
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        setError("Invalid file type. Only JPG and PNG are supported.");
        setUploading(false);
        return false;
      }

      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        setError("File size exceeds 50MB limit");
        setUploading(false);
        return false;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = async () => {
        const base64Image = reader.result;

        // Check if compression needed
        const sizeInMB = (base64Image.length * 0.75) / (1024 * 1024);

        if (sizeInMB > 10) {
          console.log(`📦 Compressing image (${sizeInMB.toFixed(2)} MB)...`);

          // Simple compression using canvas
          const img = new window.Image();
          img.src = base64Image;

          img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            // Calculate dimensions
            const MAX_WIDTH = 3000;
            const MAX_HEIGHT = 3000;

            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            // Compress
            const compressedBase64 = canvas.toDataURL("image/jpeg", 0.9);
            const newSize = (compressedBase64.length * 0.75) / (1024 * 1024);

            console.log(`✅ Compressed to ${newSize.toFixed(2)} MB`);

            setImage(compressedBase64);
            setFileInfo({
              name: file.name,
              size: file.size,
              type: file.type,
              compressedSize: compressedBase64.length * 0.75,
            });

            setUploading(false);
          };
        } else {
          setImage(base64Image);
          setFileInfo({
            name: file.name,
            size: file.size,
            type: file.type,
          });

          setUploading(false);
        }
      };

      reader.onerror = () => {
        setError("Failed to read file");
        setUploading(false);
      };
    } catch (err) {
      setError("Error uploading image: " + err.message);
      setUploading(false);
    }

    return false; // Prevent default upload behavior
  };

  const handleRemove = () => {
    setImage(null);
    setFileInfo(null);
    setError("");
    setResults(null);
  };

  const handleProcessAndGrade = async () => {
    if (!image) {
      setError("Please upload an answer sheet first");
      return;
    }

    if (!assessmentId || !classId || !studentId) {
      setError("Missing required information (assessment, class, or student)");
      return;
    }

    setProcessing(true);
    setError("");

    try {
      console.log("🚀 Processing SPM answer sheet...");
      const result = await gradingService.processAndGradeSpmAnswerSheet(
        image,
        assessmentId,
        classId,
        studentId
      );

      if (result.success) {
        console.log("✅ Processing completed successfully");
        setResults(result.data);
        setShowResultsModal(true);

        // Call callback if provided
        if (onUploadComplete) {
          onUploadComplete(result.data);
        }
      } else {
        setError(result.message || "Failed to process answer sheet");
      }
    } catch (err) {
      console.error("❌ Processing error:", err);
      setError("An error occurred while processing the answer sheet");
    } finally {
      setProcessing(false);
    }
  };

  const uploadProps = {
    name: "file",
    multiple: false,
    accept: "image/*",
    showUploadList: false,
    beforeUpload: handleUpload,
    disabled: disabled || uploading || processing,
  };

  return (
    <>
      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="mb-1">
                <FileTextOutlined className="me-2" />
                SPM Paper 1 Answer Sheet
              </h5>
              <small className="text-muted">
                Upload a single answer sheet image containing all 40 MCQ answers
              </small>
              {studentName && (
                <div className="mt-1">
                  <Badge bg="info">Student: {studentName}</Badge>
                </div>
              )}
            </div>
            {image && (
              <Button
                variant="outline-danger"
                size="sm"
                onClick={handleRemove}
                disabled={disabled || processing}
              >
                <DeleteOutlined className="me-1" />
                Remove
              </Button>
            )}
          </div>

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError("")}>
              <WarningOutlined className="me-2" />
              {error}
            </Alert>
          )}

          {!image ? (
            <div>
              <Dragger {...uploadProps} style={{ padding: "30px" }}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined style={{ fontSize: "64px", color: "#1890ff" }} />
                </p>
                <p className="ant-upload-text" style={{ fontSize: "16px" }}>
                  Click or drag answer sheet to upload
                </p>
                <p className="ant-upload-hint">
                  Supports: JPG, PNG (Max 50MB)
                  <br />
                  <small className="text-muted">
                    Ensure the entire answer sheet is visible and well-lit
                  </small>
                </p>
              </Dragger>

              {uploading && (
                <div className="mt-3">
                  <ProgressBar animated now={100} label="Processing..." />
                  <small className="text-muted d-block text-center mt-2">
                    Preparing image...
                  </small>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="position-relative">
                <AntImage
                  src={image}
                  alt="SPM Answer Sheet"
                  style={{
                    width: "100%",
                    maxHeight: "500px",
                    objectFit: "contain",
                    borderRadius: "8px",
                    border: "2px solid #52c41a",
                  }}
                  preview={{
                    mask: (
                      <div>
                        <EyeOutlined /> View Full Image
                      </div>
                    ),
                  }}
                />
              </div>

              {fileInfo && (
                <div className="mt-3">
                  <Alert variant="success" className="mb-0">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <CheckCircleOutlined className="me-2" />
                        <strong>{fileInfo.name}</strong>
                      </div>
                      <div className="text-end">
                        <small className="text-muted">
                          {fileInfo.compressedSize
                            ? `Compressed: ${(fileInfo.compressedSize / (1024 * 1024)).toFixed(2)} MB`
                            : `Size: ${(fileInfo.size / (1024 * 1024)).toFixed(2)} MB`}
                        </small>
                      </div>
                    </div>
                  </Alert>
                </div>
              )}

              <div className="mt-3 d-flex gap-2">
                <Button
                  variant="primary"
                  size="lg"
                  className="flex-grow-1"
                  onClick={handleProcessAndGrade}
                  disabled={processing || disabled}
                >
                  {processing ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Processing & Grading...
                    </>
                  ) : (
                    <>
                      <CheckCircleOutlined className="me-2" />
                      Process & Grade Answer Sheet
                    </>
                  )}
                </Button>
              </div>

              {processing && (
                <div className="mt-3">
                  <Alert variant="info">
                    <div className="d-flex align-items-center">
                      <span className="spinner-border spinner-border-sm me-3" />
                      <div>
                        <strong>Processing in progress...</strong>
                        <br />
                        <small>
                          Detecting filled bubbles and grading answers. This may take 15-30 seconds.
                        </small>
                      </div>
                    </div>
                  </Alert>
                </div>
              )}
            </div>
          )}

          {/* Upload Tips */}
          {!image && !uploading && (
            <div className="mt-4">
              <Alert variant="info">
                <strong>Tips for best results:</strong>
                <ul className="mb-0 ps-3 mt-2">
                  <li>Ensure the entire answer sheet fits in the frame</li>
                  <li>Use good lighting without shadows or glare</li>
                  <li>Keep the sheet flat and properly oriented</li>
                  <li>Avoid blur - hold camera steady</li>
                  <li>Make sure filled bubbles are clearly visible</li>
                </ul>
              </Alert>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Results Modal */}
      <Modal
        show={showResultsModal}
        onHide={() => setShowResultsModal(false)}
        size="xl"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <CheckCircleOutlined className="me-2" style={{ color: "#52c41a" }} />
            Answer Sheet Processed Successfully
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {results && (
            <div>
              {/* Summary Card */}
              <Card className="mb-4" style={{ borderLeft: "4px solid #52c41a" }}>
                <Card.Body>
                  <h5>Overall Results</h5>
                  <Table bordered className="mb-0">
                    <tbody>
                      <tr>
                        <td><strong>Total Score:</strong></td>
                        <td>
                          <h4 className="mb-0">
                            <Badge bg="primary">
                              {results.gradingResults.summary.totalScore}/
                              {results.gradingResults.summary.maxPossibleScore}
                            </Badge>
                          </h4>
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Percentage:</strong></td>
                        <td><h5 className="mb-0">{results.gradingResults.summary.percentage}%</h5></td>
                      </tr>
                      <tr>
                        <td><strong>Grade:</strong></td>
                        <td><h5 className="mb-0"><Badge bg="success">{results.gradingResults.summary.grade}</Badge></h5></td>
                      </tr>
                      <tr>
                        <td><strong>Correct Answers:</strong></td>
                        <td className="text-success">{results.gradingResults.summary.correctAnswers}</td>
                      </tr>
                      <tr>
                        <td><strong>Incorrect Answers:</strong></td>
                        <td className="text-danger">{results.gradingResults.summary.incorrectAnswers}</td>
                      </tr>
                      <tr>
                        <td><strong>Blank Answers:</strong></td>
                        <td className="text-warning">{results.gradingResults.summary.blankAnswers}</td>
                      </tr>
                      <tr>
                        <td><strong>Ambiguous (Multiple):</strong></td>
                        <td className="text-muted">{results.gradingResults.summary.ambiguousAnswers}</td>
                      </tr>
                      <tr>
                        <td><strong>Average Confidence:</strong></td>
                        <td>{(results.gradingResults.summary.averageConfidence * 100).toFixed(0)}%</td>
                      </tr>
                      <tr>
                        <td><strong>Processing Time:</strong></td>
                        <td>{results.processingTime}</td>
                      </tr>
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>

              {/* Detailed Results */}
              <h6 className="mb-3">Question-by-Question Breakdown</h6>
              <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                <Table striped bordered hover size="sm">
                  <thead style={{ position: "sticky", top: 0, backgroundColor: "#fff", zIndex: 1 }}>
                    <tr>
                      <th style={{ width: "80px" }}>Q #</th>
                      <th style={{ width: "120px" }}>Student Answer</th>
                      <th style={{ width: "120px" }}>Correct Answer</th>
                      <th style={{ width: "100px" }}>Result</th>
                      <th style={{ width: "100px" }}>Confidence</th>
                      <th>Feedback</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.gradingResults.results.map((result) => (
                      <tr key={result.questionNumber}>
                        <td className="text-center"><strong>{result.questionNumber}</strong></td>
                        <td className="text-center">
                          <Badge
                            bg={
                              result.studentAnswer === "BLANK"
                                ? "warning"
                                : result.studentAnswer === "MULTIPLE"
                                ? "secondary"
                                : "info"
                            }
                          >
                            {result.studentAnswer}
                          </Badge>
                        </td>
                        <td className="text-center">
                          <Badge bg="success">{result.correctAnswer}</Badge>
                        </td>
                        <td className="text-center">
                          {result.isCorrect ? (
                            <Badge bg="success">✓ Correct</Badge>
                          ) : (
                            <Badge bg="danger">✗ Wrong</Badge>
                          )}
                        </td>
                        <td className="text-center">
                          {(result.confidence * 100).toFixed(0)}%
                        </td>
                        <td><small>{result.feedback}</small></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowResultsModal(false)}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setShowResultsModal(false);
              if (results && results.submissionId) {
                window.location.href = `/app/answer-checker/review/${results.submissionId}`;
              }
            }}
          >
            View Detailed Review
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default SpmAnswerSheetUploader;
