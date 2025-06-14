// src/components/Card/LessonCard.jsx - Updated with working bookmark functionality
import React, { useState, useEffect } from "react";
import { Card, Tag, Button, Avatar, Tooltip, Modal } from "antd";
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
} from "@ant-design/icons";
import "./LessonCard.css";

const { Meta } = Card;

const LessonCard = ({
  lesson,
  onLike,
  onDownload,
  onBookmark,
  currentUserId,
}) => {
  const [isLiked, setIsLiked] = useState(
    lesson.communityData?.hasUserLiked || false
  );
  const [isBookmarked, setIsBookmarked] = useState(
    lesson.isBookmarked || false
  );
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Update local state when lesson prop changes
  useEffect(() => {
    setIsLiked(lesson.communityData?.hasUserLiked || false);
    setIsBookmarked(lesson.isBookmarked || false);
  }, [lesson.communityData?.hasUserLiked, lesson.isBookmarked]);

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
    if (onDownload) {
      onDownload(lesson._id);
    }
  };

  const handleCardClick = () => {
    setIsModalVisible(true);
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

  return (
    <>
      <Card
        className="lesson-card"
        hoverable
        onClick={handleCardClick}
        cover={
          <div className="card-cover">
            <div
              className="subject-banner"
              style={{ backgroundColor: getGradeColor(displayGrade) }}
            >
              {displayGrade}
            </div>
            <div className="lesson-preview">
              <h3>{displayTitle}</h3>
              <p>{displayDescription}</p>
            </div>
          </div>
        }
        actions={[
          <Tooltip title={isLiked ? "Unlike" : "Like"}>
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
          <Tooltip title="Download">
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
        ]}
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
                </div>
              </div>
            }
          />
        </div>
      </Card>

      {/* Lesson Detail Modal */}
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
        <div className="modal-content">
          {/* Author & Sharing Info */}
          <div className="lesson-info">
            <div className="info-row">
              <span className="info-label">Shared by:</span>
              <div>
                <strong>{authorName}</strong>
                {authorSchool && (
                  <div style={{ fontSize: "12px", color: "#8c8c8c" }}>
                    {authorSchool}
                  </div>
                )}
              </div>
            </div>
            <div className="info-row">
              <span className="info-label">Grade:</span>
              <Tag color={getGradeColor(displayGrade)}>{displayGrade}</Tag>
            </div>
            {lesson.parameters?.proficiencyLevel && (
              <div className="info-row">
                <span className="info-label">Proficiency Level:</span>
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
              <div className="info-row">
                <span className="info-label">HOTS Focus:</span>
                <Tag color={getHOTSColor(lesson.parameters.hotsFocus)}>
                  {lesson.parameters.hotsFocus.toUpperCase()}
                </Tag>
              </div>
            )}
            <div className="info-row">
              <span className="info-label">Subject:</span>
              <span>{displaySubject}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Shared Date:</span>
              <span>
                {formatDate(lesson.communityData?.sharedAt || lesson.createdAt)}
              </span>
            </div>
          </div>

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
                      {lesson.plan.activities.preLesson.map(
                        (activity, index) => (
                          <li key={index}>{activity}</li>
                        )
                      )}
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

          {/* Tags */}
          {lesson.communityData?.tags &&
            lesson.communityData.tags.length > 0 && (
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
        </div>
      </Modal>
    </>
  );
};

export default LessonCard;
