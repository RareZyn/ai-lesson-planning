// frontend/client/src/pages/answerChecker/SubmissionListPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Button,
  Badge,
  Alert,
  Form,
  Row,
  Col,
} from "react-bootstrap";
import { Tooltip, Empty, Spin, Progress, Table } from "antd";
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

        if (response.data.success && response.data.data.statistics) {
          stats[assessment._id] = response.data.data.statistics;
        } else {
          // If stats not available, use defaults
          stats[assessment._id] = {
            totalSubmissions: 0,
            totalStudentsInClass: 0,
            submissionRate: 0,
            overallAverage: 0,
            completedSubmissions: 0,
            pendingSubmissions: 0,
          };
        }
      } catch (err) {
        // If stats fetch fails, use defaults
        console.warn(`Failed to fetch stats for assessment ${assessment._id}:`, err);
        stats[assessment._id] = {
          totalSubmissions: 0,
          totalStudentsInClass: 0,
          submissionRate: 0,
          overallAverage: 0,
          completedSubmissions: 0,
          pendingSubmissions: 0,
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

  // Filter assessments based on search term
  const filteredAssessments = assessments.filter((assessment) =>
    assessment.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Table columns configuration
  const columns = [
    {
      title: "Assessment",
      dataIndex: "title",
      key: "title",
      render: (text) => <strong>{text}</strong>,
      width: 200,
    },
    {
      title: "Type",
      dataIndex: "activityType",
      key: "activityType",
      render: (type) => getActivityTypeBadge(type),
      width: 150,
    },
    {
      title: "Class",
      dataIndex: "classId",
      key: "classId",
      render: (classId) => (
        <>
          {classId?.className || "N/A"}
          <br />
          <small className="text-muted">{classId?.grade}</small>
        </>
      ),
      width: 150,
    },
    {
      title: "Students",
      key: "students",
      align: "center",
      render: (_, record) => {
        const stats = assessmentStats[record._id] || {};
        return (
          <>
            <TeamOutlined className="me-1" />
            {stats.totalStudentsInClass || 0}
          </>
        );
      },
      width: 100,
    },
    {
      title: "Submissions",
      key: "submissions",
      align: "center",
      render: (_, record) => {
        const stats = assessmentStats[record._id] || {};
        return (
          <>
            <FileTextOutlined className="me-1" />
            {stats.totalSubmissions || 0}
          </>
        );
      },
      width: 120,
    },
    {
      title: "Progress",
      key: "progress",
      render: (_, record) => {
        const stats = assessmentStats[record._id] || {};
        return (
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
        );
      },
      width: 150,
    },
    {
      title: "Average Score",
      key: "averageScore",
      render: (_, record) => {
        const stats = assessmentStats[record._id] || {};
        return stats.completedSubmissions > 0 ? (
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
        );
      },
      width: 120,
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => <small>{formatDate(date)}</small>,
      width: 120,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Tooltip title="View Submissions">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/app/submissions/${record._id}`);
            }}
          >
            <EyeOutlined />
          </Button>
        </Tooltip>
      ),
      width: 100,
      align: "center",
    },
  ];

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
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => navigate("/app/submissions/upload")}
            >
              <PlusOutlined className="me-2" />
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
              >
                Create Assessment
              </Button>
            </Empty>
          ) : filteredAssessments.length === 0 ? (
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
            <Table
              columns={columns}
              dataSource={filteredAssessments}
              rowKey="_id"
              loading={loading}
              pagination={{
                defaultPageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: ["5", "10", "20", "50"],
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} assessments`,
                position: ["bottomCenter"],
              }}
              onRow={(record) => ({
                onClick: () => navigate(`/app/submissions/${record._id}`),
                style: { cursor: "pointer" },
              })}
              scroll={{ x: 1200 }}
            />
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default SubmissionListPage;
