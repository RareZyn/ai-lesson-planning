// src/pages/community/components/Card/LessonCard.jsx
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
    onLike(lesson.id);
  };

  const handleBookmark = (e) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    onDownload(lesson.id);
  };

  const handleCardClick = () => {
    setIsModalVisible(true);
  };

  const getSubjectColor = (subject) => {
    const colors = {
      English: "#1890ff",
      Mathematics: "#52c41a",
      Science: "#fa8c16",
      History: "#722ed1",
      Geography: "#13c2c2",
    };
    return colors[subject] || "#8c8c8c";
  };

  const getLevelColor = (level) => {
    const colors = {
      "Form 1": "#87d068",
      "Form 2": "#108ee9",
      "Form 3": "#f50",
      "Form 4": "#2db7f5",
      "Form 5": "#faad14",
    };
    return colors[level] || "#8c8c8c";
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
              style={{ backgroundColor: getSubjectColor(lesson.subject) }}
            >
              {lesson.subject}
            </div>
            <div className="lesson-preview">
              <h3>{lesson.title}</h3>
              <p>{lesson.description}</p>
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
              {lesson.likes + (isLiked ? 1 : 0)}
            </Button>
          </Tooltip>,
          <Tooltip title="Download">
            <Button
              type="text"
              icon={<DownloadOutlined />}
              onClick={handleDownload}
              className="action-btn"
            >
              {lesson.downloads}
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
            <Tag color={getLevelColor(lesson.level)} className="level-tag">
              {lesson.level}
            </Tag>
            {lesson.tags.slice(0, 2).map((tag) => (
              <Tag key={tag} className="topic-tag">
                {tag}
              </Tag>
            ))}
            {lesson.tags.length > 2 && (
              <Tag className="more-tags">+{lesson.tags.length - 2}</Tag>
            )}
          </div>

          <Meta
            avatar={
              <Avatar src={lesson.authorAvatar} size="small">
                {lesson.author[0]}
              </Avatar>
            }
            title={lesson.author}
            description={
              <div className="card-meta">
                <span className="upload-date">{lesson.uploadDate}</span>
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
        title={lesson.title}
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
          <div className="lesson-info">
            <div className="info-row">
              <span className="info-label">Subject:</span>
              <Tag color={getSubjectColor(lesson.subject)}>
                {lesson.subject}
              </Tag>
            </div>
            <div className="info-row">
              <span className="info-label">Level:</span>
              <Tag color={getLevelColor(lesson.level)}>{lesson.level}</Tag>
            </div>
            <div className="info-row">
              <span className="info-label">Duration:</span>
              <span>{lesson.duration || "60 minutes"}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Author:</span>
              <span>{lesson.author}</span>
            </div>
          </div>

          <div className="lesson-description">
            <h4>Description</h4>
            <p>{lesson.fullDescription || lesson.description}</p>
          </div>

          <div className="lesson-objectives">
            <h4>Learning Objectives</h4>
            <ul>
              {lesson.objectives?.map((objective, index) => (
                <li key={index}>{objective}</li>
              )) || (
                <li>
                  Students will understand the key concepts covered in this
                  lesson.
                </li>
              )}
            </ul>
          </div>

          <div className="lesson-tags">
            <h4>Topics Covered</h4>
            <div className="tags-list">
              {lesson.tags.map((tag) => (
                <Tag key={tag} className="detail-tag">
                  {tag}
                </Tag>
              ))}
            </div>
          </div>

          <div className="lesson-stats">
            <div className="stat-item">
              <HeartFilled style={{ color: "#ff4d4f" }} />
              <span>{lesson.likes + (isLiked ? 1 : 0)} likes</span>
            </div>
            <div className="stat-item">
              <DownloadOutlined />
              <span>{lesson.downloads} downloads</span>
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
