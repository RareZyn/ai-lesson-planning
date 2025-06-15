// src/pages/assessment/AssessmentPage.jsx - Updated with proper modal flow
import React, { useState } from "react";
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Tabs,
  Input,
  Select,
  Modal,
  Row,
  Col,
} from "antd";
import {
  FileTextOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  BookOutlined,
  BulbOutlined,
  SearchOutlined,
  ThunderboltOutlined,
  EditOutlined as EditIcon,
  FileTextOutlined as FileIcon,
  BookOutlined as BookIcon,
} from "@ant-design/icons";

// Lesson Planner Assessment Modals
import LessonPlannerAssessmentModal from "../../components/Modal/AssessmentCreative/LessonPlannerAssessmentModal";

// Creative Assessment Modals
import ActivityInClassModal from "../../components/Modal/AssessmentCreative/ActivityInClassModal";
import AssessmentModal from "../../components/Modal/AssessmentCreative/AssesstmentModal";
import EssayModal from "../../components/Modal/AssessmentCreative/EssayModal";
import TextBookModal from "../../components/Modal/AssessmentCreative/TextBookModal";

import "./AssessmentPage.css";

const { TabPane } = Tabs;
const { Search } = Input;
const { Option } = Select;

const AssessmentPage = () => {
  const [activeTab, setActiveTab] = useState("lesson-planner");

  // Lesson Planner Modal State
  const [isLessonPlannerModalVisible, setIsLessonPlannerModalVisible] =
    useState(false);

  // Creative Assessment States
  const [isCreativeOptionsVisible, setIsCreativeOptionsVisible] =
    useState(false);
  const [activeCreativeModal, setActiveCreativeModal] = useState(null);

  // Sample lesson planner data with different activity types
  const lessonPlannerAssessments = [
    {
      id: 1,
      lessonPlanId: "684da7f4b96de6d12b6b124e",
      lessonTitle: "Making our school community safer",
      class: "5 Anggerik",
      grade: "Form 5",
      subject: "English",
      activityType: "assessment", // This determines which modal to show
      assessmentType: "Monthly Test",
      questionCount: 25,
      duration: "60 minutes",
      status: "Generated",
      createdDate: "2025-06-15",
      difficulty: "Intermediate",
      skills: ["Reading", "Writing", "Critical Thinking"],
    },
    {
      id: 2,
      lessonPlanId: "684da7f4b96de6d12b6b125f",
      lessonTitle: "An informal email to a friend about a celebrity I admire",
      class: "5 UM",
      grade: "Form 5",
      subject: "English",
      activityType: "essay", // Essay type
      assessmentType: "Writing Assessment",
      questionCount: 3,
      duration: "45 minutes",
      status: "Generated",
      createdDate: "2025-06-14",
      difficulty: "Advanced",
      skills: ["Writing", "Creativity"],
    },
    {
      id: 3,
      lessonPlanId: "684da7f4b96de6d12b6b126g",
      lessonTitle: "Understanding different text types and their purposes",
      class: "Biruni",
      grade: "Form 5",
      subject: "English",
      activityType: "textbook", // Textbook type
      assessmentType: "Reading Comprehension",
      questionCount: 15,
      duration: "30 minutes",
      status: "Draft",
      createdDate: "2025-06-13",
      difficulty: "Intermediate",
      skills: ["Reading", "Analysis"],
    },
  ];

  // Creative assessments data
  const creativeAssessments = [
    {
      id: 1,
      title: "General English Proficiency Test",
      subject: "English",
      grade: "Form 4",
      assessmentType: "Comprehensive Test",
      questionCount: 40,
      duration: "90 minutes",
      status: "Generated",
      createdDate: "2025-06-12",
      difficulty: "Intermediate",
      skills: ["Reading", "Writing", "Grammar", "Vocabulary"],
      description: "Comprehensive assessment covering all language skills",
    },
    {
      id: 2,
      title: "Creative Writing Portfolio Assessment",
      subject: "English",
      grade: "Form 5",
      assessmentType: "Portfolio Assessment",
      questionCount: 5,
      duration: "120 minutes",
      status: "Generated",
      createdDate: "2025-06-10",
      difficulty: "Advanced",
      skills: ["Writing", "Creativity", "Critical Thinking"],
      description: "Assessment focusing on creative writing abilities",
    },
    {
      id: 3,
      title: "Literature Analysis Skills Test",
      subject: "English",
      grade: "Form 5",
      assessmentType: "Literature Analysis",
      questionCount: 12,
      duration: "75 minutes",
      status: "Draft",
      createdDate: "2025-06-08",
      difficulty: "Advanced",
      skills: ["Literature", "Analysis", "Critical Thinking"],
      description: "Deep analysis of literary works and themes",
    },
  ];

  // Creative assessment options
  const creativeOptions = [
    {
      id: "activity-in-class",
      title: "Activity in Class",
      description:
        "Interactive classroom activities with group work and discussions",
      icon: <ThunderboltOutlined />,
      color: "#ff4757",
    },
    {
      id: "assessment",
      title: "Assessment",
      description: "Comprehensive assessments with various question types",
      icon: <FileIcon />,
      color: "#42a5f5",
    },
    {
      id: "essay",
      title: "Essay",
      description: "Writing assignments and essay-based assessments",
      icon: <EditIcon />,
      color: "#ffa726",
    },
    {
      id: "textbook",
      title: "Textbook",
      description: "Textbook-based activities and exercises",
      icon: <BookIcon />,
      color: "#66bb6a",
    },
  ];

  // Columns for lesson planner assessments table
  const lessonPlannerColumns = [
    {
      title: "Lesson Plan",
      dataIndex: "lessonTitle",
      key: "lessonTitle",
      width: 250,
      render: (text, record) => (
        <div>
          <div className="lesson-title">{text}</div>
          <div className="lesson-meta">
            <Tag color="blue">{record.class}</Tag>
            <Tag color="green">{record.grade}</Tag>
            <Tag color="purple">{record.activityType}</Tag>
          </div>
        </div>
      ),
    },
    {
      title: "Assessment Details",
      key: "assessmentDetails",
      width: 200,
      render: (_, record) => (
        <div>
          <div className="assessment-type">{record.assessmentType}</div>
          <div className="assessment-info">
            {record.questionCount} questions • {record.duration}
          </div>
        </div>
      ),
    },
    {
      title: "Skills",
      dataIndex: "skills",
      key: "skills",
      width: 150,
      render: (skills) => (
        <div>
          {skills.slice(0, 2).map((skill) => (
            <Tag key={skill} size="small" color="purple">
              {skill}
            </Tag>
          ))}
          {skills.length > 2 && (
            <Tag size="small" color="default">
              +{skills.length - 2}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Difficulty",
      dataIndex: "difficulty",
      key: "difficulty",
      width: 100,
      render: (difficulty) => {
        const color =
          difficulty === "Advanced"
            ? "red"
            : difficulty === "Intermediate"
            ? "orange"
            : "green";
        return <Tag color={color}>{difficulty}</Tag>;
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) => {
        const color = status === "Generated" ? "success" : "processing";
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "Created",
      dataIndex: "createdDate",
      key: "createdDate",
      width: 120,
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<EyeOutlined />} size="small" />
          <Button type="text" icon={<EditOutlined />} size="small" />
          <Button type="text" icon={<DeleteOutlined />} size="small" danger />
        </Space>
      ),
    },
  ];

  // Columns for creative assessments table
  const creativeColumns = [
    {
      title: "Assessment Title",
      dataIndex: "title",
      key: "title",
      width: 250,
      render: (text, record) => (
        <div>
          <div className="assessment-title">{text}</div>
          <div className="assessment-description">{record.description}</div>
          <div className="assessment-meta">
            <Tag color="blue">{record.subject}</Tag>
            <Tag color="green">{record.grade}</Tag>
          </div>
        </div>
      ),
    },
    {
      title: "Assessment Details",
      key: "assessmentDetails",
      width: 200,
      render: (_, record) => (
        <div>
          <div className="assessment-type">{record.assessmentType}</div>
          <div className="assessment-info">
            {record.questionCount} questions • {record.duration}
          </div>
        </div>
      ),
    },
    {
      title: "Skills",
      dataIndex: "skills",
      key: "skills",
      width: 150,
      render: (skills) => (
        <div>
          {skills.slice(0, 2).map((skill) => (
            <Tag key={skill} size="small" color="purple">
              {skill}
            </Tag>
          ))}
          {skills.length > 2 && (
            <Tag size="small" color="default">
              +{skills.length - 2}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Difficulty",
      dataIndex: "difficulty",
      key: "difficulty",
      width: 100,
      render: (difficulty) => {
        const color =
          difficulty === "Advanced"
            ? "red"
            : difficulty === "Intermediate"
            ? "orange"
            : "green";
        return <Tag color={color}>{difficulty}</Tag>;
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) => {
        const color = status === "Generated" ? "success" : "processing";
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "Created",
      dataIndex: "createdDate",
      key: "createdDate",
      width: 120,
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<EyeOutlined />} size="small" />
          <Button type="text" icon={<EditOutlined />} size="small" />
          <Button type="text" icon={<DeleteOutlined />} size="small" danger />
        </Space>
      ),
    },
  ];

  // Handle create assessment button click
  const handleCreateAssessment = () => {
    if (activeTab === "lesson-planner") {
      setIsLessonPlannerModalVisible(true);
    } else {
      setIsCreativeOptionsVisible(true);
    }
  };

  // Handle creative option selection
  const handleCreativeOptionSelect = (optionId) => {
    setIsCreativeOptionsVisible(false);
    setActiveCreativeModal(optionId);
  };

  // Handle modal submissions
  const handleLessonPlannerSubmit = (data) => {
    console.log("Lesson Planner Assessment data:", data);
    setIsLessonPlannerModalVisible(false);
  };

  const handleCreativeModalSubmit = (data) => {
    console.log("Creative Assessment data:", data);
    setActiveCreativeModal(null);
  };

  // Close all modals
  const closeAllModals = () => {
    setIsLessonPlannerModalVisible(false);
    setIsCreativeOptionsVisible(false);
    setActiveCreativeModal(null);
  };

  return (
    <div className="assessment-page">
      <div className="page-header">
        <div className="header-content">
          <div className="header-info">
            <h2>
              <FileTextOutlined /> Assessment Management
            </h2>
            <p>Create and manage assessments for your classes</p>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={handleCreateAssessment}
            className="create-btn"
          >
            Create Assessment
          </Button>
        </div>
      </div>

      <Card className="main-content-card">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          className="assessment-tabs"
        >
          <TabPane
            tab={
              <span>
                <BookOutlined />
                By Lesson Planner
              </span>
            }
            key="lesson-planner"
          >
            <div className="tab-content">
              <div className="filters-section">
                <div className="filters-row">
                  <Search
                    placeholder="Search lesson plans..."
                    allowClear
                    style={{ width: 300 }}
                    prefix={<SearchOutlined />}
                  />
                  <Select
                    placeholder="Filter by class"
                    style={{ width: 150 }}
                    allowClear
                  >
                    <Option value="5-anggerik">5 Anggerik</Option>
                    <Option value="5-um">5 UM</Option>
                    <Option value="biruni">Biruni</Option>
                  </Select>
                  <Select
                    placeholder="Filter by activity type"
                    style={{ width: 180 }}
                    allowClear
                  >
                    <Option value="assessment">Assessment</Option>
                    <Option value="essay">Essay</Option>
                    <Option value="textbook">Textbook</Option>
                    <Option value="activity">Activity</Option>
                  </Select>
                  <Select
                    placeholder="Filter by status"
                    style={{ width: 150 }}
                    allowClear
                  >
                    <Option value="generated">Generated</Option>
                    <Option value="draft">Draft</Option>
                  </Select>
                </div>
              </div>

              <Table
                columns={lessonPlannerColumns}
                dataSource={lessonPlannerAssessments}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `Total ${total} assessments`,
                }}
                className="assessment-table"
              />
            </div>
          </TabPane>

          <TabPane
            tab={
              <span>
                <BulbOutlined />
                Creative Assessment
              </span>
            }
            key="creative"
          >
            <div className="tab-content">
              <div className="filters-section">
                <div className="filters-row">
                  <Search
                    placeholder="Search assessments..."
                    allowClear
                    style={{ width: 300 }}
                    prefix={<SearchOutlined />}
                  />
                  <Select
                    placeholder="Filter by grade"
                    style={{ width: 150 }}
                    allowClear
                  >
                    <Option value="form4">Form 4</Option>
                    <Option value="form5">Form 5</Option>
                  </Select>
                  <Select
                    placeholder="Filter by type"
                    style={{ width: 200 }}
                    allowClear
                  >
                    <Option value="comprehensive">Comprehensive Test</Option>
                    <Option value="portfolio">Portfolio Assessment</Option>
                    <Option value="literature">Literature Analysis</Option>
                  </Select>
                </div>
              </div>

              <Table
                columns={creativeColumns}
                dataSource={creativeAssessments}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `Total ${total} assessments`,
                }}
                className="assessment-table"
              />
            </div>
          </TabPane>
        </Tabs>
      </Card>

      {/* Lesson Planner Assessment Modal */}
      <LessonPlannerAssessmentModal
        isOpen={isLessonPlannerModalVisible}
        onClose={() => setIsLessonPlannerModalVisible(false)}
        onSubmit={handleLessonPlannerSubmit}
      />

      {/* Creative Assessment Options Modal */}
      <Modal
        title="Choose Assessment Type"
        open={isCreativeOptionsVisible}
        onCancel={() => setIsCreativeOptionsVisible(false)}
        footer={null}
        width={800}
        className="creative-options-modal"
      >
        <div style={{ padding: "20px 0" }}>
          <p style={{ marginBottom: 24, color: "#666", textAlign: "center" }}>
            Select the type of assessment you would like to create:
          </p>
          <Row gutter={[16, 16]}>
            {creativeOptions.map((option) => (
              <Col xs={24} sm={12} key={option.id}>
                <Card
                  hoverable
                  className="creative-option-card"
                  onClick={() => handleCreativeOptionSelect(option.id)}
                  style={{
                    textAlign: "center",
                    border: "2px solid #f0f0f0",
                    borderRadius: "12px",
                    transition: "all 0.3s ease",
                  }}
                  bodyStyle={{ padding: "24px 16px" }}
                >
                  <div
                    style={{
                      fontSize: "48px",
                      color: option.color,
                      marginBottom: "16px",
                    }}
                  >
                    {option.icon}
                  </div>
                  <h3
                    style={{
                      margin: "0 0 8px 0",
                      color: "#262626",
                      fontSize: "18px",
                    }}
                  >
                    {option.title}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      color: "#666",
                      fontSize: "14px",
                      lineHeight: 1.4,
                    }}
                  >
                    {option.description}
                  </p>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </Modal>

      {/* Creative Assessment Modals */}
      <ActivityInClassModal
        isOpen={activeCreativeModal === "activity-in-class"}
        onClose={closeAllModals}
        onSubmit={handleCreativeModalSubmit}
      />

      <AssessmentModal
        isOpen={activeCreativeModal === "assessment"}
        onClose={closeAllModals}
        onSubmit={handleCreativeModalSubmit}
      />

      <EssayModal
        isOpen={activeCreativeModal === "essay"}
        onClose={closeAllModals}
        onSubmit={handleCreativeModalSubmit}
      />

      <TextBookModal
        isOpen={activeCreativeModal === "textbook"}
        onClose={closeAllModals}
        onSubmit={handleCreativeModalSubmit}
      />
    </div>
  );
};

export default AssessmentPage;
