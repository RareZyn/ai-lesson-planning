//src/pages/assessment/RubricViewerPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Spin,
  Alert,
  message,
  Typography,
  Tag,
  Space,
  Divider,
} from "antd";
import {
  ArrowLeftOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { assessmentAPI } from "../../services/assessmentService";

const { Title, Text } = Typography;

// JSON to HTML conversion functions for fallback support
const convertAnswerKeyContentToHTML = (answerKeyContent) => {
  if (!answerKeyContent) return null;

  let html = `
    <div class="answer-key-content" style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
      <h1 style="color: #52c41a; margin-bottom: 10px;">${
        answerKeyContent.title || "Answer Key"
      }</h1>
      <div class="answer-key-info" style="background: #f6ffed; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <p><strong>Total Questions:</strong> ${
          answerKeyContent.totalQuestions || "N/A"
        }</p>
        <p style="margin: 0;"><strong>Total Points:</strong> ${
          answerKeyContent.totalPoints || "N/A"
        }</p>
      </div>
  `;

  if (answerKeyContent.answers && answerKeyContent.answers.length > 0) {
    html += `<div class="answers">`;
    answerKeyContent.answers.forEach((answer) => {
      // Handle points properly - check for marks field as fallback
      const points = answer.points || answer.marks || 1;

      html += `
        <div class="answer-item" style="margin-bottom: 25px; padding: 20px; border: 2px solid #d9d9d9; border-radius: 12px; background: #fafafa;">
          <h3 style="color: #262626; margin-bottom: 15px; border-bottom: 1px solid #e8e8e8; padding-bottom: 8px;">
            Question ${answer.questionNumber} (${points} ${
        points === 1 ? "point" : "points"
      })
          </h3>
          
          <div style="background: #fff; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #52c41a;">
            <p style="margin: 0; font-size: 16px;"><strong style="color: #52c41a;">Correct Answer:</strong> ${
              answer.correctAnswer
            }</p>
          </div>`;

      // Add explanation if available
      if (answer.explanation) {
        html += `
          <div style="background: #e6f7ff; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #1890ff;">
            <p style="margin: 0;"><strong style="color: #1890ff;">Explanation:</strong> ${answer.explanation}</p>
          </div>`;
      }

      // Add marking guidance if available
      if (answer.markingGuidance && answer.markingGuidance !== "undefined") {
        html += `
          <div style="background: #fff7e6; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #fa8c16;">
            <p style="margin: 0;"><strong style="color: #fa8c16;">Marking Guidance:</strong> ${answer.markingGuidance}</p>
          </div>`;
      }

      // Add marking notes if available and not undefined
      if (answer.markingNotes && answer.markingNotes !== "undefined") {
        html += `
          <div style="background: #f6ffed; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #52c41a;">
            <p style="margin: 0;"><strong style="color: #52c41a;">Marking Notes:</strong> ${answer.markingNotes}</p>
          </div>`;
      }

      // Add acceptable alternatives if available
      if (
        answer.acceptableAlternatives &&
        answer.acceptableAlternatives !== "None" &&
        answer.acceptableAlternatives !== "undefined"
      ) {
        html += `
          <div style="background: #f0f5ff; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #722ed1;">
            <p style="margin: 0;"><strong style="color: #722ed1;">Acceptable Alternatives:</strong> ${answer.acceptableAlternatives}</p>
          </div>`;
      }

      // Add common errors if available
      if (answer.commonErrors && answer.commonErrors !== "undefined") {
        html += `
          <div style="background: #fff2e8; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #fa541c;">
            <p style="margin: 0;"><strong style="color: #fa541c;">Common Student Errors:</strong> ${answer.commonErrors}</p>
          </div>`;
      }

      // Add text reference if available
      if (answer.textReference) {
        html += `
          <div style="background: #f9f0ff; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #722ed1;">
            <p style="margin: 0;"><strong style="color: #722ed1;">Text Reference:</strong> ${answer.textReference}</p>
          </div>`;
      }

      // Add grammar point if available
      if (answer.grammarPoint) {
        html += `
          <div style="background: #e6fffb; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #13c2c2;">
            <p style="margin: 0;"><strong style="color: #13c2c2;">Grammar Point:</strong> ${answer.grammarPoint}</p>
          </div>`;
      }

      // Add reading skill if available
      if (answer.readingSkill) {
        html += `
          <div style="background: #f6ffed; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #52c41a;">
            <p style="margin: 0;"><strong style="color: #52c41a;">Reading Skill:</strong> ${answer.readingSkill}</p>
          </div>`;
      }

      // Add discourse skill if available
      if (answer.discourseSkill) {
        html += `
          <div style="background: #fff1f0; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #ff4d4f;">
            <p style="margin: 0;"><strong style="color: #ff4d4f;">Discourse Skill:</strong> ${answer.discourseSkill}</p>
          </div>`;
      }

      // Add transfer skill if available
      if (answer.transferSkill) {
        html += `
          <div style="background: #f0f5ff; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #597ef7;">
            <p style="margin: 0;"><strong style="color: #597ef7;">Transfer Skill:</strong> ${answer.transferSkill}</p>
          </div>`;
      }

      html += `</div>`; // Close answer-item div
    });
    html += `</div>`; // Close answers div
  }

  // Add part-specific guidance if available
  if (answerKeyContent.partSpecificGuidance) {
    html += `
      <div style="margin-top: 30px; padding: 20px; background: #f0f2f5; border-radius: 12px;">
        <h3 style="color: #262626; margin-bottom: 20px;">Part-Specific Marking Guidance</h3>`;

    Object.entries(answerKeyContent.partSpecificGuidance).forEach(
      ([part, guidance]) => {
        html += `
        <div style="margin-bottom: 20px; padding: 15px; background: #fff; border-radius: 8px; border-left: 4px solid #1890ff;">
          <h4 style="color: #1890ff; margin-bottom: 10px;">${part.toUpperCase()}</h4>
          <p><strong>Focus:</strong> ${guidance.focus}</p>
          <p><strong>Marking Principle:</strong> ${
            guidance.markingPrinciple
          }</p>
          ${
            guidance.commonIssues
              ? `<p><strong>Common Issues:</strong> ${guidance.commonIssues}</p>`
              : ""
          }
          ${
            guidance.teachingPoint
              ? `<p><strong>Teaching Point:</strong> ${guidance.teachingPoint}</p>`
              : ""
          }
        </div>`;
      }
    );

    html += `</div>`;
  }

  // Add marking scheme if available
  if (answerKeyContent.markingScheme) {
    html += `<div class="marking-scheme" style="margin-top: 25px; padding: 20px; background: #e6f7ff; border-radius: 12px;">
      <h3 style="color: #1890ff; margin-bottom: 15px;">Marking Scheme</h3>`;

    Object.entries(answerKeyContent.markingScheme).forEach(
      ([section, description]) => {
        html += `<p style="margin-bottom: 10px;"><strong>${
          section.charAt(0).toUpperCase() + section.slice(1)
        }:</strong> ${description}</p>`;
      }
    );

    html += `</div>`;
  }

  // Add general marking principles if available
  if (answerKeyContent.generalMarkingPrinciples) {
    html += `
      <div style="margin-top: 25px; padding: 20px; background: #fff7e6; border-radius: 12px;">
        <h3 style="color: #fa8c16; margin-bottom: 15px;">General Marking Principles</h3>`;

    Object.entries(answerKeyContent.generalMarkingPrinciples).forEach(
      ([principle, description]) => {
        html += `<p style="margin-bottom: 10px;"><strong>${
          principle.charAt(0).toUpperCase() + principle.slice(1)
        }:</strong> ${description}</p>`;
      }
    );

    html += `</div>`;
  }

  // Add grading scale if available
  if (answerKeyContent.gradingScale) {
    html += `<div class="grading-scale" style="margin-top: 25px; padding: 20px; background: #f6ffed; border-radius: 12px;">
      <h3 style="color: #52c41a; margin-bottom: 15px;">Grading Scale</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">`;

    Object.entries(answerKeyContent.gradingScale).forEach(([level, range]) => {
      html += `
        <div style="padding: 10px; background: #fff; border-radius: 6px; border: 1px solid #d9d9d9;">
          <strong style="color: #52c41a;">${level.toUpperCase()}:</strong> ${range}
        </div>`;
    });

    html += `</div></div>`;
  }

  html += `</div>`;
  return html;
};
const convertRubricContentToHTML = (rubricContent) => {
  if (!rubricContent) return null;

  let html = `
    <div class="rubric-content" style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.5;">
      <h1 style="color: #52c41a; margin-bottom: 10px;">${
        rubricContent.title || "Assessment Rubric"
      }</h1>
      ${
        rubricContent.description
          ? `<p style="margin-bottom: 20px; font-style: italic;">${rubricContent.description}</p>`
          : ""
      }
  `;

  if (rubricContent.criteria && rubricContent.criteria.length > 0) {
    html += `
      <table class="rubric-table" border="1" cellpadding="12" cellspacing="0" style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #52c41a; color: white;">
            <th style="text-align: left; font-weight: bold;">Criteria</th>
            <th style="text-align: center; font-weight: bold;">Excellent</th>
            <th style="text-align: center; font-weight: bold;">Good</th>
            <th style="text-align: center; font-weight: bold;">Satisfactory</th>
            <th style="text-align: center; font-weight: bold;">Needs Improvement</th>
            <th style="text-align: center; font-weight: bold;">Points</th>
          </tr>
        </thead>
        <tbody>`;

    rubricContent.criteria.forEach((criterion, index) => {
      const bgColor = index % 2 === 0 ? "#f6ffed" : "#ffffff";
      html += `
        <tr style="background-color: ${bgColor};">
          <td style="font-weight: bold; vertical-align: top;">${criterion.category}</td>
          <td style="vertical-align: top; text-align: left;">${criterion.excellent}</td>
          <td style="vertical-align: top; text-align: left;">${criterion.good}</td>
          <td style="vertical-align: top; text-align: left;">${criterion.satisfactory}</td>
          <td style="vertical-align: top; text-align: left;">${criterion.needsImprovement}</td>
          <td style="text-align: center; font-weight: bold; vertical-align: top;">${criterion.points}</td>
        </tr>`;
    });

    html += `
        </tbody>
      </table>`;

    if (rubricContent.totalPoints) {
      html += `<div class="grading-info" style="margin-top: 25px; padding: 15px; background: #e6f7ff; border-radius: 8px;">
        <h3 style="color: #1890ff; margin-bottom: 15px;">Grading Information</h3>
        <p><strong>Total Points:</strong> ${rubricContent.totalPoints}</p>`;

      if (rubricContent.gradingScale) {
        html += `<h4 style="margin-top: 15px; color: #1890ff;">Grading Scale:</h4><ul style="margin: 0; padding-left: 20px;">`;
        Object.entries(rubricContent.gradingScale).forEach(([level, range]) => {
          html += `<li><strong>${
            level.charAt(0).toUpperCase() + level.slice(1)
          }:</strong> ${range}</li>`;
        });
        html += `</ul>`;
      }

      html += `</div>`;
    }
  }

  html += `</div>`;
  return html;
};

const RubricViewerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    fetchAssessment();
  }, [id]);

  const fetchAssessment = async () => {
    try {
      setLoading(true);
      const response = await assessmentAPI.getAssessmentById(id);

      if (response.success && response.data) {
        setAssessment(response.data);

        // FIXED: Enhanced check for both rubricHTML and answerKeyHTML for SPM exams
        const hasTeacherContent = !!(
          response.data.generatedContent?.rubricHTML ||
          response.data.generatedContent?.answerKeyHTML ||
          response.data.generatedContent?.rubricContent ||
          response.data.generatedContent?.answerKeyContent
        );

        console.log(
          "🔍 Teacher content detection for",
          response.data.activityType,
          {
            rubricHTML: !!response.data.generatedContent?.rubricHTML,
            answerKeyHTML: !!response.data.generatedContent?.answerKeyHTML,
            rubricContent: !!response.data.generatedContent?.rubricContent,
            answerKeyContent:
              !!response.data.generatedContent?.answerKeyContent,
            hasTeacherContent,
          }
        );

        if (!hasTeacherContent) {
          setError("No teacher content found for this assessment.");
        }
      } else {
        setError("Assessment not found.");
      }
    } catch (error) {
      console.error("Error fetching assessment:", error);
      setError("Failed to load assessment. Please try again.");
      message.error("Failed to load assessment");
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Enhanced getTeacherContent function with proper SPM exam support
  const getTeacherContent = () => {
    if (!assessment?.generatedContent) return null;

    const { rubricHTML, answerKeyHTML, rubricContent, answerKeyContent } =
      assessment.generatedContent;

    console.log("🎯 Getting teacher content for", assessment.activityType, {
      rubricHTML: !!rubricHTML,
      answerKeyHTML: !!answerKeyHTML,
      rubricContent: !!rubricContent,
      answerKeyContent: !!answerKeyContent,
    });

    // CRITICAL: Handle SPM exam and assessment types - they should use answer key content
    if (
      assessment.activityType === "spm-exam" ||
      assessment.activityType === "assessment"
    ) {
      if (answerKeyHTML) {
        console.log("✅ Using answerKeyHTML for", assessment.activityType);
        return answerKeyHTML;
      } else if (answerKeyContent) {
        console.log(
          "✅ Converting answerKeyContent to HTML for",
          assessment.activityType
        );
        return convertAnswerKeyContentToHTML(answerKeyContent);
      }
    } else {
      // For other types (essay, textbook, activity), use rubric content
      if (rubricHTML) {
        console.log("✅ Using rubricHTML for", assessment.activityType);
        return rubricHTML;
      } else if (rubricContent) {
        console.log(
          "✅ Converting rubricContent to HTML for",
          assessment.activityType
        );
        return convertRubricContentToHTML(rubricContent);
      }
    }

    console.log("❌ No teacher content found for", assessment.activityType);
    return null;
  };

  // Enhanced getStudentContent function (for completeness)
  const getStudentContent = () => {
    if (!assessment?.generatedContent) return null;

    const { activityHTML, assessmentHTML, examHTML } =
      assessment.generatedContent;

    // CRITICAL: Handle SPM exam content correctly
    if (assessment.activityType === "smp-exam") {
      return examHTML || assessmentHTML;
    } else if (assessment.activityType === "assessment") {
      return assessmentHTML;
    } else {
      return activityHTML;
    }
  };

  const hasStudentContent = () => {
    return !!getStudentContent();
  };

  // FIXED: Get appropriate content type names with SPM exam support
  const getTeacherContentName = () => {
    if (!assessment) return "Teacher Content";

    switch (assessment.activityType) {
      case "assessment":
      case "spm-exam": // CRITICAL: SPM exams use answer keys
        return "Answer Key";
      case "essay":
      case "textbook":
      case "activity":
        return "Rubric";
      default:
        return "Teacher Guide";
    }
  };

  const getStudentContentName = () => {
    if (!assessment) return "Student Content";

    switch (assessment.activityType) {
      case "assessment":
        return "Assessment Paper";
      case "spm-exam": 
        return "SPM Examination Paper";
      case "essay":
        return "Essay Activity";
      case "textbook":
        return "Textbook Activity";
      case "activity":
        return "Class Activity";
      default:
        return "Activity";
    }
  };

  const handleViewActivity = () => {
    if (hasStudentContent()) {
      navigate(`/app/assessment/${id}`);
    } else {
      message.warning(
        `No ${getStudentContentName().toLowerCase()} available for this assessment.`
      );
    }
  };

  const handleGoBack = () => {
    navigate("/app/assessment");
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
        }}
      >
        <Spin
          size="large"
          tip={`Loading ${getTeacherContentName().toLowerCase()}...`}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "24px" }}>
        <Alert
          message={`Error Loading ${getTeacherContentName()}`}
          description={
            <div>
              <div>{error}</div>
              {assessment && (
                <div style={{ marginTop: "8px", fontSize: "12px" }}>
                  <strong>Debug Info:</strong>
                  <br />
                  Activity Type: {assessment.activityType}
                  <br />
                  Teacher Content Available:{" "}
                  {JSON.stringify({
                    rubricHTML: !!assessment.generatedContent?.rubricHTML,
                    answerKeyHTML: !!assessment.generatedContent?.answerKeyHTML,
                    rubricContent: !!assessment.generatedContent?.rubricContent,
                    answerKeyContent:
                      !!assessment.generatedContent?.answerKeyContent,
                  })}
                </div>
              )}
            </div>
          }
          type="error"
          showIcon
          action={
            <Space>
              <Button size="small" onClick={fetchAssessment}>
                Retry
              </Button>
              <Button size="small" onClick={handleGoBack}>
                Go Back
              </Button>
            </Space>
          }
        />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div style={{ padding: "24px" }}>
        <Alert
          message="Assessment Not Found"
          description="The requested assessment could not be found."
          type="warning"
          showIcon
          action={
            <Button size="small" onClick={handleGoBack}>
              Go Back
            </Button>
          }
        />
      </div>
    );
  }

  const teacherContent = getTeacherContent();

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <Card
        style={{ marginBottom: "24px" }}
        bodyStyle={{ padding: "20px 24px" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "12px",
              }}
            >
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={handleGoBack}
                type="text"
                size="small"
              >
                Back to Assessments
              </Button>
            </div>

            <Title level={3} style={{ margin: "0 0 8px 0" }}>
              {assessment.title} - {getTeacherContentName()}
            </Title>

            {assessment.description && (
              <Text type="secondary" style={{ fontSize: "14px" }}>
                {assessment.description}
              </Text>
            )}

            <div style={{ marginTop: "12px" }}>
              <Space wrap>
                <Tag color="blue">{assessment.activityType.toUpperCase()}</Tag>
                <Tag color="green">{assessment.assessmentType}</Tag>
                <Tag color="purple">{assessment.difficulty}</Tag>
                {assessment.duration && (
                  <Tag color="orange">{assessment.duration}</Tag>
                )}
                {assessment.questionCount && (
                  <Tag>{assessment.questionCount} questions</Tag>
                )}
              </Space>
            </div>

            {assessment.classId && (
              <div style={{ marginTop: "8px" }}>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  Class: {assessment.classId.className} • Grade:{" "}
                  {assessment.classId.grade} • Subject:{" "}
                  {assessment.classId.subject}
                </Text>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <Space wrap>
            {hasStudentContent() && (
              <Button
                icon={<EyeOutlined />}
                onClick={handleViewActivity}
                type="default"
              >
                View {getStudentContentName()}
              </Button>
            )}
          </Space>
        </div>
      </Card>

      {/* Teacher Content */}
      <Card title={getTeacherContentName()} style={{ marginBottom: "24px" }}>
        {teacherContent ? (
          <div
            id="rubric-content"
            style={{
              background: "#fff",
              border: "1px solid #f0f0f0",
              borderRadius: "8px",
              overflow: "auto",
            }}
            dangerouslySetInnerHTML={{
              __html: teacherContent,
            }}
          />
        ) : (
          <Alert
            message={`No ${getTeacherContentName()}`}
            description={
              <div>
                <div>
                  No {getTeacherContentName().toLowerCase()} content has been
                  generated for this assessment.
                </div>
                {assessment && (
                  <div style={{ marginTop: "8px", fontSize: "12px" }}>
                    <strong>Debug Info:</strong>
                    <br />
                    Activity Type: {assessment.activityType}
                    <br />
                    Expected Content:{" "}
                    {assessment.activityType === "smp-exam" ||
                    assessment.activityType === "assessment"
                      ? "answerKeyHTML or answerKeyContent"
                      : "rubricHTML or rubricContent"}
                    <br />
                    Content Available:{" "}
                    {JSON.stringify({
                      rubricHTML: !!assessment.generatedContent?.rubricHTML,
                      answerKeyHTML:
                        !!assessment.generatedContent?.answerKeyHTML,
                      rubricContent:
                        !!assessment.generatedContent?.rubricContent,
                      answerKeyContent:
                        !!assessment.generatedContent?.answerKeyContent,
                    })}
                  </div>
                )}
              </div>
            }
            type="warning"
            showIcon
          />
        )}
      </Card>

      {/* Guidelines */}
      <Card title={`${getTeacherContentName()} Guidelines`} size="small">
        <div style={{ display: "grid", gap: "16px" }}>
          <Alert
            message={`How to Use This ${getTeacherContentName()}`}
            description={
              assessment.activityType === "assessment" ||
              assessment.activityType === "smp-exam"
                ? "Use this answer key to evaluate student responses efficiently. Each question includes the correct answer and suggested marking criteria."
                : "Use this rubric to evaluate student performance consistently. Each criterion should be assessed independently, and the total score should reflect the overall quality of the student's work."
            }
            type="info"
            showIcon
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
            }}
          >
            <div>
              <Text strong style={{ display: "block", marginBottom: "4px" }}>
                Content Type
              </Text>
              <Text type="secondary">{getTeacherContentName()}</Text>
            </div>

            <div>
              <Text strong style={{ display: "block", marginBottom: "4px" }}>
                Assessment Type
              </Text>
              <Text type="secondary">{assessment.assessmentType}</Text>
            </div>

            <div>
              <Text strong style={{ display: "block", marginBottom: "4px" }}>
                Activity Type
              </Text>
              <Text type="secondary">{assessment.activityType}</Text>
            </div>

            <div>
              <Text strong style={{ display: "block", marginBottom: "4px" }}>
                Difficulty Level
              </Text>
              <Text type="secondary">{assessment.difficulty}</Text>
            </div>

            {assessment.duration && (
              <div>
                <Text strong style={{ display: "block", marginBottom: "4px" }}>
                  Suggested Duration
                </Text>
                <Text type="secondary">{assessment.duration}</Text>
              </div>
            )}

            {assessment.questionCount && (
              <div>
                <Text strong style={{ display: "block", marginBottom: "4px" }}>
                  Total Questions
                </Text>
                <Text type="secondary">
                  {assessment.questionCount} questions
                </Text>
              </div>
            )}
          </div>

          {/* SPM Exam Configuration Display */}
          {assessment.activityType === "smp-exam" &&
            assessment.examConfiguration && (
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  SPM Exam Configuration
                </Text>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "8px",
                  }}
                >
                  {assessment.examConfiguration.paperType && (
                    <div>
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        Paper Type:{" "}
                        {assessment.examConfiguration.paperType.toUpperCase()}
                      </Text>
                    </div>
                  )}
                  {assessment.examConfiguration.textSources?.length > 0 && (
                    <div>
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        Text Sources:{" "}
                        {assessment.examConfiguration.textSources.length}{" "}
                        selected
                      </Text>
                    </div>
                  )}
                  {assessment.examConfiguration.readingLevel && (
                    <div>
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        Reading Level:{" "}
                        {assessment.examConfiguration.readingLevel}
                      </Text>
                    </div>
                  )}
                  {assessment.examConfiguration.communicationFormat && (
                    <div>
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        Format:{" "}
                        {assessment.examConfiguration.communicationFormat}
                      </Text>
                    </div>
                  )}
                </div>
              </div>
            )}

          {assessment.skills && assessment.skills.length > 0 && (
            <div>
              <Text strong style={{ display: "block", marginBottom: "8px" }}>
                Skills Being Assessed
              </Text>
              <Space wrap>
                {assessment.skills.map((skill, index) => (
                  <Tag key={index} color="cyan">
                    {skill}
                  </Tag>
                ))}
              </Space>
            </div>
          )}

          {assessment.tags && assessment.tags.length > 0 && (
            <div>
              <Text strong style={{ display: "block", marginBottom: "8px" }}>
                Tags
              </Text>
              <Space wrap>
                {assessment.tags.map((tag, index) => (
                  <Tag key={index}>{tag}</Tag>
                ))}
              </Space>
            </div>
          )}

          {assessment.notes && (
            <div>
              <Text strong style={{ display: "block", marginBottom: "8px" }}>
                Additional Notes
              </Text>
              <Text type="secondary">{assessment.notes}</Text>
            </div>
          )}

          <Divider />

          <div>
            <Text strong style={{ display: "block", marginBottom: "8px" }}>
              Assessment Information
            </Text>
            <div style={{ fontSize: "12px", color: "#666" }}>
              <div>
                Created: {new Date(assessment.createdAt).toLocaleDateString()}
              </div>
              <div>
                Last Updated:{" "}
                {new Date(assessment.updatedAt).toLocaleDateString()}
              </div>
              {assessment.usageCount > 0 && (
                <div>Usage Count: {assessment.usageCount} times</div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RubricViewerPage;
