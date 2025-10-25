// frontend/client/src/pages/analytics/StudentProgressView.jsx
import React, { useState, useEffect } from "react";
import { Row, Col, Card, Button, Spinner, Form, Badge } from "react-bootstrap";
import { Select, DatePicker, message, Statistic } from "antd";
import {
  DownloadOutlined,
  ReloadOutlined,
  RiseOutlined,
  FallOutlined,
  MinusOutlined,
} from "@ant-design/icons";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  getStudentProgress,
  getClassStudentsList,
  generateReport,
} from "../../services/analyticsService";
import jsPDF from "jspdf";
import "jspdf-autotable";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Option } = Select;

const StudentProgressView = ({ classId }) => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [progressData, setProgressData] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    assessmentType: null,
  });

  useEffect(() => {
    if (classId) {
      fetchStudents();
    }
  }, [classId]);

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentProgress();
    }
  }, [selectedStudent, filters]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await getClassStudentsList(classId);
      if (response.data && response.data.length > 0) {
        setStudents(response.data);
        setSelectedStudent(response.data[0]._id);
      } else {
        message.info("No students found in this class");
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      message.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentProgress = async () => {
    try {
      setLoading(true);
      const response = await getStudentProgress(selectedStudent, filters);
      setProgressData(response.data);
    } catch (error) {
      console.error("Error fetching student progress:", error);
      message.error("Failed to load student progress");
      setProgressData(null);
    } finally {
      setLoading(false);
    }
  };

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
      assessmentType: null,
    });
  };

  const handleDownloadReport = async () => {
    try {
      message.loading({ content: "Generating student report...", key: "report" });

      const reportResponse = await generateReport({
        type: "student",
        studentId: selectedStudent,
        filters,
      });

      const reportData = reportResponse.data;

      // Generate PDF
      const doc = new jsPDF();

      // Title
      doc.setFontSize(18);
      doc.text("Student Progress Report", 14, 20);

      // Student Info
      doc.setFontSize(12);
      doc.text(`Student Name: ${reportData.student?.name}`, 14, 30);
      doc.text(`Student ID: ${reportData.student?.studentId}`, 14, 37);
      doc.text(`Class: ${reportData.student?.class}`, 14, 44);
      doc.text(`Grade: ${reportData.student?.grade}`, 14, 51);
      doc.text(
        `Generated: ${dayjs(reportData.generatedAt).format("DD/MM/YYYY HH:mm")}`,
        14,
        58
      );

      // Summary Statistics
      doc.setFontSize(14);
      doc.text("Summary", 14, 69);
      doc.setFontSize(11);
      doc.text(
        `Total Assessments: ${reportData.totalAssessments}`,
        14,
        77
      );
      doc.text(
        `Average Score: ${reportData.averageScore.toFixed(1)}%`,
        14,
        84
      );

      // Assessment Details Table
      if (reportData.assessmentDetails && reportData.assessmentDetails.length > 0) {
        doc.autoTable({
          startY: 95,
          head: [["Assessment", "Date", "Score", "Type"]],
          body: reportData.assessmentDetails.map((assessment) => [
            assessment.title,
            dayjs(assessment.date).format("DD/MM/YYYY"),
            `${assessment.score.toFixed(1)}%`,
            assessment.type,
          ]),
          theme: "grid",
          headStyles: { fillColor: [41, 128, 185] },
          styles: { fontSize: 9 },
        });
      }

      // Save PDF
      doc.save(
        `student-report-${reportData.student?.studentId}-${dayjs().format("YYYY-MM-DD")}.pdf`
      );

      message.success({ content: "Report downloaded successfully", key: "report" });
    } catch (error) {
      console.error("Error generating report:", error);
      message.error({ content: "Failed to generate report", key: "report" });
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case "improving":
        return <RiseOutlined style={{ color: "#52c41a" }} />;
      case "declining":
        return <FallOutlined style={{ color: "#ff4d4f" }} />;
      default:
        return <MinusOutlined style={{ color: "#faad14" }} />;
    }
  };

  if (loading && !progressData) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-3">Loading student data...</p>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-5">
        <p>No students found in this class</p>
      </div>
    );
  }

  return (
    <div className="student-progress-view">
      {/* Filter Section */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <h5 className="mb-3">Student & Filters</h5>
          <Row className="g-3">
            <Col md={6} lg={3}>
              <Form.Label>Select Student</Form.Label>
              <Select
                style={{ width: "100%" }}
                value={selectedStudent}
                onChange={setSelectedStudent}
                showSearch
                filterOption={(input, option) =>
                  option.children.toLowerCase().includes(input.toLowerCase())
                }
              >
                {students.map((student) => (
                  <Option key={student._id} value={student._id}>
                    {student.name} ({student.studentId})
                  </Option>
                ))}
              </Select>
            </Col>
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
              <Form.Label>Assessment Type</Form.Label>
              <Select
                style={{ width: "100%" }}
                placeholder="All types"
                allowClear
                value={filters.assessmentType}
                onChange={(value) => handleFilterChange("assessmentType", value)}
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
                className="w-100"
              >
                <ReloadOutlined /> Reset
              </Button>
              <Button
                variant="primary"
                onClick={handleDownloadReport}
                className="w-100"
              >
                <DownloadOutlined /> Report
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {progressData && (
        <>
          {/* Summary Statistics */}
          <Row className="mb-4">
            <Col md={6}>
              <Card className="shadow-sm h-100">
                <Card.Body className="text-center">
                  <Statistic
                    title="Average Score"
                    value={progressData.averageScore}
                    suffix="%"
                    valueStyle={{
                      color: progressData.averageScore >= 70 ? "#3f8600" : "#cf1322",
                    }}
                  />
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="shadow-sm h-100">
                <Card.Body className="text-center">
                  <Statistic
                    title="Assessments Completed"
                    value={progressData.totalAssessments}
                  />
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Progress Over Time */}
          <Row className="mb-4">
            <Col>
              <Card className="shadow-sm">
                <Card.Body>
                  <h5 className="mb-3">Progress Over Time</h5>
                  {progressData.progressOverTime &&
                  progressData.progressOverTime.length > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={progressData.progressOverTime}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="assessmentNumber"
                          label={{ value: "Assessment Number", position: "insideBottom", offset: -5 }}
                        />
                        <YAxis domain={[0, 100]} label={{ value: "Score (%)", angle: -90, position: "insideLeft" }} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white p-2 border rounded shadow-sm">
                                  <p className="mb-1"><strong>{data.assessmentTitle}</strong></p>
                                  <p className="mb-1">Score: {data.score.toFixed(1)}%</p>
                                  <p className="mb-0 text-muted">
                                    {dayjs(data.date).format("DD MMM YYYY")}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#8884d8"
                          strokeWidth={2}
                          name="Score (%)"
                          dot={{ r: 5 }}
                          activeDot={{ r: 7 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted text-center py-5">No progress data available</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Topic Performance */}
          <Row className="mb-4">
            <Col lg={8}>
              <Card className="shadow-sm h-100">
                <Card.Body>
                  <h5 className="mb-3">Topic Performance</h5>
                  {progressData.topicPerformance &&
                  progressData.topicPerformance.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart
                        data={progressData.topicPerformance}
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
                        <Bar dataKey="averageScore" fill="#8884d8" name="Average Score (%)" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted text-center py-5">No topic data available</p>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4}>
              <Card className="shadow-sm h-100">
                <Card.Body>
                  <h5 className="mb-3">Strengths & Weaknesses</h5>

                  <h6 className="text-success mb-2">Strengths</h6>
                  <ul className="list-unstyled mb-3">
                    {progressData.strengthsAndWeaknesses?.strengths?.map((item, idx) => (
                      <li key={idx} className="mb-2">
                        <Badge bg="success">{item.score}%</Badge>{" "}
                        <span className="small">{item.topic}</span>
                      </li>
                    ))}
                  </ul>

                  <h6 className="text-danger mb-2">Needs Improvement</h6>
                  <ul className="list-unstyled">
                    {progressData.strengthsAndWeaknesses?.weaknesses?.map((item, idx) => (
                      <li key={idx} className="mb-2">
                        <Badge bg="danger">{item.score}%</Badge>{" "}
                        <span className="small">{item.topic}</span>
                      </li>
                    ))}
                  </ul>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Topic Trends */}
          {progressData.topicPerformance && progressData.topicPerformance.length > 0 && (
            <Row>
              <Col>
                <Card className="shadow-sm">
                  <Card.Body>
                    <h5 className="mb-3">Topic Trends</h5>
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Topic</th>
                            <th>Average Score</th>
                            <th>Assessments</th>
                            <th>Trend</th>
                          </tr>
                        </thead>
                        <tbody>
                          {progressData.topicPerformance.map((topic, idx) => (
                            <tr key={idx}>
                              <td>{topic.topic}</td>
                              <td>
                                <Badge
                                  bg={
                                    topic.averageScore >= 75
                                      ? "success"
                                      : topic.averageScore >= 50
                                      ? "warning"
                                      : "danger"
                                  }
                                >
                                  {topic.averageScore.toFixed(1)}%
                                </Badge>
                              </td>
                              <td>{topic.assessmentCount}</td>
                              <td>
                                {getTrendIcon(topic.trend)}{" "}
                                <span className="text-capitalize">{topic.trend}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </>
      )}
    </div>
  );
};

export default StudentProgressView;
