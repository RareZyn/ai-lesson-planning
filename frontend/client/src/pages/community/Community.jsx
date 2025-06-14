// src/pages/community/Community.jsx - Updated with simplified callback
import React, { useState, useEffect } from "react";
import { Input, Select, Button, Row, Col, Tabs, message, Spin } from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import LessonCard from "../../components/Card/LessonCard";
import UploadLessonModal from "../../components/Modal/UploadLessonModal";
import { communityAPI } from "../../services/communityService";
import { useUser } from "../../context/UserContext"; // Import the user context
import "./Community.css";

const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const Community = () => {
  const { user, userId, isAuthenticated } = useUser(); // Get user data from context
  const [lessons, setLessons] = useState([]);
  const [userLessons, setUserLessons] = useState([]);
  const [filteredLessons, setFilteredLessons] = useState([]);
  const [activeTab, setActiveTab] = useState("discover");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    grade: "",
    subject: "",
    search: "",
    sortBy: "recent",
  });

  useEffect(() => {
    if (isAuthenticated && userId) {
      loadCommunityData();
    } else {
      // If not authenticated, just load community lessons
      loadCommunityLessonsOnly();
    }
  }, [isAuthenticated, userId]);

  useEffect(() => {
    applyFilters();
  }, [lessons, filters, activeTab]);

  const loadCommunityData = async () => {
    setLoading(true);
    try {
      // Load community lessons and user's lessons in parallel
      const [communityResponse, userResponse] = await Promise.all([
        communityAPI.getCommunityLessons({
          page: 1,
          limit: 50,
          sortBy: filters.sortBy,
        }),
        communityAPI.getUserLessonPlans(userId, {
          page: 1,
          limit: 50,
        }),
      ]);

      if (communityResponse.success) {
        setLessons(communityResponse.data || []);
      }

      if (userResponse.success) {
        setUserLessons(userResponse.data || []);
      }
    } catch (error) {
      console.error("Error loading community data:", error);
      if (error.response?.status === 401) {
        message.error("Please log in to access community features");
      } else {
        message.error("Failed to load community lessons");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadCommunityLessonsOnly = async () => {
    setLoading(true);
    try {
      const communityResponse = await communityAPI.getCommunityLessons({
        page: 1,
        limit: 50,
        sortBy: filters.sortBy,
      });

      if (communityResponse.success) {
        setLessons(communityResponse.data || []);
      }
    } catch (error) {
      console.error("Error loading community lessons:", error);
      message.error("Failed to load community lessons");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let dataToFilter = [];

    // Choose data source based on active tab
    switch (activeTab) {
      case "discover":
        dataToFilter = lessons;
        break;
      case "myCollection":
        // Filter user's bookmarked lessons (you'll need to track this in your backend)
        dataToFilter = lessons.filter((lesson) => lesson.isBookmarked);
        break;
      case "myShared":
        // Filter lessons created by current user
        if (!userId) {
          dataToFilter = [];
        } else {
          dataToFilter = lessons.filter(
            (lesson) => lesson.createdBy && lesson.createdBy._id === userId
          );
        }
        break;
      default:
        dataToFilter = lessons;
    }

    let filtered = [...dataToFilter];

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        (lesson) =>
          lesson.parameters?.specificTopic
            ?.toLowerCase()
            .includes(searchTerm) ||
          lesson.plan?.learningObjective?.toLowerCase().includes(searchTerm) ||
          lesson.communityData?.title?.toLowerCase().includes(searchTerm) ||
          lesson.communityData?.description?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply grade filter
    if (filters.grade) {
      filtered = filtered.filter(
        (lesson) => lesson.parameters?.grade === filters.grade
      );
    }

    // Apply subject filter (based on class subject)
    if (filters.subject) {
      filtered = filtered.filter((lesson) =>
        lesson.classId?.subject
          ?.toLowerCase()
          .includes(filters.subject.toLowerCase())
      );
    }

    setFilteredLessons(filtered);
  };

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

  // Simplified callback - just reload data after sharing
  const handleLessonShareSuccess = () => {
    // Reload community data to show the newly shared lesson
    if (isAuthenticated && userId) {
      loadCommunityData();
    } else {
      loadCommunityLessonsOnly();
    }
  };

  const handleLike = async (lessonId) => {
    if (!isAuthenticated) {
      message.error("Please log in to like lesson plans");
      return;
    }

    try {
      const response = await communityAPI.toggleLike(lessonId, userId);

      if (response.success) {
        // Update local state to reflect the like change
        setLessons((prev) =>
          prev.map((lesson) =>
            lesson._id === lessonId
              ? {
                  ...lesson,
                  communityData: {
                    ...lesson.communityData,
                    likes: response.data.likes,
                    hasUserLiked: response.data.hasLiked,
                  },
                }
              : lesson
          )
        );
        message.success(response.message);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      message.error(error.response?.data?.message || "Failed to update like");
    }
  };

  const handleDownload = async (lessonId) => {
    try {
      const response = await communityAPI.downloadLessonPlan(lessonId, userId);

      if (response.success) {
        // Update local state to reflect the download count
        setLessons((prev) =>
          prev.map((lesson) =>
            lesson._id === lessonId
              ? {
                  ...lesson,
                  communityData: {
                    ...lesson.communityData,
                    downloads: (lesson.communityData?.downloads || 0) + 1,
                  },
                }
              : lesson
          )
        );
        message.success("Lesson plan downloaded successfully!");

        // You can also trigger an actual file download here if needed
        // For example, generate a PDF or export the lesson plan data
      }
    } catch (error) {
      console.error("Error downloading lesson plan:", error);
      message.error(
        error.response?.data?.message || "Failed to download lesson plan"
      );
    }
  };

  const renderLessons = () => {
    if (loading) {
      return (
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Spin size="large" />
          <p style={{ marginTop: "16px" }}>Loading lessons...</p>
        </div>
      );
    }

    if (filteredLessons.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-content">
            <h3>No lessons found</h3>
            <p>
              {activeTab === "myShared"
                ? isAuthenticated
                  ? "You haven't shared any lessons yet. Share your first lesson plan!"
                  : "Please log in to view your shared lessons."
                : "Try adjusting your filters or search terms"}
            </p>
            {activeTab === "myShared" && isAuthenticated && (
              <Button
                type="primary"
                icon={<UploadOutlined />}
                onClick={() => setIsUploadModalOpen(true)}
                style={{ marginTop: "16px" }}
              >
                Share Your First Lesson
              </Button>
            )}
          </div>
        </div>
      );
    }

    return (
      <Row gutter={[24, 24]}>
        {filteredLessons.map((lesson) => (
          <Col xs={24} sm={12} lg={8} xl={6} key={lesson._id}>
            <LessonCard
              lesson={lesson}
              onLike={handleLike}
              onDownload={handleDownload}
              currentUserId={userId}
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
          onClick={() => {
            if (!isAuthenticated) {
              message.error("Please log in to share lesson plans");
              return;
            }
            setIsUploadModalOpen(true);
          }}
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
              value={filters.grade}
              onChange={(value) => handleFilterChange("grade", value)}
              size="large"
              style={{ width: "100%" }}
              placeholder="Grade"
              allowClear
            >
              <Option value="Form 1">Form 1</Option>
              <Option value="Form 2">Form 2</Option>
              <Option value="Form 3">Form 3</Option>
              <Option value="Form 4">Form 4</Option>
              <Option value="Form 5">Form 5</Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              value={filters.subject}
              onChange={(value) => handleFilterChange("subject", value)}
              size="large"
              style={{ width: "100%" }}
              placeholder="Subject"
              allowClear
            >
              <Option value="English">English</Option>
              <Option value="Mathematics">Mathematics</Option>
              <Option value="Science">Science</Option>
              <Option value="History">History</Option>
              <Option value="Geography">Geography</Option>
            </Select>
          </Col>
          <Col xs={24} sm={24} md={8}>
            <div className="filter-results">
              <FilterOutlined /> {filteredLessons.length} lessons found
            </div>
          </Col>
        </Row>
      </div>

      {/* Authentication Notice */}
      {!isAuthenticated && (
        <div style={{ marginBottom: "16px" }}>
          <message.info>
            <span>
              Log in to share lesson plans, like lessons, and access your
              collection.
            </span>
          </message.info>
        </div>
      )}

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
        <TabPane
          tab="My Collection"
          key="myCollection"
          disabled={!isAuthenticated}
        >
          {renderLessons()}
        </TabPane>
        <TabPane
          tab="My Shared Lessons"
          key="myShared"
          disabled={!isAuthenticated}
        >
          {renderLessons()}
        </TabPane>
      </Tabs>

      {/* Upload Modal */}
      <UploadLessonModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSubmit={handleLessonShareSuccess}
        currentUserId={userId}
      />
    </div>
  );
};

export default Community;
