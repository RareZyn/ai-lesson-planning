// frontend/client/src/pages/analytics/ClassAnalyticsView.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Row, Col, Card, Button, Spinner, Form } from "react-bootstrap";
import { Select, DatePicker, message, Statistic } from "antd";
import {
  DownloadOutlined,
  ReloadOutlined,
  TrophyOutlined,
  TeamOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  getClassAnalytics,
  getFrequentlyMissedQuestions,
  getAvailableTopics,
  generateReport,
  clearClassCache,
} from "../../services/analyticsService";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Option } = Select;

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];
const MASTERY_COLORS = { High: "#52c41a", Medium: "#faad14", Low: "#ff4d4f" };

const ClassAnalyticsView = ({ classId }) => {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [missedQuestions, setMissedQuestions] = useState([]);
  const [topics, setTopics] = useState([]);

  // Filters
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    topic: null,
    assessmentType: null,
  });

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);

      // Fetch analytics data (uses cache unless forceRefresh)
      const analyticsResponse = await getClassAnalytics(classId, filters, forceRefresh);
      setAnalyticsData(analyticsResponse.data);

      // Fetch missed questions
      const missedResponse = await getFrequentlyMissedQuestions(classId, null, forceRefresh);
      setMissedQuestions(missedResponse.data);

      // Fetch available topics
      const topicsResponse = await getAvailableTopics(classId, forceRefresh);
      setTopics(topicsResponse.data);

      if (forceRefresh) {
        message.success("Data refreshed successfully");
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      message.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }, [classId, filters]);

  const handleForceRefresh = () => {
    clearClassCache(classId);
    fetchData(true);
  };

  useEffect(() => {
    if (classId) {
      fetchData();
    }
  }, [classId, fetchData]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleDateRangeChange = (dates) => {
    if (dates) {
      setFilters((prev) => ({
        ...prev,
        startDate: dates[0].format("YYYY-MM-DD"),
        endDate: dates[1].format("YYYY-MM-DD"),
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        startDate: null,
        endDate: null,
      }));
    }
  };

  const handleResetFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      topic: null,
      assessmentType: null,
    });
  };

  const handleDownloadReport = async () => {
    try {
      message.loading({ content: "Generating report...", key: "report" });

      const reportResponse = await generateReport({
        type: "class",
        classId,
        filters,
      });

      const reportData = reportResponse.data;

      // Generate PDF
      const doc = new jsPDF();

      // Title
      doc.setFontSize(18);
      doc.text("Class Performance Report", 14, 20);

      // Class Info
      doc.setFontSize(12);
      doc.text(`Class: ${reportData.class?.className}`, 14, 30);
      doc.text(`Grade: ${reportData.class?.grade}`, 14, 37);
      doc.text(`Subject: ${reportData.class?.subject}`, 14, 44);
      doc.text(
        `Generated: ${dayjs(reportData.generatedAt).format(
          "DD/MM/YYYY HH:mm"
        )}`,
        14,
        51
      );

      // Summary Statistics
      doc.setFontSize(14);
      doc.text("Summary", 14, 62);
      doc.setFontSize(11);
      doc.text(`Total Students: ${reportData.totalStudents}`, 14, 70);
      doc.text(`Total Assessments: ${reportData.totalAssessments}`, 14, 77);
      doc.text(`Class Average: ${reportData.classAverage.toFixed(1)}%`, 14, 84);

      // Student Performance Table
      if (
        reportData.studentPerformance &&
        reportData.studentPerformance.length > 0
      ) {
        autoTable(doc, {
          startY: 95,
          head: [["Student Name", "Student ID", "Avg Score", "Assessments"]],
          body: reportData.studentPerformance.map((student) => [
            student.name,
            student.studentId,
            `${student.averageScore}%`,
            student.assessmentsCompleted,
          ]),
          theme: "grid",
          headStyles: { fillColor: [41, 128, 185] },
          styles: { fontSize: 9 },
        });
      }

      // Save PDF
      doc.save(
        `class-report-${reportData.class?.className}-${dayjs().format(
          "YYYY-MM-DD"
        )}.pdf`
      );

      message.success({
        content: "Report downloaded successfully",
        key: "report",
      });
    } catch (error) {
      console.error("Error generating report:", error);
      message.error({ content: "Failed to generate report", key: "report" });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-3">Loading analytics...</p>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-5">
        <p>No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="class-analytics-view">
      {/* Filter Section */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <h5 className="mb-3">Filters</h5>
          <Row className="g-3">
            <Col md={6} lg={3}>
              <Form.Label>Date Range</Form.Label>
              <RangePicker
                style={{ width: "100%" }}
                onChange={handleDateRangeChange}
                value={
                  filters.startDate && filters.endDate
                    ? [dayjs(filters.startDate), dayjs(filters.endDate)]
                    : null
                }
              />
            </Col>
            <Col md={6} lg={3}>
              <Form.Label>Topic</Form.Label>
              <Select
                style={{ width: "100%" }}
                placeholder="All topics"
                allowClear
                value={filters.topic}
                onChange={(value) => handleFilterChange("topic", value)}
              >
                {topics.map((topic) => (
                  <Option key={topic} value={topic}>
                    {topic}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col md={6} lg={3}>
              <Form.Label>Assessment Type</Form.Label>
              <Select
                style={{ width: "100%" }}
                placeholder="All types"
                allowClear
                value={filters.assessmentType}
                onChange={(value) =>
                  handleFilterChange("assessmentType", value)
                }
              >
                <Option value="assessment">Assessment</Option>
                <Option value="activity">Activity</Option>
                <Option value="essay">Essay</Option>
                <Option value="textbook">Textbook</Option>
                <Option value="activityInClass">Activity In Class</Option>
                <Option value="spm-exam">SPM Exam</Option>
              </Select>
            </Col>
            <Col md={6} lg={3} className="d-flex align-items-end gap-2">
              <Button
                variant="outline-secondary"
                onClick={handleResetFilters}
                title="Reset filters"
              >
                Reset
              </Button>
              <Button
                variant="outline-primary"
                onClick={handleForceRefresh}
                title="Refresh data from server"
              >
                <ReloadOutlined /> Refresh
              </Button>
              <Button
                variant="primary"
                onClick={handleDownloadReport}
                title="Download report"
              >
                <DownloadOutlined /> Report
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Summary Statistics */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="shadow-sm h-100">
            <Card.Body className="text-center">
              <Statistic
                title="Class Average"
                value={analyticsData.classAverage}
                suffix="%"
                valueStyle={{
                  color:
                    analyticsData.classAverage >= 70 ? "#3f8600" : "#cf1322",
                }}
                prefix={<TrophyOutlined />}
              />
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm h-100">
            <Card.Body className="text-center">
              <Statistic
                title="Total Students"
                value={analyticsData.totalStudents}
                prefix={<TeamOutlined />}
              />
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm h-100">
            <Card.Body className="text-center">
              <Statistic
                title="Total Assessments"
                value={analyticsData.totalAssessments}
                prefix={<FileTextOutlined />}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Charts Section */}
      <Row className="mb-4">
        {/* Performance Trend Chart */}
        <Col lg={8} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Body>
              <h5 className="mb-3">Performance Trend Over Time</h5>
              {analyticsData.trendData && analyticsData.trendData.length > 0 ? (
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analyticsData.trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="averageScore"
                        stroke="#8884d8"
                        strokeWidth={2}
                        name="Average Score (%)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-muted text-center py-5">
                  No trend data available
                </p>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Difficulty Breakdown */}
        <Col lg={4} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Body>
              <h5 className="mb-3">By Difficulty Level</h5>
              {analyticsData.difficultyBreakdown &&
              analyticsData.difficultyBreakdown.length > 0 ? (
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.difficultyBreakdown}
                        dataKey="count"
                        nameKey="difficulty"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={(entry) => `${entry.difficulty}: ${entry.count}`}
                      >
                        {analyticsData.difficultyBreakdown.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-muted text-center py-5">No data available</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Topic Mastery */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm">
            <Card.Body>
              <h5 className="mb-3">Topic Mastery Levels</h5>
              {analyticsData.topicMastery &&
              analyticsData.topicMastery.length > 0 ? (
                <div style={{ width: "100%", height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analyticsData.topicMastery}
                      margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="topic"
                        angle={-45}
                        textAnchor="end"
                        height={120}
                        interval={0}
                      />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="averageScore" name="Average Score (%)">
                        {analyticsData.topicMastery.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={MASTERY_COLORS[entry.masteryLevel]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-muted text-center py-5">
                  No topic data available
                </p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Frequently Missed Questions */}
      <Row>
        <Col>
          <Card className="shadow-sm">
            <Card.Body>
              <h5 className="mb-3">Frequently Missed Questions</h5>
              {missedQuestions && missedQuestions.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Q#</th>
                        <th>Question</th>
                        <th>Error Rate</th>
                        <th>Attempts</th>
                        <th>Avg Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {missedQuestions.map((q) => (
                        <tr key={q.questionNumber}>
                          <td>{q.questionNumber}</td>
                          <td>{q.questionText}</td>
                          <td>
                            <span
                              className={`badge ${
                                q.errorRate > 70
                                  ? "bg-danger"
                                  : q.errorRate > 40
                                  ? "bg-warning"
                                  : "bg-info"
                              }`}
                            >
                              {q.errorRate.toFixed(1)}%
                            </span>
                          </td>
                          <td>{q.totalAttempts}</td>
                          <td>{q.averageScore.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted text-center py-3">
                  No frequently missed questions found
                </p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ClassAnalyticsView;
