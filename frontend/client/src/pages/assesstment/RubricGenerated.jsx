// src/pages/assessment/RubricGenerated.jsx
import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Spin,
  Typography,
  Space,
  Table,
  Tag,
  Alert,
  Row,
  Col,
  Divider,
  Progress,
  Statistic,
  Tooltip,
} from "antd";
import {
  FileTextOutlined,
  DownloadOutlined,
  EditOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  StarOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  TrophyOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import "./RubricGenerated.css";

const { Title, Paragraph, Text } = Typography;

const RubricGenerated = ({
  activityData,
  isLoading,
  onEdit,
  onDownload,
  onRegenerate,
}) => {
  const [generatedRubric, setGeneratedRubric] = useState(null);

  // Generate rubric data based on activity
  useEffect(() => {
    if (activityData && !isLoading) {
      setTimeout(() => {
        setGeneratedRubric({
          id: `rubric_${Date.now()}`,
          title: `Assessment Rubric - ${
            activityData.title || "Assessment Activity"
          }`,
          description:
            "Comprehensive marking rubric with clear criteria and performance levels",
          createdAt: new Date().toISOString(),
          totalPoints: calculateTotalPoints(activityData),

          // Performance Levels
          performanceLevels: [
            {
              level: "Excellent",
              range: "90-100%",
              color: "#52c41a",
              description: "Exceeds expectations with outstanding performance",
            },
            {
              level: "Good",
              range: "70-89%",
              color: "#1890ff",
              description: "Meets expectations with solid performance",
            },
            {
              level: "Satisfactory",
              range: "50-69%",
              color: "#faad14",
              description: "Approaches expectations with basic performance",
            },
            {
              level: "Needs Improvement",
              range: "0-49%",
              color: "#ff4d4f",
              description:
                "Below expectations, requires significant improvement",
            },
          ],

          // Assessment Criteria with detailed rubric
          criteria: generateRubricCriteria(activityData),

          // Grade boundaries
          gradeBoundaries: {
            A: { min: 90, max: 100, description: "Excellent achievement" },
            B: { min: 70, max: 89, description: "Good achievement" },
            C: { min: 50, max: 69, description: "Satisfactory achievement" },
            D: { min: 30, max: 49, description: "Minimum achievement" },
            E: { min: 0, max: 29, description: "Below minimum standard" },
          },

          // Marking guidelines
          markingGuidelines: [
            "Read through all student responses before beginning detailed marking",
            "Use the rubric consistently for all students",
            "Provide specific feedback for each criterion",
            "Consider partial credit for partially correct responses",
            "Maintain objectivity and fairness throughout the marking process",
          ],

          // Common feedback phrases
          feedbackPhrases: {
            excellent: [
              "Outstanding demonstration of understanding",
              "Exceptional use of relevant examples",
              "Clear and articulate expression of ideas",
              "Goes beyond expectations",
            ],
            good: [
              "Good understanding shown",
              "Appropriate use of examples",
              "Clear communication of ideas",
              "Meets the requirements well",
            ],
            satisfactory: [
              "Basic understanding demonstrated",
              "Some relevant points made",
              "Generally clear communication",
              "Meets minimum requirements",
            ],
            needsImprovement: [
              "Limited understanding shown",
              "Few relevant points made",
              "Communication lacks clarity",
              "Does not meet requirements",
            ],
          },
        });
      }, 1500);
    }
  }, [activityData, isLoading]);

  // Helper function to calculate total points
  function calculateTotalPoints(activity) {
    if (!activity || !activity.questions) return 100;
    return activity.questions.reduce(
      (total, question) => total + (question.points || 1),
      0
    );
  }

  // Helper function to generate rubric criteria
  function generateRubricCriteria(activity) {
    const criteria = [];

    // Base criteria that apply to most assessments
    const baseCriteria = [
      {
        criterion: "Content Knowledge",
        weight: 40,
        description:
          "Demonstrates understanding of key concepts and subject matter",
        levels: {
          excellent: {
            points: "36-40",
            description:
              "Demonstrates comprehensive and sophisticated understanding of all key concepts. Uses precise terminology and shows deep insight.",
          },
          good: {
            points: "28-35",
            description:
              "Shows good understanding of most key concepts. Uses appropriate terminology and demonstrates solid grasp of material.",
          },
          satisfactory: {
            points: "20-27",
            description:
              "Shows basic understanding of main concepts. Some terminology used correctly but may lack depth.",
          },
          needsImprovement: {
            points: "0-19",
            description:
              "Limited understanding of concepts. Minimal or incorrect use of terminology.",
          },
        },
      },
      {
        criterion: "Application & Analysis",
        weight: 30,
        description:
          "Applies knowledge to new situations and analyzes information effectively",
        levels: {
          excellent: {
            points: "27-30",
            description:
              "Skillfully applies knowledge to complex situations. Provides insightful analysis with well-reasoned conclusions.",
          },
          good: {
            points: "21-26",
            description:
              "Applies knowledge appropriately in most situations. Good analysis with logical reasoning.",
          },
          satisfactory: {
            points: "15-20",
            description:
              "Basic application of knowledge. Some analysis present but may lack depth or clarity.",
          },
          needsImprovement: {
            points: "0-14",
            description:
              "Minimal application of knowledge. Little to no analysis or reasoning shown.",
          },
        },
      },
      {
        criterion: "Communication",
        weight: 20,
        description:
          "Clear expression of ideas using appropriate language and structure",
        levels: {
          excellent: {
            points: "18-20",
            description:
              "Ideas expressed clearly and eloquently. Excellent use of language, grammar, and structure.",
          },
          good: {
            points: "14-17",
            description:
              "Ideas generally well expressed. Good use of language with minor errors.",
          },
          satisfactory: {
            points: "10-13",
            description:
              "Ideas expressed adequately. Some errors in language use but meaning is clear.",
          },
          needsImprovement: {
            points: "0-9",
            description:
              "Ideas poorly expressed. Frequent errors that interfere with understanding.",
          },
        },
      },
      {
        criterion: "Completeness & Organization",
        weight: 10,
        description:
          "Addresses all requirements and presents work in logical order",
        levels: {
          excellent: {
            points: "9-10",
            description:
              "All requirements fully addressed. Excellent organization and logical flow.",
          },
          good: {
            points: "7-8",
            description:
              "Most requirements addressed. Good organization with clear structure.",
          },
          satisfactory: {
            points: "5-6",
            description:
              "Basic requirements met. Adequate organization but may lack coherence.",
          },
          needsImprovement: {
            points: "0-4",
            description:
              "Requirements not fully met. Poor organization and unclear structure.",
          },
        },
      },
    ];

    // Add skill-specific criteria based on activity skills
    if (activity?.skills) {
      if (activity.skills.includes("writing")) {
        criteria.push({
          criterion: "Writing Quality",
          weight: 15,
          description:
            "Grammar, vocabulary, sentence structure, and writing mechanics",
          levels: {
            excellent: {
              points: "14-15",
              description:
                "Excellent grammar and vocabulary. Varied sentence structures. Error-free mechanics.",
            },
            good: {
              points: "11-13",
              description:
                "Good grammar and vocabulary. Some sentence variety. Few mechanical errors.",
            },
            satisfactory: {
              points: "8-10",
              description:
                "Adequate grammar and vocabulary. Basic sentence structures. Some errors present.",
            },
            needsImprovement: {
              points: "0-7",
              description:
                "Poor grammar and limited vocabulary. Frequent errors that impede understanding.",
            },
          },
        });
      }

      if (activity.skills.includes("critical_thinking")) {
        criteria.push({
          criterion: "Critical Thinking",
          weight: 20,
          description:
            "Evaluation, synthesis, and higher-order thinking skills",
          levels: {
            excellent: {
              points: "18-20",
              description:
                "Exceptional critical thinking. Evaluates multiple perspectives and synthesizes information effectively.",
            },
            good: {
              points: "14-17",
              description:
                "Good critical thinking shown. Makes connections and evaluates information appropriately.",
            },
            satisfactory: {
              points: "10-13",
              description:
                "Some evidence of critical thinking. Basic evaluation and simple connections made.",
            },
            needsImprovement: {
              points: "0-9",
              description:
                "Limited critical thinking. Minimal evaluation or analysis of information.",
            },
          },
        });
      }
    }

    return baseCriteria;
  }

  if (isLoading) {
    return (
      <div className="rubric-loading">
        <Spin size="large" />
        <Title level={4} style={{ marginTop: 16, color: "#666" }}>
          Generating Assessment Rubric...
        </Title>
        <Paragraph type="secondary">
          Creating a detailed marking rubric based on your assessment activity.
        </Paragraph>
      </div>
    );
  }

  if (!generatedRubric) {
    return (
      <div className="rubric-placeholder">
        <FileTextOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />
        <Title level={4} type="secondary">
          No Rubric Generated
        </Title>
        <Paragraph type="secondary">
          Generate an assessment activity first to create the corresponding
          rubric.
        </Paragraph>
      </div>
    );
  }

  // Prepare table data for rubric criteria
  const rubricTableColumns = [
    {
      title: "Criteria",
      dataIndex: "criterion",
      key: "criterion",
      width: 150,
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Weight: {record.weight}%
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>
            {record.description}
          </Text>
        </div>
      ),
    },
    {
      title: (
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#52c41a", fontWeight: "bold" }}>Excellent</div>
          <div style={{ fontSize: 11, color: "#666" }}>90-100%</div>
        </div>
      ),
      dataIndex: ["levels", "excellent"],
      key: "excellent",
      width: 200,
      render: (level) => (
        <div className="rubric-cell excellent">
          <Text strong style={{ color: "#52c41a" }}>
            {level.points} pts
          </Text>
          <Paragraph style={{ margin: "4px 0 0 0", fontSize: 12 }}>
            {level.description}
          </Paragraph>
        </div>
      ),
    },
    {
      title: (
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#1890ff", fontWeight: "bold" }}>Good</div>
          <div style={{ fontSize: 11, color: "#666" }}>70-89%</div>
        </div>
      ),
      dataIndex: ["levels", "good"],
      key: "good",
      width: 200,
      render: (level) => (
        <div className="rubric-cell good">
          <Text strong style={{ color: "#1890ff" }}>
            {level.points} pts
          </Text>
          <Paragraph style={{ margin: "4px 0 0 0", fontSize: 12 }}>
            {level.description}
          </Paragraph>
        </div>
      ),
    },
    {
      title: (
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#faad14", fontWeight: "bold" }}>
            Satisfactory
          </div>
          <div style={{ fontSize: 11, color: "#666" }}>50-69%</div>
        </div>
      ),
      dataIndex: ["levels", "satisfactory"],
      key: "satisfactory",
      width: 200,
      render: (level) => (
        <div className="rubric-cell satisfactory">
          <Text strong style={{ color: "#faad14" }}>
            {level.points} pts
          </Text>
          <Paragraph style={{ margin: "4px 0 0 0", fontSize: 12 }}>
            {level.description}
          </Paragraph>
        </div>
      ),
    },
    {
      title: (
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#ff4d4f", fontWeight: "bold" }}>
            Needs Improvement
          </div>
          <div style={{ fontSize: 11, color: "#666" }}>0-49%</div>
        </div>
      ),
      dataIndex: ["levels", "needsImprovement"],
      key: "needsImprovement",
      width: 200,
      render: (level) => (
        <div className="rubric-cell needs-improvement">
          <Text strong style={{ color: "#ff4d4f" }}>
            {level.points} pts
          </Text>
          <Paragraph style={{ margin: "4px 0 0 0", fontSize: 12 }}>
            {level.description}
          </Paragraph>
        </div>
      ),
    },
  ];

  return (
    <div className="rubric-generated">
      {/* Header Section */}
      <Card className="rubric-header-card">
        <div className="rubric-header">
          <div className="header-info">
            <Title level={3} style={{ margin: 0, color: "#1890ff" }}>
              <TrophyOutlined /> {generatedRubric.title}
            </Title>
            <Paragraph type="secondary" style={{ margin: "8px 0 16px 0" }}>
              {generatedRubric.description}
            </Paragraph>
            <Space wrap>
              <Statistic
                title="Total Points"
                value={generatedRubric.totalPoints}
                prefix={<StarOutlined />}
                valueStyle={{ color: "#1890ff", fontSize: 16 }}
              />
              <Statistic
                title="Criteria"
                value={generatedRubric.criteria.length}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: "#52c41a", fontSize: 16 }}
              />
            </Space>
          </div>
          <div className="header-actions">
            <Space direction="vertical">
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={() => onDownload?.(generatedRubric)}
                size="large"
              >
                Download Rubric
              </Button>
              <Button
                icon={<EditOutlined />}
                onClick={() => onEdit?.(generatedRubric)}
              >
                Edit Rubric
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => onRegenerate?.(activityData)}
              >
                Regenerate
              </Button>
            </Space>
          </div>
        </div>
      </Card>

      {/* Performance Levels Overview */}
      <Card
        title={
          <>
            <BarChartOutlined /> Performance Levels
          </>
        }
        style={{ marginBottom: 24 }}
      >
        <Row gutter={[16, 16]}>
          {generatedRubric.performanceLevels.map((level, index) => (
            <Col xs={24} sm={12} md={6} key={index}>
              <Card
                size="small"
                className={`performance-level-card ${level.level
                  .toLowerCase()
                  .replace(" ", "-")}`}
              >
                <div style={{ textAlign: "center" }}>
                  <Tag
                    color={level.color}
                    style={{
                      marginBottom: 8,
                      fontSize: 13,
                      padding: "4px 12px",
                    }}
                  >
                    {level.level}
                  </Tag>
                  <div
                    style={{
                      fontWeight: "bold",
                      fontSize: 16,
                      color: level.color,
                      marginBottom: 4,
                    }}
                  >
                    {level.range}
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {level.description}
                  </Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Grade Boundaries */}
      <Card title="Grade Boundaries" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 8]}>
          {Object.entries(generatedRubric.gradeBoundaries).map(
            ([grade, info]) => (
              <Col xs={12} sm={8} md={4} key={grade}>
                <div className="grade-boundary">
                  <div className={`grade-letter grade-${grade.toLowerCase()}`}>
                    {grade}
                  </div>
                  <div className="grade-range">
                    {info.min}-{info.max}%
                  </div>
                  <div className="grade-description">{info.description}</div>
                </div>
              </Col>
            )
          )}
        </Row>
      </Card>

      {/* Main Rubric Table */}
      <Card
        title={
          <>
            <FileTextOutlined /> Assessment Rubric
          </>
        }
        style={{ marginBottom: 24 }}
      >
        <Alert
          message="Marking Instructions"
          description="Use this rubric to ensure consistent and fair assessment. Each criterion should be evaluated independently, and the total score calculated at the end."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Table
          columns={rubricTableColumns}
          dataSource={generatedRubric.criteria}
          rowKey="criterion"
          pagination={false}
          className="rubric-table"
          scroll={{ x: 1000 }}
          bordered
        />

        <div
          style={{
            marginTop: 16,
            padding: 16,
            background: "#f6ffed",
            borderRadius: 8,
          }}
        >
          <Text strong style={{ color: "#52c41a" }}>
            Total Possible Points: {generatedRubric.totalPoints}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Calculate percentage by dividing student's total points by{" "}
            {generatedRubric.totalPoints} and multiplying by 100.
          </Text>
        </div>
      </Card>

      {/* Marking Guidelines */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Marking Guidelines" size="small">
            <ol style={{ paddingLeft: 20, margin: 0 }}>
              {generatedRubric.markingGuidelines.map((guideline, index) => (
                <li key={index} style={{ marginBottom: 12, lineHeight: 1.5 }}>
                  {guideline}
                </li>
              ))}
            </ol>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Quick Reference - Feedback Phrases" size="small">
            <div className="feedback-phrases">
              {Object.entries(generatedRubric.feedbackPhrases).map(
                ([level, phrases]) => (
                  <div key={level} style={{ marginBottom: 16 }}>
                    <Text
                      strong
                      style={{
                        color:
                          level === "excellent"
                            ? "#52c41a"
                            : level === "good"
                            ? "#1890ff"
                            : level === "satisfactory"
                            ? "#faad14"
                            : "#ff4d4f",
                        textTransform: "capitalize",
                      }}
                    >
                      {level.replace(/([A-Z])/g, " $1")}:
                    </Text>
                    <ul style={{ marginTop: 4, paddingLeft: 16 }}>
                      {phrases.slice(0, 2).map((phrase, idx) => (
                        <li
                          key={idx}
                          style={{
                            fontSize: 12,
                            marginBottom: 2,
                            color: "#666",
                          }}
                        >
                          "{phrase}"
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default RubricGenerated;
