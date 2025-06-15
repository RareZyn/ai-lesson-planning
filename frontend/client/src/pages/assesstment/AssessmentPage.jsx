// src/pages/assessment/AssessmentPage.jsx - With navigation to ActivityGenerated and RubricGenerated
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  message,
  Dropdown,
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
  DownOutlined,
  TrophyOutlined,
  MoreOutlined,
} from "@ant-design/icons";

// Lesson-Based Assessment Modals (requires existing lesson plan)
import LessonSelectionModal from "../../components/Modal/LessonBasedAssessment/LessonSelectionModal";

// Standalone Assessment Modals (no lesson plan required)
import ActivityInClassStandaloneModal from "../../components/Modal/StandaloneAssessment/ActivityInClassStandaloneModal";
import AssessmentStandaloneModal from "../../components/Modal/StandaloneAssessment/AssessmentStandaloneModal";
import EssayStandaloneModal from "../../components/Modal/StandaloneAssessment/EssayStandaloneModal";
import TextbookStandaloneModal from "../../components/Modal/StandaloneAssessment/TextbookStandaloneModal";

import "./AssessmentPage.css";

const { TabPane } = Tabs;
const { Search } = Input;
const { Option } = Select;

const AssessmentPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("lesson-based");

  // Lesson-Based Assessment Modal State
  const [isLessonSelectionModalVisible, setIsLessonSelectionModalVisible] =
    useState(false);

  // Standalone Assessment States
  const [isStandaloneOptionsVisible, setIsStandaloneOptionsVisible] =
    useState(false);
  const [activeStandaloneModal, setActiveStandaloneModal] = useState(null);

  // Sample lesson-based assessments data with different activity types
  const lessonBasedAssessments = [
    {
      id: 1,
      lessonPlanId: "684da7f4b96de6d12b6b124e",
      lessonTitle: "Making our school community safer",
      class: "5 Anggerik",
      grade: "Form 5",
      subject: "English",
      activityType: "assessment",
      assessmentType: "Monthly Test",
      questionCount: 25,
      duration: "60 minutes",
      status: "Generated",
      createdDate: "2025-06-15",
      difficulty: "Intermediate",
      skills: ["Reading", "Writing", "Critical Thinking"],
      hasActivity: true, // Indicates if activity is generated
      hasRubric: true, // Indicates if rubric is generated
    },
    {
      id: 2,
      lessonPlanId: "684da7f4b96de6d12b6b125f",
      lessonTitle: "An informal email to a friend about a celebrity I admire",
      class: "5 UM",
      grade: "Form 5",
      subject: "English",
      activityType: "essay",
      assessmentType: "Writing Assessment",
      questionCount: 3,
      duration: "45 minutes",
      status: "Generated",
      createdDate: "2025-06-14",
      difficulty: "Advanced",
      skills: ["Writing", "Creativity"],
      hasActivity: true,
      hasRubric: true,
    },
    {
      id: 3,
      lessonPlanId: "684da7f4b96de6d12b6b126g",
      lessonTitle: "Understanding different text types and their purposes",
      class: "Biruni",
      grade: "Form 5",
      subject: "English",
      activityType: "textbook",
      assessmentType: "Reading Comprehension",
      questionCount: 15,
      duration: "30 minutes",
      status: "Draft",
      createdDate: "2025-06-13",
      difficulty: "Intermediate",
      skills: ["Reading", "Analysis"],
      hasActivity: false,
      hasRubric: false,
    },
    {
      id: 4,
      lessonPlanId: "684da7f4b96de6d12b6b127h",
      lessonTitle: "Group discussion about cultural diversity",
      class: "5 UTHM",
      grade: "Form 5",
      subject: "English",
      activityType: "activity",
      assessmentType: "Group Activity Assessment",
      questionCount: 8,
      duration: "40 minutes",
      status: "Generated",
      createdDate: "2025-06-12",
      difficulty: "Intermediate",
      skills: ["Speaking", "Collaboration"],
      hasActivity: true,
      hasRubric: false,
    },
  ];

  // Standalone assessments data
  const standaloneAssessments = [
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
      hasActivity: true,
      hasRubric: true,
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
      hasActivity: true,
      hasRubric: true,
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
      hasActivity: false,
      hasRubric: false,
    },
    {
      id: 4,
      title: "Interactive Classroom Activities",
      subject: "English",
      grade: "Form 4",
      assessmentType: "Activity Assessment",
      questionCount: 6,
      duration: "50 minutes",
      status: "Generated",
      createdDate: "2025-06-07",
      difficulty: "Intermediate",
      skills: ["Speaking", "Listening", "Collaboration"],
      description: "Assessment through interactive classroom activities",
      hasActivity: true,
      hasRubric: false,
    },
  ];

  // Standalone assessment options
  const standaloneOptions = [
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

  // Navigation functions
  const handleViewActivity = (record) => {
    if (record.hasActivity) {
      navigate(`/app/assessment/activity/${record.id}`);
    } else {
      message.warning("No activity generated for this assessment yet.");
    }
  };

  const handleViewRubric = (record) => {
    if (record.hasRubric) {
      navigate(`/app/assessment/rubric/${record.id}`);
    } else {
      message.warning("No rubric generated for this assessment yet.");
    }
  };

  const handleEditAssessment = (record) => {
    message.info(`Edit functionality for assessment ${record.id}`);
    // TODO: Implement edit functionality
  };

  const handleDeleteAssessment = (record) => {
    Modal.confirm({
      title: "Are you sure you want to delete this assessment?",
      content: "This action cannot be undone.",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk() {
        message.success(
          `Assessment "${
            record.title || record.lessonTitle
          }" deleted successfully`
        );
        // TODO: Implement delete functionality
      },
    });
  };

  const handleGenerateActivity = (record) => {
    message.loading("Generating activity...", 2);
    // TODO: Implement activity generation
    setTimeout(() => {
      message.success("Activity generated successfully!");
      // Update the record to show it has activity
      record.hasActivity = true;
    }, 2000);
  };

  const handleGenerateRubric = (record) => {
    message.loading("Generating rubric...", 2);
    // TODO: Implement rubric generation
    setTimeout(() => {
      message.success("Rubric generated successfully!");
      // Update the record to show it has rubric
      record.hasRubric = true;
    }, 2000);
  };

  // Action menu for each row
  const getActionMenu = (record) => {
    const menuItems = [
      {
        key: "view-activity",
        label: "View Activity",
        icon: <FileTextOutlined />,
        disabled: !record.hasActivity,
        onClick: () => handleViewActivity(record),
      },
      {
        key: "view-rubric",
        label: "View Rubric",
        icon: <TrophyOutlined />,
        disabled: !record.hasRubric,
        onClick: () => handleViewRubric(record),
      },
      {
        type: "divider",
      },
      {
        key: "generate-activity",
        label: "Generate Activity",
        icon: <BulbOutlined />,
        disabled: record.hasActivity,
        onClick: () => handleGenerateActivity(record),
      },
      {
        key: "generate-rubric",
        label: "Generate Rubric",
        icon: <TrophyOutlined />,
        disabled: record.hasRubric,
        onClick: () => handleGenerateRubric(record),
      },
      {
        type: "divider",
      },
      {
        key: "edit",
        label: "Edit",
        icon: <EditOutlined />,
        onClick: () => handleEditAssessment(record),
      },
      {
        key: "delete",
        label: "Delete",
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => handleDeleteAssessment(record),
      },
    ];

    return {
      items: menuItems,
    };
  };

  // Columns for lesson-based assessments table
  const lessonBasedColumns = [
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
      title: "Progress",
      key: "progress",
      width: 120,
      render: (_, record) => (
        <div>
          <div style={{ marginBottom: 4 }}>
            <Tag
              color={record.hasActivity ? "success" : "default"}
              size="small"
            >
              {record.hasActivity ? "Activity ✓" : "Activity ✗"}
            </Tag>
          </div>
          <div>
            <Tag color={record.hasRubric ? "success" : "default"} size="small">
              {record.hasRubric ? "Rubric ✓" : "Rubric ✗"}
            </Tag>
          </div>
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
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            size="small"
            disabled={!record.hasActivity}
            onClick={() => handleViewActivity(record)}
            title="View Activity"
          />
          <Button
            type="text"
            icon={<TrophyOutlined />}
            size="small"
            disabled={!record.hasRubric}
            onClick={() => handleViewRubric(record)}
            title="View Rubric"
          />
          <Dropdown
            menu={getActionMenu(record)}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button type="text" icon={<MoreOutlined />} size="small" />
          </Dropdown>
        </Space>
      ),
    },
  ];

  // Columns for standalone assessments table
  const standaloneColumns = [
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
      title: "Progress",
      key: "progress",
      width: 120,
      render: (_, record) => (
        <div>
          <div style={{ marginBottom: 4 }}>
            <Tag
              color={record.hasActivity ? "success" : "default"}
              size="small"
            >
              {record.hasActivity ? "Activity ✓" : "Activity ✗"}
            </Tag>
          </div>
          <div>
            <Tag color={record.hasRubric ? "success" : "default"} size="small">
              {record.hasRubric ? "Rubric ✓" : "Rubric ✗"}
            </Tag>
          </div>
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
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            size="small"
            disabled={!record.hasActivity}
            onClick={() => handleViewActivity(record)}
            title="View Activity"
          />
          <Button
            type="text"
            icon={<TrophyOutlined />}
            size="small"
            disabled={!record.hasRubric}
            onClick={() => handleViewRubric(record)}
            title="View Rubric"
          />
          <Dropdown
            menu={getActionMenu(record)}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button type="text" icon={<MoreOutlined />} size="small" />
          </Dropdown>
        </Space>
      ),
    },
  ];

  // Handle create assessment button click
  const handleCreateAssessment = () => {
    if (activeTab === "lesson-based") {
      setIsLessonSelectionModalVisible(true);
    } else {
      setIsStandaloneOptionsVisible(true);
    }
  };

  // Handle standalone option selection
  const handleStandaloneOptionSelect = (optionId) => {
    setIsStandaloneOptionsVisible(false);
    setActiveStandaloneModal(optionId);
  };

  // Handle modal submissions
  const handleLessonBasedSubmit = (data) => {
    console.log("Lesson-Based Assessment data:", data);
    setIsLessonSelectionModalVisible(false);
    message.success("Assessment created successfully!");
  };

  const handleStandaloneModalSubmit = (data) => {
    console.log("Standalone Assessment data:", data);
    setActiveStandaloneModal(null);
    message.success("Assessment created successfully!");
  };

  // Close all modals
  const closeAllModals = () => {
    setIsLessonSelectionModalVisible(false);
    setIsStandaloneOptionsVisible(false);
    setActiveStandaloneModal(null);
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
                From Lesson Plans
              </span>
            }
            key="lesson-based"
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
                    <Option value="5-uthm">5 UTHM</Option>
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
                columns={lessonBasedColumns}
                dataSource={lessonBasedAssessments}
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
                Standalone Assessment
              </span>
            }
            key="standalone"
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
                    <Option value="activity">Activity Assessment</Option>
                  </Select>
                </div>
              </div>

              <Table
                columns={standaloneColumns}
                dataSource={standaloneAssessments}
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

      {/* Lesson-Based Assessment Modal (Entry Point) */}
      <LessonSelectionModal
        isOpen={isLessonSelectionModalVisible}
        onClose={() => setIsLessonSelectionModalVisible(false)}
        onSubmit={handleLessonBasedSubmit}
      />

      {/* Standalone Assessment Options Modal */}
      <Modal
        title="Choose Assessment Type"
        open={isStandaloneOptionsVisible}
        onCancel={() => setIsStandaloneOptionsVisible(false)}
        footer={null}
        width={800}
        className="creative-options-modal"
      >
        <div style={{ padding: "20px 0" }}>
          <p style={{ marginBottom: 24, color: "#666", textAlign: "center" }}>
            Select the type of assessment you would like to create:
          </p>
          <Row gutter={[16, 16]}>
            {standaloneOptions.map((option) => (
              <Col xs={24} sm={12} key={option.id}>
                <Card
                  hoverable
                  className="creative-option-card"
                  onClick={() => handleStandaloneOptionSelect(option.id)}
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

      {/* Standalone Assessment Modals */}
      <ActivityInClassStandaloneModal
        isOpen={activeStandaloneModal === "activity-in-class"}
        onClose={closeAllModals}
        onSubmit={handleStandaloneModalSubmit}
      />

      <AssessmentStandaloneModal
        isOpen={activeStandaloneModal === "assessment"}
        onClose={closeAllModals}
        onSubmit={handleStandaloneModalSubmit}
      />

      <EssayStandaloneModal
        isOpen={activeStandaloneModal === "essay"}
        onClose={closeAllModals}
        onSubmit={handleStandaloneModalSubmit}
      />

      <TextbookStandaloneModal
        isOpen={activeStandaloneModal === "textbook"}
        onClose={closeAllModals}
        onSubmit={handleStandaloneModalSubmit}
      />
    </div>
  );
};

export default AssessmentPage;
