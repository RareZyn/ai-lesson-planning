// frontend/client/src/pages/answerChecker/AssessmentSubmissionsPage.jsx
import React, { useState, useEffect } from "react";
import { Card, Button, Badge, Table, Alert, Row, Col } from "react-bootstrap";
import { Tooltip, Empty, Spin, Statistic } from "antd";
import {
  EyeOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
  TeamOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  PercentageOutlined,
  PlusOutlined,
  
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { submissionService, submissionUtils } from "../../services/submissionService";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL;

const AssessmentSubmissionsPage = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [assessmentData, setAssessmentData] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState({});

  const fetchAssessmentData = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(
        `${API_BASE_URL}/answers/assessment/${assessmentId}/stats`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setAssessmentData(response.data.data.assessment);
        setStats(response.data.data.statistics);
        setSubmissions(response.data.data.submissions);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load assessment data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessmentData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentId]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this submission?"))
      return;

    try {
      const result = await submissionService.deleteSubmission(id);
      if (result.success) {
        fetchAssessmentData();
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

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spin size="large" />
        <p className="mt-3 text-muted">Loading assessment data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid">
        <Alert variant="danger">{error}</Alert>
        <Button variant="link" onClick={() => navigate("/app/submissions")}>
          <ArrowLeftOutlined className="me-2" />
          Back to All Submissions
        </Button>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Header */}
      <Card className="mb-4" style={{ borderLeft: "4px solid #1890ff" }}>
        <Card.Body>
          <div className="text-start mb-3">
            <Button
              variant="link"
              className="p-0"
              onClick={() => navigate("/app/submissions")}
            >
              <ArrowLeftOutlined className="me-2" />
              Back to All Submissions
            </Button>
          </div>
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h2 className="mb-2">{assessmentData?.title || "Assessment"}</h2>
              <p className="text-muted mb-0">
                View all student submissions for this assessment
              </p>
            </div>
            <div className="d-flex gap-2">
              <Button
                variant="primary"
                onClick={() => {
                  const classIdValue =
                    typeof assessmentData?.classId === "string"
                      ? assessmentData.classId
                      : assessmentData?.classId?._id;

                  navigate("/app/submissions/upload", {
                    state: {
                      assessmentId: assessmentId,
                      classId: classIdValue,
                      assessmentTitle: assessmentData?.title,
                    },
                  });
                }}
              >
                <PlusOutlined className="me-2" />
                Upload Submission
              </Button>
              <Button
                variant="outline-secondary"
                onClick={fetchAssessmentData}
              >
                <ReloadOutlined className="me-2" />
                Refresh
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Statistics Cards */}
      <Row className="mb-4 g-3">
        <Col md={3}>
          <Card className="h-100">
            <Card.Body>
              <Statistic
                title="Total Students in Class"
                value={stats.totalStudentsInClass || 0}
                prefix={<TeamOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100">
            <Card.Body>
              <Statistic
                title="Total Submissions"
                value={stats.totalSubmissions || 0}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100">
            <Card.Body>
              <Statistic
                title="Submission Rate"
                value={stats.submissionRate || 0}
                suffix="%"
                prefix={<PercentageOutlined />}
                valueStyle={{
                  color:
                    stats.submissionRate >= 80
                      ? "#52c41a"
                      : stats.submissionRate >= 50
                      ? "#faad14"
                      : "#f5222d",
                }}
              />
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100">
            <Card.Body>
              <Statistic
                title="Overall Average"
                value={stats.overallAverage || 0}
                suffix="%"
                prefix={<CheckCircleOutlined />}
                valueStyle={{
                  color:
                    stats.overallAverage >= 80
                      ? "#52c41a"
                      : stats.overallAverage >= 60
                      ? "#faad14"
                      : "#f5222d",
                }}
              />
              <small className="text-muted">
                {stats.completedSubmissions || 0} completed
              </small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Submissions Table */}
      <Card>
        <Card.Body>
          <h5 className="mb-3">Student Submissions</h5>
          {submissions.length === 0 ? (
            <Empty
              description="No submissions yet"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button
                variant="primary"
                onClick={() => navigate("/app/submissions/upload")}
              >
                Upload First Submission
              </Button>
            </Empty>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student</th>
                  <th>Questions</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission, index) => (
                  <tr key={submission._id}>
                    <td>{index + 1}</td>
                    <td>
                      <strong>{submission.studentId?.name || "N/A"}</strong>
                      <br />
                      <small className="text-muted">
                        {submission.studentId?.studentId || "N/A"}
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
                                `/app/submissions/${assessmentId}/review/${submission._id}`
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

export default AssessmentSubmissionsPage;
