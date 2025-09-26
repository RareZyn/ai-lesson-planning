import React from "react";
import { Card, Breadcrumb } from "antd";
import { HomeOutlined, ScanOutlined } from "@ant-design/icons";
import OCRUploadComponent from "../../components/OCR/OCRUploadComponent";

const OCRPage = () => {
  return (
      <div className="container-fluid">
        {/* Breadcrumb Navigation */}
        <Breadcrumb className="mb-3">
          <Breadcrumb.Item href="/dashboard">
            <HomeOutlined />
            <span>Home</span>
          </Breadcrumb.Item>
          <Breadcrumb.Item href="/assessment">Assessment</Breadcrumb.Item>
          <Breadcrumb.Item>
            <ScanOutlined />
            <span>Answer Recognition</span>
          </Breadcrumb.Item>
        </Breadcrumb>

        {/* Page Header */}
        <Card className="mb-4" style={{ borderLeft: "4px solid #1890ff" }}>
          <div className="row align-items-center">
            <div className="col-md-8">
              <h2 className="mb-2">Answer Recognition & OCR</h2>
              <p className="text-muted mb-0">
                Upload student handwritten answers to automatically extract text
                using AI-powered OCR technology. This module supports both
                English and Malay text recognition with confidence scoring.
              </p>
            </div>
            <div className="col-md-4 text-end">
              <ScanOutlined
                style={{ fontSize: "48px", color: "#1890ff", opacity: 0.2 }}
              />
            </div>
          </div>
        </Card>

        {/* OCR Component */}
        <OCRUploadComponent />
      </div>
  );
};

export default OCRPage;
