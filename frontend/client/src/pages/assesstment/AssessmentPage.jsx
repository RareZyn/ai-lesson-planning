// src/pages/assessment/AssessmentPage.jsx
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
  DatePicker,
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
} from "@ant-design/icons";
import AssessmentModal from "../../components/Modal/AssessmentCreative/AssesstmentModal";
import LessonPlannerAssessmentModal from "../../components/Modal/AssessmentCreative/LessonPlannerAssessmentModal";
import "./AssessmentPage.css";

const { TabPane } = Tabs;
const { Search } = Input;
const { Option } = Select;

const AssessmentPage = () => {
  const [activeTab, setActiveTab] = useState("lesson-planner");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLessonPlannerModalVisible, setIsLessonPlannerModalVisible] =
    useState(false);

  // Dummy data for assessments by lesson planner
  const lessonPlannerAssessments = [
    {
      id: 1,
      lessonPlanId: "684da7f4b96de6d12b6b124e",
      lessonTitle: "Making our school community safer",
      class: "5 Anggerik",
      grade: "Form 5",
      subject: "English",
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
      assessmentType: "Reading Comprehension",
      questionCount: 15,
      duration: "30 minutes",
      status: "Draft",
      createdDate: "2025-06-13",
      difficulty: "Intermediate",
      skills: ["Reading", "Analysis"],
    },
  ];

  // Dummy data for creative assessments
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

  const handleCreateAssessment = () => {
    if (activeTab === "lesson-planner") {
      setIsLessonPlannerModalVisible(true);
    } else {
      setIsModalVisible(true);
    }
  };

  const handleModalSubmit = (data) => {
    console.log("Assessment data:", data);
    setIsModalVisible(false);
    setIsLessonPlannerModalVisible(false);
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

      {/* Creative Assessment Modal */}
      <AssessmentModal
        isOpen={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSubmit={handleModalSubmit}
      />

      {/* Lesson Planner Assessment Modal */}
      <LessonPlannerAssessmentModal
        isOpen={isLessonPlannerModalVisible}
        onClose={() => setIsLessonPlannerModalVisible(false)}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
};

export default AssessmentPage;
