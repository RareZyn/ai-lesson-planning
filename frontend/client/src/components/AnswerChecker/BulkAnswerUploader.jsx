// frontend/client/src/components/AnswerChecker/BulkAnswerUploader.jsx
import React, { useState } from "react";
import { Card, Button, Alert, ProgressBar, Badge } from "react-bootstrap";
import { Upload } from "antd";
import {
  InboxOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  FilePdfOutlined,
  FileImageOutlined,
} from "@ant-design/icons";

const { Dragger } = Upload;

const BulkAnswerUploader = ({
  onFilesChange,
  disabled = false,
}) => {
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [processedFiles, setProcessedFiles] = useState([]);

  const processFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = () => {
        const base64Data = reader.result;
        const sizeInMB = (base64Data.length * 0.75) / (1024 * 1024);

        // For PDFs, return as-is
        if (file.type === "application/pdf") {
          resolve({
            name: file.name,
            type: file.type,
            size: file.size,
            base64: base64Data,
            isPdf: true,
          });
          return;
        }

        // For images, potentially compress
        if (sizeInMB > 10) {
          console.log(`📦 Compressing ${file.name} (${sizeInMB.toFixed(2)} MB)...`);

          const img = new window.Image();
          img.src = base64Data;

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
              name: file.name,
              type: file.type,
              size: file.size,
              base64: compressedBase64,
              compressedSize: compressedBase64.length * 0.75,
              isImage: true,
            });
          };

          img.onerror = () => reject(new Error(`Failed to process image: ${file.name}`));
        } else {
          resolve({
            name: file.name,
            type: file.type,
            size: file.size,
            base64: base64Data,
            isImage: true,
          });
        }
      };

      reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
    });
  };

  const handleChange = async (info) => {
    setError("");
    setFileList(info.fileList);

    // Filter valid files
    const validFiles = info.fileList.filter(file => {
      const isValidType =
        file.type === "application/pdf" ||
        file.type?.startsWith("image/");

      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB

      if (!isValidType) {
        setError(`${file.name} is not a valid file type. Only images and PDFs are allowed.`);
        return false;
      }

      if (!isValidSize) {
        setError(`${file.name} exceeds 50MB limit.`);
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);

    try {
      const processed = [];

      for (const fileItem of validFiles) {
        const file = fileItem.originFileObj || fileItem;
        try {
          const result = await processFile(file);
          processed.push(result);
        } catch (err) {
          console.error(`Error processing ${file.name}:`, err);
          setError(`Error processing ${file.name}: ${err.message}`);
        }
      }

      setProcessedFiles(processed);
      onFilesChange(processed);
    } catch (err) {
      setError("Error processing files: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (file) => {
    const newFileList = fileList.filter(f => f.uid !== file.uid);
    const newProcessed = processedFiles.filter(f => f.name !== file.name);

    setFileList(newFileList);
    setProcessedFiles(newProcessed);
    onFilesChange(newProcessed);
  };

  const handleClearAll = () => {
    setFileList([]);
    setProcessedFiles([]);
    setError("");
    onFilesChange([]);
  };

  const getFileIcon = (file) => {
    if (file.type === "application/pdf") {
      return <FilePdfOutlined style={{ fontSize: "24px", color: "#ff4d4f" }} />;
    }
    return <FileImageOutlined style={{ fontSize: "24px", color: "#52c41a" }} />;
  };

  const uploadProps = {
    name: "file",
    multiple: true,
    accept: "image/*,application/pdf",
    fileList: fileList,
    beforeUpload: () => false, // Prevent auto upload
    onChange: handleChange,
    onRemove: handleRemove,
    disabled: disabled || uploading,
  };

  const totalSize = processedFiles.reduce((sum, file) => {
    return sum + (file.compressedSize || file.size);
  }, 0);

  return (
    <Card className="mb-4">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="mb-1">
              Bulk Upload Answer Files
              {processedFiles.length > 0 && (
                <Badge bg="success" className="ms-2">
                  {processedFiles.length} file{processedFiles.length !== 1 ? 's' : ''} ready
                </Badge>
              )}
            </h5>
            <small className="text-muted">
              Upload multiple images or PDF files containing student answers
            </small>
          </div>
          {processedFiles.length > 0 && (
            <Button
              variant="outline-danger"
              size="sm"
              onClick={handleClearAll}
              disabled={disabled}
            >
              <DeleteOutlined className="me-1" />
              Clear All
            </Button>
          )}
        </div>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError("")}>
            <WarningOutlined className="me-2" />
            {error}
          </Alert>
        )}

        <Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined style={{ fontSize: "48px", color: "#1890ff" }} />
          </p>
          <p className="ant-upload-text">
            Click or drag files here to upload
          </p>
          <p className="ant-upload-hint">
            Supports: JPG, PNG, PDF (Max 50MB per file)
            <br />
            <small className="text-muted">
              You can select multiple files at once
            </small>
          </p>
        </Dragger>

        {uploading && (
          <div className="mt-3">
            <ProgressBar animated now={100} label="Processing files..." />
            <small className="text-muted d-block text-center mt-2">
              Preparing {fileList.length} file{fileList.length !== 1 ? 's' : ''}...
            </small>
          </div>
        )}

        {processedFiles.length > 0 && (
          <div className="mt-4">
            <Alert variant="success">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <CheckCircleOutlined className="me-2" />
                  <strong>
                    {processedFiles.length} file{processedFiles.length !== 1 ? 's' : ''} processed successfully
                  </strong>
                </div>
                <div className="text-end">
                  <small className="text-muted">
                    Total size: {(totalSize / (1024 * 1024)).toFixed(2)} MB
                  </small>
                </div>
              </div>
            </Alert>

            <div className="mt-3">
              <h6>Uploaded Files:</h6>
              <div className="d-flex flex-wrap gap-2">
                {processedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="border rounded p-2 d-flex align-items-center gap-2"
                    style={{ maxWidth: "300px" }}
                  >
                    {getFileIcon(file)}
                    <div className="flex-grow-1 overflow-hidden">
                      <div className="text-truncate">
                        <small><strong>{file.name}</strong></small>
                      </div>
                      <small className="text-muted">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                        {file.compressedSize && (
                          <> → {(file.compressedSize / (1024 * 1024)).toFixed(2)} MB</>
                        )}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Upload Tips */}
        {processedFiles.length === 0 && !uploading && (
          <div className="mt-3">
            <small className="text-muted">
              <strong>Tips for best results:</strong>
              <ul className="mb-0 ps-3 mt-1">
                <li>Upload multiple answer sheets at once</li>
                <li>Supported formats: JPG, PNG images and PDF files</li>
                <li>Ensure good lighting and clear handwriting</li>
                <li>PDF files will be processed page by page</li>
                <li>Maximum 50MB per file</li>
              </ul>
            </small>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default BulkAnswerUploader;
