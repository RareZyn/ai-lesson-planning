import React, { useState, useEffect } from "react";
import { Card, Tag, Button, Avatar, Tooltip, Modal, message, Divider, Empty } from "antd";
import {
  HeartOutlined,
  HeartFilled,
  DownloadOutlined,
  EyeOutlined,
  MessageOutlined,
  StarOutlined,
  StarFilled,
  CalendarOutlined,
  ClockCircleOutlined,
  BookOutlined,
  UserOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  RollbackOutlined,
} from "@ant-design/icons";
import { exportToPdf } from "../../services/exportService";
import { pdfExportService } from "../../services/enhancedPdfExport";
import "./LessonCard.css";

const { Meta } = Card;

const LessonCard = ({
  lesson,
  onLike,
  onDownload,
  onBookmark,
  onUnshare,
  currentUserId,
  assessments = [], // Array of assessments for this lesson
}) => {
  const [isLiked, setIsLiked] = useState(
    lesson.communityData?.hasUserLiked || false
  );
  const [isBookmarked, setIsBookmarked] = useState(
    lesson.isBookmarked || false
  );
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [downloadingAssessmentId, setDownloadingAssessmentId] = useState(null);

  // Update local state when lesson prop changes
  useEffect(() => {
    setIsLiked(lesson.communityData?.hasUserLiked || false);
    setIsBookmarked(lesson.isBookmarked || false);
  }, [lesson.communityData?.hasUserLiked, lesson.isBookmarked]);

  // Array of gradient combinations for lesson cards
  const gradientColors = [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
    "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
    "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
    "linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)",
    "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)",
    "linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)",
    "linear-gradient(135deg, #9890e3 0%, #b1f4cf 100%)",
    "linear-gradient(135deg, #ebc0fd 0%, #d9ded8 100%)",
    "linear-gradient(135deg, #96e6a1 0%, #d4fc79 100%)",
  ];

  // Function to get a consistent gradient for each lesson
  const getGradientForLesson = (lessonId) => {
    if (!lessonId) return gradientColors[0];
    // Use lesson ID to generate a consistent index
    const hash = lessonId
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return gradientColors[hash % gradientColors.length];
  };

  const handleLike = (e) => {
    e.stopPropagation();
    if (onLike) {
      onLike(lesson._id);
    }
  };

  const handleBookmark = (e) => {
    e.stopPropagation();
    if (onBookmark) {
      onBookmark(lesson._id);
    }
  };

  const handleDownload = (e) => {
    e.stopPropagation();

    try {
      // Check if lesson has required data for PDF export
      if (!lesson.plan || !lesson.parameters) {
        message.error("Cannot download: Lesson plan data is incomplete");
        return;
      }

      // Export the lesson plan to PDF using the exportService
      exportToPdf(
        lesson.plan,
        lesson.parameters,
        lesson.lessonDate || lesson.createdAt,
        lesson.classId || { className: "N/A" }
      );

      // Track the download count on the backend
      if (onDownload) {
        onDownload(lesson._id);
      }

      message.success("Lesson plan downloaded successfully!");
    } catch (error) {
      console.error("Error downloading lesson plan:", error);
      message.error("Failed to download lesson plan");
    }
  };

  const handleUnshare = (e) => {
    e.stopPropagation();
    if (onUnshare) {
      Modal.confirm({
        title: "Unshare Lesson Plan",
        content: "Are you sure you want to remove this lesson plan from the community? This action will make it private again.",
        okText: "Yes, Unshare",
        okType: "danger",
        cancelText: "Cancel",
        onOk: () => {
          onUnshare(lesson._id);
        },
      });
    }
  };

  const handleCardClick = () => {
    setIsModalVisible(true);
  };

  const handleDownloadAssessment = async (assessmentToDownload) => {
    if (!assessmentToDownload) {
      message.error('No assessment available for download');
      return;
    }

    setDownloadingAssessmentId(assessmentToDownload._id);
    try {
      // Create a temporary container with the assessment content
      const tempContainer = document.createElement('div');
      tempContainer.id = 'temp-assessment-export';
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.width = '800px';
      tempContainer.style.padding = '20px';
      tempContainer.style.backgroundColor = '#ffffff';

      // Determine which content to export based on activity type
      let contentHtml = '';

      if (assessmentToDownload.activityType === 'spm-exam') {
        contentHtml = assessmentToDownload.generatedContent?.examHTML || assessmentToDownload.generatedContent?.assessmentHTML || '';
      } else if (assessmentToDownload.activityType === 'assessment') {
        contentHtml = assessmentToDownload.generatedContent?.assessmentHTML || '';
      } else {
        contentHtml = assessmentToDownload.generatedContent?.activityHTML || '';
      }

      if (!contentHtml) {
        message.error('No assessment content available for download');
        return;
      }

      tempContainer.innerHTML = contentHtml;
      document.body.appendChild(tempContainer);

      // Generate filename
      const fileName = `${assessmentToDownload.assessmentTitle || 'Assessment'}_${new Date().toISOString().split('T')[0]}.pdf`;

      // Export to PDF using enhancedPdfExport service
      await pdfExportService.exportHtmlElementToPdf(
        'temp-assessment-export',
        fileName
      );

      // Clean up
      document.body.removeChild(tempContainer);

      message.success('Assessment downloaded successfully!');
    } catch (error) {
      console.error('Error downloading assessment:', error);
      message.error('Failed to download assessment. Please try again.');
    } finally {
      setDownloadingAssessmentId(null);
    }
  };

  const getGradeColor = (grade) => {
    const colors = {
      "Form 1": "#87d068",
      "Form 2": "#108ee9",
      "Form 3": "#f50",
      "Form 4": "#2db7f5",
      "Form 5": "#faad14",
    };
    return colors[grade] || "#8c8c8c";
  };

  const getProficiencyColor = (level) => {
    if (!level) return "#8c8c8c";
    const colors = {
      A1: "#52c41a",
      "A2 Low": "#73d13d",
      "A2 High": "#95de64",
      "B1 Low": "#fadb14",
      "B1 Mid": "#ffc53d",
      "B1 High": "#ffec3d",
      B2: "#ff9c6e",
      C1: "#ff7875",
      Beginner: "#52c41a",
      Intermediate: "#fadb14",
      Advanced: "#ff7875",
    };
    return colors[level] || "#8c8c8c";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getHOTSColor = (hots) => {
    if (!hots) return "#8c8c8c";
    const colors = {
      remember: "#ff4d4f",
      understand: "#fa8c16",
      apply: "#fadb14",
      analyze: "#52c41a",
      evaluate: "#1890ff",
      create: "#722ed1",
      remembering: "#ff4d4f",
      understanding: "#fa8c16",
      applying: "#fadb14",
      analyzing: "#52c41a",
      evaluating: "#1890ff",
      creating: "#722ed1",
    };
    return colors[hots?.toLowerCase()] || "#8c8c8c";
  };

  // Get display values with fallbacks
  const displayTitle =
    lesson.communityData?.title ||
    lesson.parameters?.specificTopic ||
    "Lesson Plan";

  const displayDescription =
    lesson.communityData?.description ||
    lesson.plan?.learningObjective ||
    "Learning objectives for this lesson";

  const displayGrade = lesson.parameters?.grade || "Form 4";
  const displaySubject = lesson.classId?.subject || "Subject";

  const likes = lesson.communityData?.likes || 0;
  const downloads = lesson.communityData?.downloads || 0;
  const views = lesson.views || 0;

  // Author information
  const authorName = lesson.createdBy?.name || "Teacher";
  const authorSchool = lesson.createdBy?.schoolName || "";
  const isOwnLesson = lesson.createdBy?._id === currentUserId;

  // Get gradient for this lesson
  const gradient = getGradientForLesson(lesson._id);

  // Build actions array dynamically
  const cardActions = [
    <Tooltip title={isLiked ? "Unlike" : "Like"} key="like">
      <Button
        type="text"
        icon={
          isLiked ? (
            <HeartFilled style={{ color: "#ff4d4f" }} />
          ) : (
            <HeartOutlined />
          )
        }
        onClick={handleLike}
        className="action-btn"
        disabled={isOwnLesson}
      >
        {likes}
      </Button>
    </Tooltip>,
    <Tooltip title="Download" key="download">
      <Button
        type="text"
        icon={<DownloadOutlined />}
        onClick={handleDownload}
        className="action-btn"
      >
        {downloads}
      </Button>
    </Tooltip>,
    <Tooltip
      title={
        isBookmarked ? "Remove from collection" : "Save to collection"
      }
      key="bookmark"
    >
      <Button
        type="text"
        icon={
          isBookmarked ? (
            <StarFilled style={{ color: "#1890ff" }} />
          ) : (
            <StarOutlined />
          )
        }
        onClick={handleBookmark}
        className="action-btn"
        disabled={isOwnLesson}
      />
    </Tooltip>,
  ];

  // Add unshare button for owners
  if (isOwnLesson && onUnshare) {
    cardActions.push(
      <Tooltip title="Unshare from Community" key="unshare">
        <Button
          type="text"
          icon={<RollbackOutlined style={{ color: "#ff4d4f" }} />}
          onClick={handleUnshare}
          className="action-btn"
          danger
        >
          Unshare
        </Button>
      </Tooltip>
    );
  }

  return (
    <>
      <Card
        className="lesson-card"
        hoverable
        onClick={handleCardClick}
        cover={
          <div className="card-cover" style={{ background: gradient }}>
            <div className="gradient-overlay"></div>
            <div className="subject-banner">{displayGrade}</div>
            <div className="lesson-preview">
              <h3>{displayTitle}</h3>
              <p>{displayDescription}</p>
            </div>
          </div>
        }
        actions={cardActions}
      >
        <div className="card-content">
          <div className="tags-section">
            <Tag color={getGradeColor(displayGrade)} className="level-tag">
              {displayGrade}
            </Tag>

            {lesson.parameters?.proficiencyLevel && (
              <Tag
                color={getProficiencyColor(lesson.parameters.proficiencyLevel)}
                className="level-tag"
              >
                {lesson.parameters.proficiencyLevel}
              </Tag>
            )}

            {lesson.parameters?.hotsFocus && (
              <Tag
                color={getHOTSColor(lesson.parameters.hotsFocus)}
                className="topic-tag"
              >
                {lesson.parameters.hotsFocus.toUpperCase()}
              </Tag>
            )}

            {displaySubject && (
              <Tag className="topic-tag">{displaySubject}</Tag>
            )}

            {/* Community tags */}
            {lesson.communityData?.tags &&
              lesson.communityData.tags.length > 0 && (
                <>
                  {lesson.communityData.tags.slice(0, 2).map((tag, index) => (
                    <Tag key={index} className="topic-tag">
                      {tag}
                    </Tag>
                  ))}
                  {lesson.communityData.tags.length > 2 && (
                    <Tag className="more-tags">
                      +{lesson.communityData.tags.length - 2}
                    </Tag>
                  )}
                </>
              )}
          </div>

          <Meta
            avatar={
              <Avatar
                size="small"
                style={{ backgroundColor: "#1890ff" }}
                icon={<UserOutlined />}
              >
                {authorName.charAt(0).toUpperCase()}
              </Avatar>
            }
            title={
              <div>
                <div style={{ fontSize: "14px", fontWeight: 500 }}>
                  {authorName}
                  {isOwnLesson && (
                    <Tag
                      size="small"
                      color="green"
                      style={{ marginLeft: "8px" }}
                    >
                      You
                    </Tag>
                  )}
                </div>
                {authorSchool && (
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#8c8c8c",
                      fontWeight: 400,
                    }}
                  >
                    {authorSchool}
                  </div>
                )}
              </div>
            }
            description={
              <div className="card-meta">
                <div className="lesson-details">
                  <div className="detail-item">
                    <CalendarOutlined />
                    <span>
                      {formatDate(
                        lesson.lessonDate || lesson.communityData?.sharedAt
                      )}
                    </span>
                  </div>
                  {lesson.classId?.className && (
                    <div className="detail-item">
                      <BookOutlined />
                      <span>{lesson.classId.className}</span>
                    </div>
                  )}
                </div>
                <div className="engagement-stats">
                  <span>
                    <EyeOutlined /> {views}
                  </span>
                  <span>
                    <MessageOutlined />{" "}
                    {lesson.communityData?.reviews?.length || 0}
                  </span>
                  {assessments && assessments.length > 0 && (
                    <span style={{ color: "#1890ff" }}>
                      <FileTextOutlined /> {assessments.length}
                    </span>
                  )}
                </div>
              </div>
            }
          />
        </div>
      </Card>

      {/* Lesson Detail Modal - WITHOUT modal-content wrapper */}
      <Modal
        title={displayTitle}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button
            key="bookmark"
            icon={isBookmarked ? <StarFilled /> : <StarOutlined />}
            onClick={handleBookmark}
            disabled={isOwnLesson}
          >
            {isBookmarked ? "Saved" : "Save"}
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleDownload}
          >
            Download
          </Button>,
        ]}
        width={800}
        className="lesson-detail-modal"
      >
        {/* Learning Objective */}
        <div className="lesson-objectives">
          <h4>Learning Objective</h4>
          <p>
            {lesson.plan?.learningObjective ||
              "No learning objective specified"}
          </p>
        </div>

        {/* Success Criteria */}
        {lesson.plan?.successCriteria &&
          lesson.plan.successCriteria.length > 0 && (
            <div className="lesson-objectives">
              <h4>Success Criteria</h4>
              <ul>
                {lesson.plan.successCriteria.map((criteria, index) => (
                  <li key={index}>{criteria}</li>
                ))}
              </ul>
            </div>
          )}

        {/* Activities */}
        {lesson.plan?.activities && (
          <div className="lesson-objectives">
            <h4>Lesson Activities</h4>

            {lesson.plan.activities.preLesson &&
              lesson.plan.activities.preLesson.length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <h5 style={{ color: "#1890ff", marginBottom: "8px" }}>
                    Pre-Lesson Activities:
                  </h5>
                  <ul>
                    {lesson.plan.activities.preLesson.map((activity, index) => (
                      <li key={index}>{activity}</li>
                    ))}
                  </ul>
                </div>
              )}

            {lesson.plan.activities.duringLesson &&
              lesson.plan.activities.duringLesson.length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <h5 style={{ color: "#52c41a", marginBottom: "8px" }}>
                    During Lesson Activities:
                  </h5>
                  <ul>
                    {lesson.plan.activities.duringLesson.map(
                      (activity, index) => (
                        <li key={index}>{activity}</li>
                      )
                    )}
                  </ul>
                </div>
              )}

            {lesson.plan.activities.postLesson &&
              lesson.plan.activities.postLesson.length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <h5 style={{ color: "#fa8c16", marginBottom: "8px" }}>
                    Post-Lesson Activities:
                  </h5>
                  <ul>
                    {lesson.plan.activities.postLesson.map(
                      (activity, index) => (
                        <li key={index}>{activity}</li>
                      )
                    )}
                  </ul>
                </div>
              )}
          </div>
        )}

        {/* Community Description */}
        {lesson.communityData?.description && (
          <div className="lesson-description">
            <h4>Teacher's Experience & Tips</h4>
            <p>{lesson.communityData.description}</p>
          </div>
        )}

        {/* SOW Information */}
        {lesson.parameters?.sow && (
          <div className="lesson-description">
            <h4>Scheme of Work Details</h4>
            <div className="sow-details">
              {lesson.parameters.sow.theme && (
                <p>
                  <strong>Theme:</strong> {lesson.parameters.sow.theme}
                </p>
              )}
              {lesson.parameters.sow.topic && (
                <p>
                  <strong>Topic:</strong> {lesson.parameters.sow.topic}
                </p>
              )}
              {lesson.parameters.sow.focus && (
                <p>
                  <strong>Focus:</strong> {lesson.parameters.sow.focus}
                </p>
              )}
              {lesson.parameters.sow.lessonNo && (
                <p>
                  <strong>Lesson No:</strong> {lesson.parameters.sow.lessonNo}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Lesson Metadata in a compact format */}
        <div className="lesson-description">
          <h4>Lesson Details</h4>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            <div>
              <strong>Shared by:</strong> {authorName}
              {authorSchool && ` (${authorSchool})`}
            </div>
            <div>
              <strong>Grade:</strong>{" "}
              <Tag color={getGradeColor(displayGrade)}>{displayGrade}</Tag>
            </div>
            {lesson.parameters?.proficiencyLevel && (
              <div>
                <strong>Level:</strong>{" "}
                <Tag
                  color={getProficiencyColor(
                    lesson.parameters.proficiencyLevel
                  )}
                >
                  {lesson.parameters.proficiencyLevel}
                </Tag>
              </div>
            )}
            {lesson.parameters?.hotsFocus && (
              <div>
                <strong>HOTS:</strong>{" "}
                <Tag color={getHOTSColor(lesson.parameters.hotsFocus)}>
                  {lesson.parameters.hotsFocus.toUpperCase()}
                </Tag>
              </div>
            )}
            <div>
              <strong>Subject:</strong> {displaySubject}
            </div>
            <div>
              <strong>Shared:</strong>{" "}
              {formatDate(lesson.communityData?.sharedAt || lesson.createdAt)}
            </div>
          </div>
        </div>

        {/* Tags */}
        {lesson.communityData?.tags && lesson.communityData.tags.length > 0 && (
          <div className="lesson-description">
            <h4>Tags</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {lesson.communityData.tags.map((tag, index) => (
                <Tag key={index} color="blue">
                  {tag}
                </Tag>
              ))}
            </div>
          </div>
        )}

        {/* Assessment Section */}
        <Divider orientation="left" style={{ marginTop: "24px", marginBottom: "16px" }}>
          <FileTextOutlined style={{ marginRight: "8px" }} />
          Related Assessments ({assessments.length})
        </Divider>

        {assessments && assessments.length > 0 ? (
          <div style={{ marginBottom: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {assessments.map((assessment, index) => (
              <div
                key={assessment._id || index}
                style={{
                  padding: "16px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "8px",
                  border: "1px solid #e8e8e8",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div style={{ flex: 1 }}>
                    <h5 style={{ marginBottom: "8px", color: "#1890ff" }}>
                      <FileTextOutlined style={{ marginRight: "6px" }} />
                      {assessment.assessmentTitle || assessment.title || `Assessment ${index + 1}`}
                    </h5>

                    {assessment.assessmentDescription && (
                      <p style={{ fontSize: "13px", color: "#666", marginBottom: "12px" }}>
                        {assessment.assessmentDescription}
                      </p>
                    )}

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                      <Tag color="purple">
                        {assessment.activityType?.toUpperCase() || "ACTIVITY"}
                      </Tag>

                      {assessment.assessmentType && (
                        <Tag color="cyan">{assessment.assessmentType}</Tag>
                      )}

                      {assessment.duration && (
                        <Tag icon={<ClockCircleOutlined />}>{assessment.duration}</Tag>
                      )}

                      {assessment.questionCount && (
                        <Tag color="green">{assessment.questionCount} Questions</Tag>
                      )}
                    </div>

                    {assessment.skills && assessment.skills.length > 0 && (
                      <div style={{ fontSize: "12px", color: "#8c8c8c" }}>
                        <strong>Skills:</strong> {assessment.skills.join(", ")}
                      </div>
                    )}
                  </div>

                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={() => handleDownloadAssessment(assessment)}
                    loading={downloadingAssessmentId === assessment._id}
                    style={{ marginLeft: "12px" }}
                  >
                    Download
                  </Button>
                </div>

                {/* Show content availability as single combined indicator */}
                <div style={{ marginTop: "12px", fontSize: "12px" }}>
                  {(() => {
                    const content = assessment.generatedContent || {};

                    // Check for student content
                    const hasStudentContent = !!(
                      assessment.hasActivity ||
                      content.activityHTML ||
                      content.assessmentHTML ||
                      content.examHTML
                    );

                    // Check for teacher content
                    const hasTeacherContent = !!(
                      assessment.hasRubric ||
                      content.rubricHTML ||
                      content.answerKeyHTML
                    );

                    if (!hasStudentContent && !hasTeacherContent) return null;

                    // Determine labels based on activity type
                    let studentLabel = "Activity Sheet";
                    let teacherLabel = "Rubric";

                    if (assessment.activityType === "spm-exam") {
                      studentLabel = "SPM Exam Paper";
                      teacherLabel = "Answer Key";
                    } else if (assessment.activityType === "assessment") {
                      studentLabel = "Assessment Paper";
                      teacherLabel = "Answer Key";
                    }

                    // Build combined label
                    let displayLabel = "";
                    if (hasStudentContent && hasTeacherContent) {
                      displayLabel = `${studentLabel} & ${teacherLabel}`;
                    } else if (hasStudentContent) {
                      displayLabel = studentLabel;
                    } else if (hasTeacherContent) {
                      displayLabel = teacherLabel;
                    }

                    return (
                      <span style={{ color: "#52c41a" }}>
                        <CheckCircleOutlined /> {displayLabel}
                      </span>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ marginBottom: "20px" }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: "#8c8c8c" }}>
                  No assessment available for this lesson plan yet.
                  <br />
                  <span style={{ fontSize: "12px" }}>
                    The teacher hasn't created an assessment for this lesson plan.
                  </span>
                </span>
              }
              style={{
                padding: "24px 16px",
                backgroundColor: "#fafafa",
                borderRadius: "8px",
                border: "1px solid #f0f0f0",
              }}
            />
          </div>
        )}

        {/* Lesson Statistics */}
        <div className="lesson-stats">
          <div className="stat-item">
            <HeartFilled style={{ color: "#ff4d4f" }} />
            <span>{likes} likes</span>
          </div>
          <div className="stat-item">
            <DownloadOutlined />
            <span>{downloads} downloads</span>
          </div>
          <div className="stat-item">
            <EyeOutlined />
            <span>{views} views</span>
          </div>
          {lesson.communityData?.averageRating > 0 && (
            <div className="stat-item">
              <StarFilled style={{ color: "#fadb14" }} />
              <span>
                {lesson.communityData.averageRating.toFixed(1)} rating
              </span>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default LessonCard;
