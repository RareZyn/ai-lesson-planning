// src/pages/assessment/ActivityGenerated.jsx
import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Spin,
  Typography,
  Space,
  Divider,
  Tag,
  Alert,
  Row,
  Col,
  Collapse,
  Timeline,
  Steps,
} from "antd";
import {
  FileTextOutlined,
  DownloadOutlined,
  EditOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  UserOutlined,
  BookOutlined,
  CheckCircleOutlined,
  BulbOutlined,
  SettingOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import "./ActivityGenerated.css";

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;
const { Step } = Steps;

const ActivityGenerated = ({
  assessmentData,
  isLoading,
  onEdit,
  onDownload,
  onRegenerate,
}) => {
  const [generatedActivity, setGeneratedActivity] = useState(null);

  // Dummy generated activity data based on assessment parameters
  useEffect(() => {
    if (assessmentData && !isLoading) {
      // Simulate API response delay
      setTimeout(() => {
        setGeneratedActivity({
          id: `activity_${Date.now()}`,
          title: `${assessmentData.assessmentType || "Assessment"} Activity`,
          description:
            "AI-generated assessment activity based on your specifications",
          createdAt: new Date().toISOString(),
          estimatedDuration: assessmentData.timeAllocation
            ? `${assessmentData.timeAllocation} minutes`
            : "60 minutes",
          difficulty: assessmentData.difficultyLevel || "intermediate",
          skills: assessmentData.skills || [],
          questionTypes: assessmentData.questionTypes || [],

          // Activity Structure
          structure: {
            warmUp: {
              title: "Warm-up Activity (5 minutes)",
              activities: [
                "Quick vocabulary review related to the assessment topic",
                "Brief discussion to activate prior knowledge",
                "Mental preparation for the assessment",
              ],
            },
            mainActivity: {
              title: `Main Assessment Activity (${
                assessmentData.timeAllocation || 60
              } minutes)`,
              sections: [
                {
                  title: "Section A: Multiple Choice Questions",
                  duration: "20 minutes",
                  questions: Math.floor(
                    (assessmentData.numberOfQuestions || 20) * 0.4
                  ),
                  description: "Test comprehension and basic understanding",
                },
                {
                  title: "Section B: Short Answer Questions",
                  duration: "25 minutes",
                  questions: Math.floor(
                    (assessmentData.numberOfQuestions || 20) * 0.4
                  ),
                  description: "Assess deeper understanding and application",
                },
                {
                  title: "Section C: Extended Response",
                  duration: "15 minutes",
                  questions: Math.floor(
                    (assessmentData.numberOfQuestions || 20) * 0.2
                  ),
                  description: "Evaluate critical thinking and analysis skills",
                },
              ],
            },
            coolDown: {
              title: "Cool-down & Review (5 minutes)",
              activities: [
                "Quick self-reflection on performance",
                "Collection of assessment papers",
                "Brief feedback session",
              ],
            },
          },

          // Detailed Questions based on selected types
          questions: generateSampleQuestions(assessmentData),

          // Instructions for teachers
          teacherInstructions: {
            preparation: [
              "Ensure all materials are ready 15 minutes before the assessment",
              "Prepare answer sheets and any required tools",
              "Set up the classroom for optimal assessment conditions",
            ],
            during: [
              "Monitor students for any clarification needs",
              "Maintain a quiet, focused environment",
              "Note any irregularities or issues that arise",
            ],
            after: [
              "Collect all materials systematically",
              "Provide immediate feedback if appropriate",
              "Begin marking process using provided rubric",
            ],
          },

          // Student instructions
          studentInstructions: [
            "Read all instructions carefully before beginning",
            "Manage your time effectively across all sections",
            "Answer all questions to the best of your ability",
            "Check your work if time permits",
            "Ask for clarification if any instruction is unclear",
          ],

          // Assessment criteria
          assessmentCriteria: {
            knowledge:
              "Demonstrates understanding of key concepts and vocabulary",
            comprehension: "Shows ability to interpret and explain information",
            application: "Can apply knowledge to new situations or contexts",
            analysis:
              "Able to break down information and identify relationships",
            evaluation: "Can make judgments and provide justified opinions",
          },

          // Materials needed
          materialsNeeded: [
            "Assessment papers (printed)",
            "Answer sheets",
            "Writing materials (pens, pencils)",
            "Timer or clock",
            assessmentData.literatureComponent && "Literature texts",
            "Marking rubric for teachers",
          ].filter(Boolean),
        });
      }, 2000);
    }
  }, [assessmentData, isLoading]);

  // Helper function to generate sample questions
  function generateSampleQuestions(data) {
    const questions = [];
    const totalQuestions = data.numberOfQuestions || 20;

    // Generate different types based on selected question types
    if (data.questionTypes?.includes("multiple_choice")) {
      for (let i = 1; i <= Math.floor(totalQuestions * 0.4); i++) {
        questions.push({
          id: `mcq_${i}`,
          type: "Multiple Choice",
          question: `Sample multiple choice question ${i} related to ${
            data.specificTopic || "the lesson topic"
          }.`,
          options: ["Option A", "Option B", "Option C", "Option D"],
          correctAnswer: "A",
          points: 1,
          skill:
            data.skills?.[Math.floor(Math.random() * data.skills.length)] ||
            "reading",
        });
      }
    }

    if (data.questionTypes?.includes("short_answer")) {
      for (let i = 1; i <= Math.floor(totalQuestions * 0.4); i++) {
        questions.push({
          id: `sa_${i}`,
          type: "Short Answer",
          question: `Explain the significance of [concept] in the context of ${
            data.specificTopic || "the lesson"
          }.`,
          expectedLength: "2-3 sentences",
          points: 3,
          skill:
            data.skills?.[Math.floor(Math.random() * data.skills.length)] ||
            "writing",
        });
      }
    }

    if (data.questionTypes?.includes("essay_writing")) {
      for (let i = 1; i <= Math.floor(totalQuestions * 0.2); i++) {
        questions.push({
          id: `essay_${i}`,
          type: "Essay",
          question: `Write a well-structured essay discussing [topic]. Support your arguments with relevant examples.`,
          expectedLength: "200-250 words",
          points: 10,
          skill: "writing",
        });
      }
    }

    return questions;
  }

  if (isLoading) {
    return (
      <div className="activity-loading">
        <Spin size="large" />
        <Title level={4} style={{ marginTop: 16, color: "#666" }}>
          Generating Assessment Activity...
        </Title>
        <Paragraph type="secondary">
          Our AI is creating a customized assessment activity based on your
          specifications.
        </Paragraph>
      </div>
    );
  }

  if (!generatedActivity) {
    return (
      <div className="activity-placeholder">
        <FileTextOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />
        <Title level={4} type="secondary">
          No Activity Generated
        </Title>
        <Paragraph type="secondary">
          Select assessment parameters and click "Generate" to create an
          activity.
        </Paragraph>
      </div>
    );
  }

  return (
    <div className="activity-generated">
      {/* Header Section */}
      <Card className="activity-header-card">
        <div className="activity-header">
          <div className="header-info">
            <Title level={3} style={{ margin: 0, color: "#1890ff" }}>
              <FileTextOutlined /> {generatedActivity.title}
            </Title>
            <Paragraph type="secondary" style={{ margin: "8px 0 16px 0" }}>
              {generatedActivity.description}
            </Paragraph>
            <Space wrap>
              <Tag icon={<ClockCircleOutlined />} color="blue">
                {generatedActivity.estimatedDuration}
              </Tag>
              <Tag
                icon={<BarChartOutlined />}
                color={
                  generatedActivity.difficulty === "advanced"
                    ? "red"
                    : generatedActivity.difficulty === "intermediate"
                    ? "orange"
                    : "green"
                }
              >
                {generatedActivity.difficulty.charAt(0).toUpperCase() +
                  generatedActivity.difficulty.slice(1)}
              </Tag>
              <Tag icon={<UserOutlined />} color="purple">
                {generatedActivity.questions.length} Questions
              </Tag>
            </Space>
          </div>
          <div className="header-actions">
            <Space direction="vertical">
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={() => onDownload?.(generatedActivity)}
                size="large"
              >
                Download
              </Button>
              <Button
                icon={<EditOutlined />}
                onClick={() => onEdit?.(generatedActivity)}
              >
                Edit
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => onRegenerate?.(assessmentData)}
              >
                Regenerate
              </Button>
            </Space>
          </div>
        </div>
      </Card>

      {/* Skills & Question Types Overview */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card
            size="small"
            title={
              <>
                <SettingOutlined /> Skills Assessed
              </>
            }
          >
            <Space wrap>
              {generatedActivity.skills.map((skill) => (
                <Tag key={skill} color="cyan">
                  {skill}
                </Tag>
              ))}
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            size="small"
            title={
              <>
                <BulbOutlined /> Question Types
              </>
            }
          >
            <Space wrap>
              {generatedActivity.questionTypes.map((type) => (
                <Tag key={type} color="geekblue">
                  {type.replace("_", " ")}
                </Tag>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Activity Structure */}
      <Card
        title={
          <>
            <BookOutlined /> Activity Structure
          </>
        }
        style={{ marginBottom: 24 }}
      >
        <Steps direction="vertical" size="small">
          <Step
            title={generatedActivity.structure.warmUp.title}
            description={
              <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                {generatedActivity.structure.warmUp.activities.map(
                  (activity, index) => (
                    <li key={index} style={{ marginBottom: 4 }}>
                      {activity}
                    </li>
                  )
                )}
              </ul>
            }
            status="finish"
            icon={<ClockCircleOutlined />}
          />
          <Step
            title={generatedActivity.structure.mainActivity.title}
            description={
              <div style={{ marginTop: 8 }}>
                {generatedActivity.structure.mainActivity.sections.map(
                  (section, index) => (
                    <Card key={index} size="small" style={{ marginBottom: 8 }}>
                      <Title level={5} style={{ margin: 0, marginBottom: 4 }}>
                        {section.title}
                      </Title>
                      <Space>
                        <Tag color="blue">{section.duration}</Tag>
                        <Tag color="green">{section.questions} questions</Tag>
                      </Space>
                      <Paragraph
                        type="secondary"
                        style={{ margin: "8px 0 0 0", fontSize: 13 }}
                      >
                        {section.description}
                      </Paragraph>
                    </Card>
                  )
                )}
              </div>
            }
            status="process"
            icon={<FileTextOutlined />}
          />
          <Step
            title={generatedActivity.structure.coolDown.title}
            description={
              <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                {generatedActivity.structure.coolDown.activities.map(
                  (activity, index) => (
                    <li key={index} style={{ marginBottom: 4 }}>
                      {activity}
                    </li>
                  )
                )}
              </ul>
            }
            status="wait"
            icon={<CheckCircleOutlined />}
          />
        </Steps>
      </Card>

      {/* Detailed Instructions */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Teacher Instructions" size="small">
            <Collapse size="small" ghost>
              <Panel header="Before Assessment" key="before">
                <ul style={{ paddingLeft: 20, margin: 0 }}>
                  {generatedActivity.teacherInstructions.preparation.map(
                    (instruction, index) => (
                      <li key={index} style={{ marginBottom: 8 }}>
                        {instruction}
                      </li>
                    )
                  )}
                </ul>
              </Panel>
              <Panel header="During Assessment" key="during">
                <ul style={{ paddingLeft: 20, margin: 0 }}>
                  {generatedActivity.teacherInstructions.during.map(
                    (instruction, index) => (
                      <li key={index} style={{ marginBottom: 8 }}>
                        {instruction}
                      </li>
                    )
                  )}
                </ul>
              </Panel>
              <Panel header="After Assessment" key="after">
                <ul style={{ paddingLeft: 20, margin: 0 }}>
                  {generatedActivity.teacherInstructions.after.map(
                    (instruction, index) => (
                      <li key={index} style={{ marginBottom: 8 }}>
                        {instruction}
                      </li>
                    )
                  )}
                </ul>
              </Panel>
            </Collapse>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Student Instructions" size="small">
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              {generatedActivity.studentInstructions.map(
                (instruction, index) => (
                  <li key={index} style={{ marginBottom: 12, lineHeight: 1.5 }}>
                    {instruction}
                  </li>
                )
              )}
            </ul>
          </Card>
        </Col>
      </Row>

      {/* Assessment Criteria */}
      <Card title="Assessment Criteria" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          {Object.entries(generatedActivity.assessmentCriteria).map(
            ([criterion, description]) => (
              <Col xs={24} sm={12} md={8} key={criterion}>
                <Card size="small" className="criteria-card">
                  <Title
                    level={5}
                    style={{
                      margin: 0,
                      marginBottom: 8,
                      textTransform: "capitalize",
                    }}
                  >
                    {criterion}
                  </Title>
                  <Paragraph
                    type="secondary"
                    style={{ margin: 0, fontSize: 13 }}
                  >
                    {description}
                  </Paragraph>
                </Card>
              </Col>
            )
          )}
        </Row>
      </Card>

      {/* Sample Questions Preview */}
      <Card title="Sample Questions Preview" style={{ marginBottom: 24 }}>
        <Alert
          message="Question Preview"
          description="These are sample questions generated based on your specifications. The final assessment will contain similar questions tailored to your specific requirements."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Collapse>
          {generatedActivity.questions.slice(0, 3).map((question, index) => (
            <Panel
              header={
                <Space>
                  <Tag color="blue">{question.type}</Tag>
                  <Tag color="green">{question.points} pts</Tag>
                  <span>Sample Question {index + 1}</span>
                </Space>
              }
              key={question.id}
            >
              <div style={{ marginBottom: 12 }}>
                <Text strong>Question:</Text>
                <Paragraph style={{ marginTop: 8 }}>
                  {question.question}
                </Paragraph>
              </div>

              {question.options && (
                <div style={{ marginBottom: 12 }}>
                  <Text strong>Options:</Text>
                  <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                    {question.options.map((option, idx) => (
                      <li
                        key={idx}
                        style={{
                          marginBottom: 4,
                          color:
                            question.correctAnswer ===
                            String.fromCharCode(65 + idx)
                              ? "#52c41a"
                              : "inherit",
                          fontWeight:
                            question.correctAnswer ===
                            String.fromCharCode(65 + idx)
                              ? "bold"
                              : "normal",
                        }}
                      >
                        {option}
                        {question.correctAnswer ===
                          String.fromCharCode(65 + idx) && " ✓"}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {question.expectedLength && (
                <div style={{ marginBottom: 12 }}>
                  <Text strong>Expected Length:</Text>
                  <Text style={{ marginLeft: 8 }}>
                    {question.expectedLength}
                  </Text>
                </div>
              )}

              <div>
                <Text strong>Skill Focus:</Text>
                <Tag color="purple" style={{ marginLeft: 8 }}>
                  {question.skill}
                </Tag>
              </div>
            </Panel>
          ))}
        </Collapse>

        {generatedActivity.questions.length > 3 && (
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <Text type="secondary">
              ... and {generatedActivity.questions.length - 3} more questions in
              the full assessment
            </Text>
          </div>
        )}
      </Card>

      {/* Materials Needed */}
      <Card title="Materials Needed">
        <Row>
          <Col span={24}>
            <Space wrap>
              {generatedActivity.materialsNeeded.map((material, index) => (
                <Tag key={index} icon={<CheckCircleOutlined />} color="success">
                  {material}
                </Tag>
              ))}
            </Space>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default ActivityGenerated;
