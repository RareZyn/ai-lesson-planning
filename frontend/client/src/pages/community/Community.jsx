// src/pages/community/Community.jsx - Updated to use new lesson plan data structure
import React, { useState, useEffect } from "react";
import { Input, Select, Button, Row, Col, Tabs, message } from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import LessonCard from "../../components/Card/LessonCard";
import UploadLessonModal from "../../components/Modal/UploadLessonModal";
import {
  dummySharedLessonPlans,
  getSharedLessonPlans,
} from "../../data/LessonPlanData";
import "./Community.css";

const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const Community = () => {
  const [lessons, setLessons] = useState([]);
  const [filteredLessons, setFilteredLessons] = useState([]);
  const [activeTab, setActiveTab] = useState("discover");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    subject: "all",
    level: "all",
    search: "",
  });

  useEffect(() => {
    // Load initial data - transform shared lesson plans to match expected structure
    const transformedLessons = dummySharedLessonPlans.map((shared) => ({
      _id: shared._id,
      // Map the shared lesson plan data to match LessonCard expectations
      ...shared.originalLessonPlan,
      // Add community-specific fields
      author: shared.sharedBy.name,
      authorAvatar: shared.sharedBy.avatar,
      schoolName: shared.sharedBy.schoolName,
      uploadDate: shared.sharedAt,
      likes: shared.likes,
      downloads: shared.downloads,
      views: shared.views,
      comments: shared.comments,
      description: shared.description,
      className: shared.className,
      isShared: true,
      // Add fields for bookmarking (user-specific, would come from backend)
      isLiked: false,
      isBookmarked: false,
    }));

    setLessons(transformedLessons);
    setFilteredLessons(transformedLessons);
  }, []);

  useEffect(() => {
    // Apply filters when filters change
    let filtered = lessons;

    if (filters.search) {
      filtered = filtered.filter(
        (lesson) =>
          lesson.parameters?.Sow?.topic
            ?.toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          lesson.parameters?.Sow?.theme
            ?.toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          lesson.description
            ?.toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          lesson.plan?.learningObjective
            ?.toLowerCase()
            .includes(filters.search.toLowerCase())
      );
    }

    if (filters.subject !== "all") {
      filtered = filtered.filter((lesson) =>
        lesson.parameters?.Sow?.theme
          ?.toLowerCase()
          .includes(filters.subject.toLowerCase())
      );
    }

    if (filters.level !== "all") {
      filtered = filtered.filter(
        (lesson) => lesson.parameters?.grade === filters.level
      );
    }

    setFilteredLessons(filtered);
  }, [lessons, filters]);

  const handleFilterChange = (type, value) => {
    setFilters((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  const handleSearch = (value) => {
    setFilters((prev) => ({
      ...prev,
      search: value,
    }));
  };

  const handleLessonShare = async (shareData) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In real implementation, this would create a new shared lesson plan
      console.log("Sharing lesson plan:", shareData);

      message.success("Lesson plan shared successfully to the community!");
      setIsUploadModalOpen(false);

      // Optionally refresh the lessons list here
    } catch (error) {
      console.error("Share error:", error);
      message.error("Failed to share lesson plan");
    }
  };

  const handleLike = (lessonId) => {
    setLessons((prev) =>
      prev.map((lesson) =>
        lesson._id === lessonId
          ? {
              ...lesson,
              likes: lesson.likes + (lesson.isLiked ? -1 : 1),
              isLiked: !lesson.isLiked,
            }
          : lesson
      )
    );
    message.success("Lesson updated!");
  };

  const handleDownload = (lessonId) => {
    setLessons((prev) =>
      prev.map((lesson) =>
        lesson._id === lessonId
          ? { ...lesson, downloads: lesson.downloads + 1 }
          : lesson
      )
    );
    message.success("Lesson plan downloaded!");
  };

  const getTabLessons = () => {
    switch (activeTab) {
      case "discover":
        return filteredLessons;
      case "myCollection":
        return filteredLessons.filter((lesson) => lesson.isBookmarked);
      case "myShared":
        // In real app, this would filter by current user's shared lessons
        return filteredLessons.filter(
          (lesson) => lesson.author === "Ahmad Albab" // Current user mock
        );
      default:
        return filteredLessons;
    }
  };

  const renderLessons = () => {
    const tabLessons = getTabLessons();

    if (tabLessons.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-content">
            <h3>No lessons found</h3>
            <p>Try adjusting your filters or search terms</p>
          </div>
        </div>
      );
    }

    return (
      <Row gutter={[24, 24]}>
        {tabLessons.map((lesson) => (
          <Col xs={24} sm={12} lg={8} xl={6} key={lesson._id}>
            <LessonCard
              lesson={lesson}
              onLike={handleLike}
              onDownload={handleDownload}
            />
          </Col>
        ))}
      </Row>
    );
  };

  return (
    <div className="community-container">
      {/* Header */}
      <div className="community-header">
        <div className="header-content">
          <h1>Lesson Sharing Hub</h1>
          <p>
            Discover, share, and collaborate on lesson plans with fellow
            educators
          </p>
        </div>
        <Button
          type="primary"
          icon={<UploadOutlined />}
          size="large"
          onClick={() => setIsUploadModalOpen(true)}
          className="upload-btn"
        >
          Share Lesson Plan
        </Button>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="Search lesson plans..."
              onSearch={handleSearch}
              onChange={(e) => handleSearch(e.target.value)}
              enterButton={<SearchOutlined />}
              size="large"
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              value={filters.subject}
              onChange={(value) => handleFilterChange("subject", value)}
              size="large"
              style={{ width: "100%" }}
              placeholder="Subject"
            >
              <Option value="all">All Subjects</Option>
              <Option value="people">People and Culture</Option>
              <Option value="science">Science and Technology</Option>
              <Option value="consumer">Consumer Awareness</Option>
              <Option value="health">Health and Environment</Option>
              <Option value="values">Values and Citizenship</Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              value={filters.level}
              onChange={(value) => handleFilterChange("level", value)}
              size="large"
              style={{ width: "100%" }}
              placeholder="Level"
            >
              <Option value="all">All Levels</Option>
              <Option value="Form 1">Form 1</Option>
              <Option value="Form 2">Form 2</Option>
              <Option value="Form 3">Form 3</Option>
              <Option value="Form 4">Form 4</Option>
              <Option value="Form 5">Form 5</Option>
            </Select>
          </Col>
          <Col xs={24} sm={24} md={8}>
            <div className="filter-results">
              <FilterOutlined /> {filteredLessons.length} lessons found
            </div>
          </Col>
        </Row>
      </div>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="community-tabs"
        size="large"
      >
        <TabPane tab="Discover Lessons" key="discover">
          {renderLessons()}
        </TabPane>
        <TabPane tab="My Collection" key="myCollection">
          {renderLessons()}
        </TabPane>
        <TabPane tab="My Shared Lessons" key="myShared">
          {renderLessons()}
        </TabPane>
      </Tabs>

      {/* Upload Modal */}
      <UploadLessonModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSubmit={handleLessonShare}
      />
    </div>
  );
};

export default Community;
