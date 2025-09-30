// frontend/client/src/components/AnswerChecker/AssessmentSelector.jsx
import React, { useState, useEffect } from "react";
import { Form, Button, Modal, Alert, Badge, Card } from "react-bootstrap";
import { Spin, Empty, Tag } from "antd";
import { EyeOutlined, FileTextOutlined } from "@ant-design/icons";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL;

const AssessmentSelector = ({
  classId,
  selectedAssessment,
  onAssessmentSelect,
}) => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [previewAssessment, setPreviewAssessment] = useState(null);

  useEffect(() => {
    if (classId) {
      fetchAssessments();
    }
  }, [classId]);

  const fetchAssessments = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(
        `${API_BASE_URL}/assessment/my-assessments`,
        {
          params: { classId },
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      setAssessments(response.data.data || []);
    } catch (err) {
      setError("Failed to load assessments");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (assessmentId) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(
        `${API_BASE_URL}/assessment/${assessmentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      setPreviewAssessment(response.data.data);
      setShowPreview(true);
    } catch (err) {
      alert("Failed to load assessment details");
    }
  };

  const getActivityTypeBadge = (type) => {
    const colors = {
      worksheet: "primary",
      quiz: "warning",
      exam: "danger",
      assessment: "info",
    };
    return (
      <Badge bg={colors[type] || "secondary"}>
        {type ? type.toUpperCase() : "N/A"}
      </Badge>
    );
  };

  const getQuestionCount = (assessment) => {
    return (
      assessment.questionCount ||
      assessment.generatedContent?.assessmentContent?.questions?.length ||
      assessment.generatedContent?.examContent?.totalQuestions ||
      "N/A"
    );
  };

  return (
    <div>
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Form.Group className="mb-3">
        <Form.Label>
          Select Assessment <span className="text-danger">*</span>
        </Form.Label>

        {!classId ? (
          <Alert variant="info" className="mb-0">
            Please select a class first to view assessments
          </Alert>
        ) : loading ? (
          <div className="text-center py-4">
            <Spin size="large" />
            <p className="mt-2 text-muted">Loading assessments...</p>
          </div>
        ) : assessments.length === 0 ? (
          <Card className="text-center py-4">
            <Card.Body>
              <Empty
                description="No assessments found for this class"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
              <p className="text-muted small mt-2">
                Create an assessment first in the Assessment module
              </p>
            </Card.Body>
          </Card>
        ) : (
          <div>
            <Form.Select
              value={selectedAssessment || ""}
              onChange={(e) => onAssessmentSelect(e.target.value)}
              className="mb-2"
            >
              <option value="">Choose an assessment...</option>
              {assessments.map((assessment) => (
                <option key={assessment._id} value={assessment._id}>
                  {assessment.title} - {getQuestionCount(assessment)} questions
                  ({assessment.activityType})
                </option>
              ))}
            </Form.Select>

            {selectedAssessment && (
              <Button
                variant="outline-info"
                size="sm"
                onClick={() => handlePreview(selectedAssessment)}
              >
                <EyeOutlined className="me-2" />
                Preview Assessment
              </Button>
            )}
          </div>
        )}
      </Form.Group>

      {/* Selected Assessment Info */}
      {selectedAssessment && (
        <Card className="mb-3" style={{ borderLeft: "4px solid #1890ff" }}>
          <Card.Body>
            <div className="d-flex justify-content-between align-items-start">
              <div className="d-flex align-items-start">
                <FileTextOutlined
                  style={{
                    fontSize: "24px",
                    marginRight: "12px",
                    color: "#1890ff",
                  }}
                />
                <div>
                  <strong>
                    {
                      assessments.find((a) => a._id === selectedAssessment)
                        ?.title
                    }
                  </strong>
                  <br />
                  <small className="text-muted">
                    {getQuestionCount(
                      assessments.find((a) => a._id === selectedAssessment)
                    )}{" "}
                    questions
                  </small>
                </div>
              </div>
              {getActivityTypeBadge(
                assessments.find((a) => a._id === selectedAssessment)
                  ?.activityType
              )}
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Preview Modal */}
      <Modal
        show={showPreview}
        onHide={() => setShowPreview(false)}
        size="lg"
        scrollable
      >
        <Modal.Header closeButton>
          <Modal.Title>Assessment Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {previewAssessment && (
            <div>
              <h5>{previewAssessment.title}</h5>
              <div className="mb-3">
                {getActivityTypeBadge(previewAssessment.activityType)}
                <Tag color="blue" className="ms-2">
                  {getQuestionCount(previewAssessment)} Questions
                </Tag>
              </div>

              {previewAssessment.generatedContent?.assessmentContent
                ?.questions && (
                <div>
                  <h6 className="mt-3">Questions:</h6>
                  {previewAssessment.generatedContent.assessmentContent.questions.map(
                    (q, idx) => (
                      <Card key={idx} className="mb-2">
                        <Card.Body>
                          <strong>Q{idx + 1}:</strong> {q.question}
                          <br />
                          <small className="text-muted">
                            Points: {q.points || q.marks || "N/A"}
                          </small>
                        </Card.Body>
                      </Card>
                    )
                  )}
                </div>
              )}

              {previewAssessment.generatedContent?.answerKeyContent
                ?.answers && (
                <Alert variant="info" className="mt-3">
                  <i className="bi bi-check-circle me-2"></i>
                  Answer key available for auto-grading
                </Alert>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPreview(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AssessmentSelector;