// frontend/client/src/pages/answerChecker/SubmissionListPage.jsx
import React, { useState, useEffect } from "react";
import { Card, Button, Badge, Table, Alert, Form } from "react-bootstrap";
import { Tag, Tooltip, Empty, Spin } from "antd";
import {
  EyeOutlined,
  DeleteOutlined,
  ReloadOutlined,
  PlusOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  submissionService,
  submissionUtils,
} from "../../services/submissionService";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL;

const SubmissionListPage = () => {
  const navigate = useNavigate();

  // State
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [classes, setClasses] = useState([]);
  const [assessments, setAssessments] = useState([]);

  // Filters
  const [filterClass, setFilterClass] = useState("");
  const [filterAssessment, setFilterAssessment] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    fetchClasses();
    fetchSubmissions();
  }, []);

  useEffect(() => {
    if (filterClass) {
      fetchAssessmentsByClass(filterClass);
    }
  }, [filterClass]);

  useEffect(() => {
    fetchSubmissions();
  }, [filterClass, filterAssessment, filterStatus]);

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(`${API_BASE_URL}/classes`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setClasses(response.data.data);
    } catch (err) {
      console.error("Failed to fetch classes:", err);
    }
  };

  const fetchAssessmentsByClass = async (classId) => {
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
      setAssessments(response.data.data);
    } catch (err) {
      console.error("Failed to fetch assessments:", err);
    }
  };

  const fetchSubmissions = async () => {
    setLoading(true);
    setError("");

    try {
      let result;

      if (filterClass && filterAssessment) {
        result = await submissionService.getSubmissionsByAssessment(
          filterAssessment,
          {
            status: filterStatus || undefined,
          }
        );
      } else if (filterClass) {
        result = await submissionService.getSubmissionsByClass(filterClass, {
          assessmentId: filterAssessment || undefined,
          status: filterStatus || undefined,
        });
      } else {
        // Fetch all user's submissions
        const token = localStorage.getItem("authToken");
        const response = await axios.get(`${API_BASE_URL}/answers/class/all`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        result = { success: true, data: response.data.data };
      }

      if (result.success) {
        setSubmissions(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this submission?"))
      return;

    try {
      const result = await submissionService.deleteSubmission(id);
      if (result.success) {
        fetchSubmissions();
      } else {
        alert(result.message);
      }
    } catch (err) {
      alert("Failed to delete submission");
    }
  };

  const getStatusBadge = (status) => {
    const color = submissionUtils.getStatusColor(status);
    return <Badge bg={color}>{status.replace(/_/g, " ").toUpperCase()}</Badge>;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString("en-MY", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="container-fluid">
      {/* Header */}
      <Card className="mb-4" style={{ borderLeft: "4px solid #1890ff" }}>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-2">Student Submissions</h2>
              <p className="text-muted mb-0">
                View and manage all student answer submissions
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => navigate("/app/submissions/upload")}
            >
              <PlusOutlined className="me-2" />
              New Submission
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <div className="row g-3">
            <div className="col-md-3">
              <Form.Label>
                <FilterOutlined className="me-2" />
                Filter by Class
              </Form.Label>
              <Form.Select
                value={filterClass}
                onChange={(e) => {
                  setFilterClass(e.target.value);
                  setFilterAssessment("");
                }}
              >
                <option value="">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls._id} value={cls._id}>
                    {cls.className} - {cls.grade}
                  </option>
                ))}
              </Form.Select>
            </div>

            <div className="col-md-3">
              <Form.Label>Filter by Assessment</Form.Label>
              <Form.Select
                value={filterAssessment}
                onChange={(e) => setFilterAssessment(e.target.value)}
                disabled={!filterClass}
              >
                <option value="">All Assessments</option>
                {assessments.map((assessment) => (
                  <option key={assessment._id} value={assessment._id}>
                    {assessment.title}
                  </option>
                ))}
              </Form.Select>
            </div>

            <div className="col-md-3">
              <Form.Label>Filter by Status</Form.Label>
              <Form.Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing_ocr">Processing OCR</option>
                <option value="processing_grading">Grading</option>
                <option value="completed">Completed</option>
                <option value="requires_review">Requires Review</option>
                <option value="error">Error</option>
              </Form.Select>
            </div>

            <div className="col-md-3 d-flex align-items-end">
              <Button
                variant="outline-secondary"
                onClick={fetchSubmissions}
                className="w-100"
              >
                <ReloadOutlined className="me-2" />
                Refresh
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Submissions Table */}
      <Card>
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spin size="large" />
              <p className="mt-3 text-muted">Loading submissions...</p>
            </div>
          ) : submissions.length === 0 ? (
            <Empty
              description="No submissions found"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button
                variant="primary"
                onClick={() => navigate("/app/submissions/upload")}
              >
                Create First Submission
              </Button>
            </Empty>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Assessment</th>
                  <th>Class</th>
                  <th>Questions</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission._id}>
                    <td>
                      <strong>{submission.studentId?.name}</strong>
                      <br />
                      <small className="text-muted">
                        {submission.studentId?.studentId}
                      </small>
                    </td>
                    <td>{submission.assessmentId?.title || "N/A"}</td>
                    <td>
                      {submission.classId?.className || "N/A"}
                      <br />
                      <small className="text-muted">
                        {submission.classId?.grade}
                      </small>
                    </td>
                    <td className="text-center">
                      {submission.overallStats?.questionsAttempted || 0} /{" "}
                      {submission.overallStats?.totalQuestions || 0}
                    </td>
                    <td>
                      {submission.processingStatus === "completed" ? (
                        <div>
                          <strong>
                            {submission.overallStats?.totalScore || 0}/
                            {submission.overallStats?.maxPossibleScore || 0}
                          </strong>
                          <br />
                          <Badge
                            bg={
                              submission.overallStats?.percentage >= 80
                                ? "success"
                                : submission.overallStats?.percentage >= 60
                                ? "warning"
                                : "danger"
                            }
                          >
                            {submission.overallStats?.percentage?.toFixed(1) ||
                              0}
                            %
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-muted">Pending</span>
                      )}
                    </td>
                    <td>{getStatusBadge(submission.processingStatus)}</td>
                    <td>
                      <small>{formatDate(submission.submittedAt)}</small>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Tooltip title="View Details">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() =>
                              navigate(
                                `/app/submissions/${submission._id}/review`
                              )
                            }
                          >
                            <EyeOutlined />
                          </Button>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(submission._id)}
                          >
                            <DeleteOutlined />
                          </Button>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default SubmissionListPage;
