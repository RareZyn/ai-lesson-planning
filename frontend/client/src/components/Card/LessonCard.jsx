// src/components/Card/LessonCard.jsx
import React, { useState } from "react";
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
} from "@ant-design/icons";
import "./LessonCard.css";

const { Meta } = Card;

const LessonCard = ({ lesson, onLike, onDownload }) => {
  const [isLiked, setIsLiked] = useState(lesson.isLiked || false);
  const [isBookmarked, setIsBookmarked] = useState(
    lesson.isBookmarked || false
  );
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleLike = (e) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    onLike(lesson._id);
  };

  const handleBookmark = (e) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    onDownload(lesson._id);
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
    const colors = {
      A1: "#52c41a",
      "A2 Low": "#73d13d",
      "A2 High": "#95de64",
      "B1 Low": "#fadb14",
      "B1 Mid": "#ffc53d",
      "B1 High": "#ffec3d",
      B2: "#ff9c6e",
      C1: "#ff7875",
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
    const colors = {
      remember: "#ff4d4f",
      understand: "#fa8c16",
      apply: "#fadb14",
      analyze: "#52c41a",
      evaluate: "#1890ff",
      create: "#722ed1",
    };
    return colors[hots?.toLowerCase()] || "#8c8c8c";
  };

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
              style={{ backgroundColor: "#1890ff" }}
            >
              {lesson.parameters?.grade || "Form 4"}
            </div>
            <div className="lesson-preview">
              <h3>{lesson.parameters?.Sow?.topic || "English Lesson"}</h3>
              <p>
                {lesson.plan?.learningObjective ||
                  "Learning objectives for this lesson"}
              </p>
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
            >
              {lesson.likes || 0}
            </Button>
          </Tooltip>,
          <Tooltip title="Download">
            <Button
              type="text"
              icon={<DownloadOutlined />}
              onClick={handleDownload}
              className="action-btn"
            >
              {lesson.downloads || 0}
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
            />
          </Tooltip>,
        ]}
      >
        <div className="card-content">
          <div className="tags-section">
            <Tag
              color={getGradeColor(lesson.parameters?.grade)}
              className="level-tag"
            >
              {lesson.parameters?.grade || "Form 4"}
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
            {lesson.parameters?.Sow?.focus && (
              <Tag className="topic-tag">{lesson.parameters.Sow.focus}</Tag>
            )}
          </div>

          <Meta
            avatar={
              <Avatar size="small" style={{ backgroundColor: "#1890ff" }}>
                T
              </Avatar>
            }
            title="Teacher" // Will be fetched from backend
            description={
              <div className="card-meta">
                <div className="lesson-details">
                  <div className="detail-item">
                    <CalendarOutlined />
                    <span>{formatDate(lesson.lessonDate)}</span>
                  </div>
                  {lesson.parameters?.Sow?.theme && (
                    <div className="detail-item">
                      <BookOutlined />
                      <span>{lesson.parameters.Sow.theme}</span>
                    </div>
                  )}
                </div>
                <div className="engagement-stats">
                  <span>
                    <EyeOutlined /> {lesson.views || 0}
                  </span>
                  <span>
                    <MessageOutlined /> {lesson.comments?.length || 0}
                  </span>
                </div>
              </div>
            }
          />
        </div>
      </Card>

      {/* Lesson Detail Modal */}
      <Modal
        title={lesson.parameters?.Sow?.topic || "English Lesson"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button
            key="bookmark"
            icon={isBookmarked ? <StarFilled /> : <StarOutlined />}
            onClick={handleBookmark}
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
          {/* Lesson Parameters */}
          <div className="lesson-info">
            <div className="info-row">
              <span className="info-label">Grade:</span>
              <Tag color={getGradeColor(lesson.parameters?.grade)}>
                {lesson.parameters?.grade || "Form 4"}
              </Tag>
            </div>
            <div className="info-row">
              <span className="info-label">Proficiency Level:</span>
              <Tag
                color={getProficiencyColor(lesson.parameters?.proficiencyLevel)}
              >
                {lesson.parameters?.proficiencyLevel || "B1 Mid"}
              </Tag>
            </div>
            <div className="info-row">
              <span className="info-label">HOTS Focus:</span>
              <Tag color={getHOTSColor(lesson.parameters?.hotsFocus)}>
                {lesson.parameters?.hotsFocus?.toUpperCase() || "APPLY"}
              </Tag>
            </div>
            <div className="info-row">
              <span className="info-label">Lesson Date:</span>
              <span>{formatDate(lesson.lessonDate)}</span>
            </div>
          </div>

          {/* Scheme of Work Info */}
          {lesson.parameters?.Sow && (
            <div className="lesson-description">
              <h4>Scheme of Work</h4>
              <div className="sow-details">
                <p>
                  <strong>Theme:</strong> {lesson.parameters.Sow.theme}
                </p>
                <p>
                  <strong>Topic:</strong> {lesson.parameters.Sow.topic}
                </p>
                <p>
                  <strong>Focus:</strong> {lesson.parameters.Sow.focus}
                </p>
                <p>
                  <strong>Lesson No:</strong> {lesson.parameters.Sow.lessonNo}
                </p>
              </div>
            </div>
          )}

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

          {/* Specific Topic */}
          {lesson.parameters?.specificTopic && (
            <div className="lesson-description">
              <h4>Specific Topic</h4>
              <p>{lesson.parameters.specificTopic}</p>
            </div>
          )}

          {/* Community Description (for shared lessons) */}
          {lesson.description && (
            <div className="lesson-description">
              <h4>Teacher's Experience</h4>
              <p>{lesson.description}</p>
            </div>
          )}

          {/* Additional Notes */}
          {lesson.parameters?.additionalNotes && (
            <div className="lesson-description">
              <h4>Additional Notes</h4>
              <p>{lesson.parameters.additionalNotes}</p>
            </div>
          )}

          {/* Lesson Statistics */}
          <div className="lesson-stats">
            <div className="stat-item">
              <HeartFilled style={{ color: "#ff4d4f" }} />
              <span>{(lesson.likes || 0) + (isLiked ? 1 : 0)} likes</span>
            </div>
            <div className="stat-item">
              <DownloadOutlined />
              <span>{lesson.downloads || 0} downloads</span>
            </div>
            <div className="stat-item">
              <EyeOutlined />
              <span>{lesson.views || 0} views</span>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default LessonCard;

