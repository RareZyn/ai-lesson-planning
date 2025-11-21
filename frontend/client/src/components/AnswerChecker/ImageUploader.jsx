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
} from "@ant-design/icons";
import { ocrAPI } from "../../services/ocrService";

const { Dragger } = Upload;

const ImageUploader = ({
  questionNumber,
  questionText,
  onImageChange,
  initialImage = null,
  disabled = false,
}) => {
  const [image, setImage] = useState(initialImage);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [fileInfo, setFileInfo] = useState(null);

  const handleUpload = async (file) => {
    setError("");
    setUploading(true);

    try {
      // Validate image
      const validation = ocrAPI.validateImage(file);

      if (!validation.isValid) {
        setError(validation.errors.join(". "));
        setUploading(false);
        return false;
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        console.warn("Upload warnings:", validation.warnings);
      }

      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = async () => {
        const base64Image = reader.result;

        // Check if compression needed
        const sizeInMB = (base64Image.length * 0.75) / (1024 * 1024);

        if (sizeInMB > 10) {
          console.log(
            `📦 Compressing image for Q${questionNumber} (${sizeInMB.toFixed(
              2
            )} MB)...`
          );

          // Simple compression using canvas
          const img = new window.Image();
          img.src = base64Image;

          img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            // Calculate dimensions
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

            // Compress
            const compressedBase64 = canvas.toDataURL("image/jpeg", 0.8);
            const newSize = (compressedBase64.length * 0.75) / (1024 * 1024);

            console.log(`✅ Compressed to ${newSize.toFixed(2)} MB`);

            setImage(compressedBase64);
            onImageChange(questionNumber, compressedBase64);

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
          onImageChange(questionNumber, base64Image);

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
    onImageChange(questionNumber, null);
  };

  const uploadProps = {
    name: "file",
    multiple: false,
    accept: "image/*",
    showUploadList: false,
    beforeUpload: handleUpload,
    disabled: disabled || uploading,
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
                Supports: JPG, PNG (Max 50MB)
                <br />
                <small className="text-muted">
                  Ensure handwriting is clear and image is well-lit
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
