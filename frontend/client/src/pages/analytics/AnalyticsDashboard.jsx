// frontend/client/src/pages/analytics/AnalyticsDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Tabs,
  Tab,
  Spinner,
  Alert,
} from "react-bootstrap";
import { Select, message } from "antd";
import { BarChartOutlined, UserOutlined } from "@ant-design/icons";
import ClassAnalyticsView from "./ClassAnalyticsView";
import StudentProgressView from "./StudentProgressView";
import axios from "axios";
import "./AnalyticsDashboard.css";

const { Option } = Select;

const AnalyticsDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [activeTab, setActiveTab] = useState("class");
  const [error, setError] = useState(null);

  // Fetch user's classes
  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/classes", {
        withCredentials: true,
      });

      if (response.data.success && response.data.data.length > 0) {
        setClasses(response.data.data);
        // Set last class as default
        setSelectedClass(response.data.data[response.data.data.length - 1]._id);
      } else {
        setError("No classes found. Please create a class first.");
      }
    } catch (err) {
      console.error("Error fetching classes:", err);
      setError("Failed to load classes");
      message.error("Failed to load classes");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading analytics dashboard...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          <Alert.Heading>No Data Available</Alert.Heading>
          <p>{error}</p>
          <Button
            variant="primary"
            onClick={() => navigate("/app/classes")}
          >
            Go to Classes
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="analytics-dashboard py-4">
      {/* Header Section */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <div>
              <h2 className="mb-1">
                <BarChartOutlined className="me-2" />
                Performance Analytics
              </h2>
              <p className="text-muted">
                Track student progress and class performance
              </p>
            </div>
          </div>
        </Col>
      </Row>

      {/* Class Selector */}
      <Row className="mb-4">
        <Col md={6} lg={4}>
          <Card className="shadow-sm">
            <Card.Body>
              <Form.Group>
                <Form.Label className="fw-bold">Select Class</Form.Label>
                <Select
                  size="large"
                  value={selectedClass}
                  onChange={setSelectedClass}
                  style={{ width: "100%" }}
                  placeholder="Choose a class"
                >
                  {classes.map((cls) => (
                    <Option key={cls._id} value={cls._id}>
                      {cls.className} - {cls.grade} ({cls.subject})
                    </Option>
                  ))}
                </Select>
              </Form.Group>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tabs for Class vs Student View */}
      <Card className="shadow-sm">
        <Card.Body>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-3"
          >
            <Tab
              eventKey="class"
              title={
                <span>
                  <BarChartOutlined className="me-2" />
                  Class Analytics
                </span>
              }
            >
              {selectedClass && <ClassAnalyticsView classId={selectedClass} />}
            </Tab>
            <Tab
              eventKey="student"
              title={
                <span>
                  <UserOutlined className="me-2" />
                  Student Progress
                </span>
              }
            >
              {selectedClass && (
                <StudentProgressView classId={selectedClass} />
              )}
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AnalyticsDashboard;
