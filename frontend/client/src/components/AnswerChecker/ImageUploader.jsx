// frontend/client/src/components/AnswerChecker/ImageUploader.jsx
import React, { useState } from "react";
import { Card, Button, Alert, ProgressBar } from "react-bootstrap";
import { Upload, Image as AntImage } from "antd";
import {
  InboxOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  UploadOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import { ocrAPI } from "../../services/ocrService";

const { Dragger } = Upload;

const ImageUploader = ({
  questionNumber,
  questionText,
  onImageChange,
  initialImage = null,
  disabled = false,
  allowBulk = false, // New prop to enable bulk upload
}) => {
  const [image, setImage] = useState(initialImage);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [fileInfo, setFileInfo] = useState(null);
  const [fileList, setFileList] = useState([]); // For bulk uploads

  const processFile = (file) => {
    return new Promise((resolve, reject) => {
      // Check if it's a PDF
      if (file.type === "application/pdf") {
        // For PDFs, just convert to base64 without compression
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = () => {
          resolve({
            base64: reader.result,
            fileInfo: {
              name: file.name,
              size: file.size,
              type: file.type,
              isPdf: true,
            }
          });
        };

        reader.onerror = () => reject(new Error("Failed to read PDF file"));
        return;
      }

      // For images, validate and potentially compress
      const validation = ocrAPI.validateImage(file);

      if (!validation.isValid) {
        reject(new Error(validation.errors.join(". ")));
        return;
      }

      if (validation.warnings.length > 0) {
        console.warn("Upload warnings:", validation.warnings);
      }

      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = async () => {
        const base64Image = reader.result;
        const sizeInMB = (base64Image.length * 0.75) / (1024 * 1024);

        if (sizeInMB > 10) {
          console.log(
            `📦 Compressing image (${sizeInMB.toFixed(2)} MB)...`
          );

          const img = new window.Image();
          img.src = base64Image;

          img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            const MAX_WIDTH = 2000;
            const MAX_HEIGHT = 2000;

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

            const compressedBase64 = canvas.toDataURL("image/jpeg", 0.8);
            const newSize = (compressedBase64.length * 0.75) / (1024 * 1024);

            console.log(`✅ Compressed to ${newSize.toFixed(2)} MB`);

            resolve({
              base64: compressedBase64,
              fileInfo: {
                name: file.name,
                size: file.size,
                type: file.type,
                compressedSize: compressedBase64.length * 0.75,
              }
            });
          };
        } else {
          resolve({
            base64: base64Image,
            fileInfo: {
              name: file.name,
              size: file.size,
              type: file.type,
            }
          });
        }
      };

      reader.onerror = () => reject(new Error("Failed to read file"));
    });
  };

  const handleUpload = async (file, fileListParam) => {
    setError("");
    setUploading(true);

    try {
      // Handle bulk upload
      if (allowBulk && fileListParam) {
        const files = fileListParam.map(f => f.originFileObj || f);
        const processedFiles = [];

        for (const f of files) {
          try {
            const result = await processFile(f);
            processedFiles.push({
              file: f,
              ...result
            });
          } catch (err) {
            console.error(`Error processing ${f.name}:`, err);
            setError(`Error processing ${f.name}: ${err.message}`);
          }
        }

        if (processedFiles.length > 0) {
          // Pass all processed files to parent
          onImageChange(questionNumber, processedFiles);
          setFileList(fileListParam);
        }

        setUploading(false);
        return false;
      }

      // Single file upload
      const result = await processFile(file);

      setImage(result.base64);
      onImageChange(questionNumber, result.base64);
      setFileInfo(result.fileInfo);
      setUploading(false);

    } catch (err) {
      setError("Error uploading file: " + err.message);
      setUploading(false);
    }

    return false; // Prevent default upload behavior
  };

  const handleRemove = () => {
    setImage(null);
    setFileInfo(null);
    setFileList([]);
    setError("");
    onImageChange(questionNumber, null);
  };

  const uploadProps = {
    name: "file",
    multiple: allowBulk,
    accept: "image/*,application/pdf", // Always accept both images and PDFs
    showUploadList: allowBulk,
    beforeUpload: handleUpload,
    disabled: disabled || uploading,
    fileList: allowBulk ? fileList : undefined,
    onChange: allowBulk ? (info) => {
      handleUpload(null, info.fileList);
    } : undefined,
  };

  return (
    <Card className="mb-4">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h6 className="mb-1">
              Question {questionNumber}
              {image && (
                <CheckCircleOutlined
                  className="ms-2"
                  style={{ color: "#52c41a" }}
                />
              )}
            </h6>
            <small className="text-muted">{questionText}</small>
          </div>
          {image && (
            <Button
              variant="outline-danger"
              size="sm"
              onClick={handleRemove}
              disabled={disabled}
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
            <Dragger {...uploadProps} style={{ padding: "20px" }}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ fontSize: "48px", color: "#1890ff" }} />
              </p>
              <p className="ant-upload-text">
                Click or drag image to upload answer for Question{" "}
                {questionNumber}
              </p>
              <p className="ant-upload-hint">
                {allowBulk
                  ? "Supports: JPG, PNG, PDF (Max 50MB per file). Select multiple files at once."
                  : "Supports: JPG, PNG, PDF (Max 50MB per file)"
                }
                <br />
                <small className="text-muted">
                  Ensure handwriting is clear and image/document is well-lit
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
              {fileInfo?.isPdf ? (
                // PDF Preview
                <div
                  style={{
                    width: "100%",
                    minHeight: "200px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "8px",
                    border: "2px solid #52c41a",
                    backgroundColor: "#f5f5f5",
                    padding: "40px",
                  }}
                >
                  <FilePdfOutlined
                    style={{
                      fontSize: "80px",
                      color: "#ff4d4f",
                      marginBottom: "20px",
                    }}
                  />
                  <h5>{fileInfo.name}</h5>
                  <small className="text-muted">PDF Document</small>
                </div>
              ) : (
                // Image Preview
                <AntImage
                  src={image}
                  alt={`Question ${questionNumber}`}
                  style={{
                    width: "100%",
                    maxHeight: "400px",
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
              )}
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
                          ? `Compressed: ${(
                              fileInfo.compressedSize /
                              (1024 * 1024)
                            ).toFixed(2)} MB`
                          : `Size: ${(fileInfo.size / (1024 * 1024)).toFixed(
                              2
                            )} MB`}
                      </small>
                    </div>
                  </div>
                </Alert>
              </div>
            )}

            <div className="mt-2 d-flex gap-2">
              <Dragger
                {...uploadProps}
                style={{ width: "100%", padding: "10px" }}
              >
                <p className="mb-0">
                  <UploadOutlined className="me-2" />
                  Click to replace image
                </p>
              </Dragger>
            </div>
          </div>
        )}

        {/* Upload Tips */}
        {!image && !uploading && (
          <div className="mt-3">
            <small className="text-muted">
              <strong>Tips for best results:</strong>
              <ul className="mb-0 ps-3 mt-1">
                <li>Ensure good lighting without shadows</li>
                <li>Keep text horizontal and properly oriented</li>
                <li>Avoid blur or motion in the photo</li>
                <li>Capture the entire answer clearly</li>
              </ul>
            </small>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default ImageUploader;
