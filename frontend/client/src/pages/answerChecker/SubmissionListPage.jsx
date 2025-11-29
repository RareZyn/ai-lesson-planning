// frontend/client/src/pages/answerChecker/SubmissionListPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Button,
  Badge,
  Table,
  Alert,
  Form,
  Row,
  Col,
} from "react-bootstrap";
import { Tooltip, Empty, Spin, Progress } from "antd";
import {
  EyeOutlined,
  ReloadOutlined,
  PlusOutlined,
  FilterOutlined,
  FileTextOutlined,
  TeamOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL;

const SubmissionListPage = () => {
  const navigate = useNavigate();

  // State
  const [assessments, setAssessments] = useState([]);
  const [assessmentStats, setAssessmentStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [classes, setClasses] = useState([]);

  // Filters
  const [filterClass, setFilterClass] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchClasses = useCallback(async () => {
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
  }, []);

  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("authToken");
      const params = {};

      if (filterClass) {
        params.classId = filterClass;
      }

      const params = {};

      if (filterClass) {
        params.classId = filterClass;
      }

      const response = await axios.get(
        `${API_BASE_URL}/assessment/my-assessments`,
        {
          params,
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setAssessments(response.data.data);
        // Fetch submission stats for each assessment
        fetchSubmissionStats(response.data.data);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError("Failed to load assessments");
      console.error(err);
      setError("Failed to load assessments");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterClass]);

  useEffect(() => {
    fetchClasses();
    fetchAssessments();
  }, [fetchClasses, fetchAssessments]);

  useEffect(() => {
    fetchAssessments();
  }, [filterClass, fetchAssessments]);

  const fetchSubmissionStats = async (assessmentList) => {
    const token = localStorage.getItem("authToken");
    const stats = {};

    // Fetch stats for each assessment
    for (const assessment of assessmentList) {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/answers/assessment/${assessment._id}/stats`,
          {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          }
        );

        if (response.data.success) {
          stats[assessment._id] = response.data.data.statistics;
        }
      } catch (err) {
        // If stats not available, just skip
        stats[assessment._id] = {
          totalSubmissions: 0,
          totalStudentsInClass: 0,
          submissionRate: 0,
          overallAverage: 0,
        };
      }
    }

    setAssessmentStats(stats);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString("en-MY", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getActivityTypeBadge = (type) => {
    const typeColors = {
      activity: "primary",
      essay: "info",
      textbook: "warning",
      assessment: "success",
      activityInClass: "secondary",
      "spm-exam": "danger",
    };
    return (
      <Badge bg={typeColors[type] || "secondary"}>
        {type?.toUpperCase().replace(/-/g, " ")}
      </Badge>
    );
  };

  return (
    <div className="container-fluid">
      {/* Header */}
      <Card className="mb-4" style={{ borderLeft: "4px solid #1890ff" }}>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-2">Answer Recognition</h2>
              <p className="text-muted mb-0">
                Select an assessment to view student submissions
                Select an assessment to view student submissions
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => navigate("/app/submissions/upload")}
            >
              <PlusOutlined className="me-2" />
              Upload Submission
              Upload Submission
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={4}>
              <Form.Label>
                <FilterOutlined className="me-2" />
                Filter by Class
              </Form.Label>
              <Form.Select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                onChange={(e) => setFilterClass(e.target.value)}
              >
                <option value="">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls._id} value={cls._id}>
                    {cls.className} - {cls.grade}
                  </option>
                ))}
              </Form.Select>
            </Col>

            <Col md={4}>
              <Form.Label>
                <SearchOutlined className="me-2" />
                Search Assessment
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="Search by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Col>

            <Col md={4} className="d-flex align-items-end">
              <Button
                variant="outline-secondary"
                onClick={fetchAssessments}
                className="w-100"
              >
                <ReloadOutlined className="me-2 " />
                Refresh
              </Button>
            </Col>
          </Row>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Assessments Table */}
      <Card>
        <Card.Body>
          <h5 className="mb-3">Assessments with Submissions</h5>
          {loading ? (
            <div className="text-center py-5">
              <Spin size="large" />
              <p className="mt-3 text-muted">Loading assessments...</p>
            </div>
          ) : assessments.length === 0 ? (
            <Empty
              description="No assessments found"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button
                variant="primary"
                onClick={() => navigate("/app/assessment")}
                onClick={() => navigate("/app/assessment")}
              >
                Create Assessment
              </Button>
            </Empty>
          ) : assessments.filter((assessment) =>
              assessment.title.toLowerCase().includes(searchTerm.toLowerCase())
            ).length === 0 ? (
            <Empty
              description={`No assessments match "${searchTerm}"`}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button
                variant="outline-secondary"
                onClick={() => setSearchTerm("")}
              >
                Clear Search
              </Button>
            </Empty>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Assessment</th>
                  <th>Type</th>
                  <th>Class</th>
                  <th>Students</th>
                  <th>Submissions</th>
                  <th>Progress</th>
                  <th>Average Score</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assessments
                  .filter((assessment) =>
                    assessment.title
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase())
                  )
                  .map((assessment) => {
                  const stats = assessmentStats[assessment._id] || {
                    totalSubmissions: 0,
                    totalStudentsInClass: 0,
                    submissionRate: 0,
                    overallAverage: 0,
                  };

                  return (
                    <tr
                      key={assessment._id}
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        navigate(`/app/submissions/${assessment._id}`)
                      }
                    >
                      <td>
                        <strong>{assessment.title}</strong>
                      </td>
                      <td>{getActivityTypeBadge(assessment.activityType)}</td>
                      <td>
                        {assessment.classId?.className || "N/A"}
                        <br />
                        <small className="text-muted">
                          {assessment.classId?.grade}
                        </small>
                      </td>
                      <td className="text-center">
                        <TeamOutlined className="me-1" />
                        {stats.totalStudentsInClass || 0}
                      </td>
                      <td className="text-center">
                        <FileTextOutlined className="me-1" />
                        {stats.totalSubmissions || 0}
                      </td>
                      <td style={{ minWidth: "150px" }}>
                        <Progress
                          percent={parseFloat(stats.submissionRate || 0)}
                          size="small"
                          status={
                            stats.submissionRate >= 80
                              ? "success"
                              : stats.submissionRate >= 50
                              ? "normal"
                              : "exception"
                          }
                        />
                      </td>
                      <td>
                        {stats.completedSubmissions > 0 ? (
                          <Badge
                            bg={
                              stats.overallAverage >= 80
                                ? "success"
                                : stats.overallAverage >= 60
                                ? "warning"
                                : "danger"
                            }
                          >
                            {stats.overallAverage}%
                          </Badge>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        <small>{formatDate(assessment.createdAt)}</small>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="View Submissions">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() =>
                              navigate(`/app/submissions/${assessment._id}`)
                            }
                          >
                            <EyeOutlined />
                          </Button>
                        </Tooltip>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default SubmissionListPage;
