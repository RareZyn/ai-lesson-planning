import React, { useState, useEffect, useCallback } from 'react';
import styles from './PlannerPage.module.css'; // Use CSS Modules for scoped styles
import CalendarView from './CalendarView';
import LessonCard from '../displaylesson/LessonCard';
import MaterialManagement from '../../material/MaterialManagement'; // Import the new component
import { getAllLessonPlans } from '../../../services/lessonService';
import { assessmentAPI } from '../../../services/assessmentService';
import { useNavigate } from 'react-router-dom';
import { SearchOutlined, CloseCircleOutlined, FilterOutlined } from '@ant-design/icons';
import { Input, Select, Button, Badge } from 'antd';

const { Option } = Select;

const PlannerPage = () => {
  // Use strings for tab identifiers for better readability
  const [activeTab, setActiveTab] = useState('lessons');
  const [lessons, setLessons] = useState([]);
  const [assessmentsByLesson, setAssessmentsByLesson] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterHasAssessment, setFilterHasAssessment] = useState('all');
  const navigate = useNavigate();

  const fetchLessons = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedLessons = await getAllLessonPlans();
      setLessons(fetchedLessons);

      // Fetch assessments for each lesson
      const assessmentsMap = {};
      for (const lesson of fetchedLessons) {
        try {
          const response = await assessmentAPI.getAssessmentsByLessonPlan(lesson._id);
          assessmentsMap[lesson._id] = response.data || [];
        } catch (err) {
          console.error(`Error fetching assessments for lesson ${lesson._id}:`, err);
          assessmentsMap[lesson._id] = [];
        }
      }
      setAssessmentsByLesson(assessmentsMap);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch data only when the "My Lessons" tab is active
    if (activeTab === 'lessons') {
      fetchLessons();
    }
  }, [activeTab, fetchLessons]);

  // Get unique grades and subjects from lessons
  const getUniqueGrades = () => {
    const grades = [...new Set(lessons.map(lesson => lesson.parameters?.grade).filter(Boolean))];
    return grades.sort();
  };

  const getUniqueSubjects = () => {
    const subjects = [...new Set(lessons.map(lesson => lesson.classId?.subject).filter(Boolean))];
    return subjects.sort();
  };

  // Filter lessons based on search and filters
  const filterLessons = (lessons) => {
    return lessons.filter((lesson) => {
      // Search query filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery ||
        lesson.parameters?.specificTopic?.toLowerCase().includes(searchLower) ||
        lesson.plan?.learningObjective?.toLowerCase().includes(searchLower) ||
        lesson.classId?.className?.toLowerCase().includes(searchLower) ||
        lesson.communityData?.title?.toLowerCase().includes(searchLower) ||
        lesson.communityData?.description?.toLowerCase().includes(searchLower);

      // Grade filter
      const matchesGrade = filterGrade === 'all' || lesson.parameters?.grade === filterGrade;

      // Subject filter
      const matchesSubject = filterSubject === 'all' || lesson.classId?.subject === filterSubject;

      // Assessment filter
      const hasAssessment = assessmentsByLesson[lesson._id]?.length > 0;
      const matchesAssessment = filterHasAssessment === 'all' ||
        (filterHasAssessment === 'with' && hasAssessment) ||
        (filterHasAssessment === 'without' && !hasAssessment);

      return matchesSearch && matchesGrade && matchesSubject && matchesAssessment;
    });
  };

  // Group lessons by class
  const groupLessonsByClass = (lessons) => {
    const grouped = {};

    lessons.forEach((lesson) => {
      const className = lesson.classId?.className || 'Unassigned';
      if (!grouped[className]) {
        grouped[className] = {
          classInfo: lesson.classId,
          lessons: []
        };
      }
      grouped[className].lessons.push(lesson);
    });

    // Sort lessons within each class by date (most recent first)
    Object.keys(grouped).forEach((className) => {
      grouped[className].lessons.sort((a, b) => {
        const dateA = new Date(a.lessonDate || a.createdAt);
        const dateB = new Date(b.lessonDate || b.createdAt);
        return dateB - dateA;
      });
    });

    return grouped;
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setFilterGrade('all');
    setFilterSubject('all');
    setFilterHasAssessment('all');
  };

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (searchQuery) count++;
    if (filterGrade !== 'all') count++;
    if (filterSubject !== 'all') count++;
    if (filterHasAssessment !== 'all') count++;
    return count;
  };

  const renderAllLessons = () => {
    if (isLoading) return <div className={styles.statusMessage}>Loading your lessons...</div>;
    if (error) return <div className={styles.statusMessage_error}>{error}</div>;
    if (lessons.length === 0) {
      return (
        <div className={styles.statusMessage_empty}>
          <h3>No Lesson Plans Found</h3>
          <p>Create your first lesson plan from the Calendar tab!</p>
          <button className={styles.createButton} onClick={() => setActiveTab('calendar')}>Go to Calendar</button>
        </div>
      );
    }

    const filteredLessons = filterLessons(lessons);
    const groupedLessons = groupLessonsByClass(filteredLessons);
    const activeFilterCount = getActiveFilterCount();

    if (filteredLessons.length === 0) {
      return (
        <div className={styles.statusMessage_empty}>
          <h3>No Matching Lessons Found</h3>
          <p>Try adjusting your search or filters.</p>
          {activeFilterCount > 0 && (
            <button className={styles.createButton} onClick={clearFilters}>
              Clear All Filters
            </button>
          )}
        </div>
      );
    }

    return (
      <>
        {/* Search and Filter Bar */}
        <div className={styles.searchFilterBar}>
          <div className={styles.searchSection}>
            <Input
              placeholder="Search lessons by topic, objective, or class..."
              prefix={<SearchOutlined />}
              suffix={
                searchQuery && (
                  <CloseCircleOutlined
                    onClick={() => setSearchQuery('')}
                    style={{ cursor: 'pointer', color: '#999' }}
                  />
                )
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
              size="large"
            />
          </div>

          <div className={styles.filterSection}>
            <Select
              value={filterGrade}
              onChange={setFilterGrade}
              className={styles.filterSelect}
              placeholder="All Grades"
              size="large"
            >
              <Option value="all">All Grades</Option>
              {getUniqueGrades().map(grade => (
                <Option key={grade} value={grade}>{grade}</Option>
              ))}
            </Select>

            <Select
              value={filterSubject}
              onChange={setFilterSubject}
              className={styles.filterSelect}
              placeholder="All Subjects"
              size="large"
            >
              <Option value="all">All Subjects</Option>
              {getUniqueSubjects().map(subject => (
                <Option key={subject} value={subject}>{subject}</Option>
              ))}
            </Select>

            <Select
              value={filterHasAssessment}
              onChange={setFilterHasAssessment}
              className={styles.filterSelect}
              placeholder="Assessment Status"
              size="large"
            >
              <Option value="all">All Lessons</Option>
              <Option value="with">With Assessments</Option>
              <Option value="without">Without Assessments</Option>
            </Select>

            {activeFilterCount > 0 && (
              <Badge count={activeFilterCount} offset={[-5, 5]}>
                <Button
                  icon={<CloseCircleOutlined />}
                  onClick={clearFilters}
                  size="large"
                  className={styles.clearButton}
                >
                  Clear Filters
                </Button>
              </Badge>
            )}
          </div>
        </div>

        {/* Results count */}
        <div className={styles.resultsInfo}>
          Showing {filteredLessons.length} of {lessons.length} lesson{lessons.length !== 1 ? 's' : ''}
          {activeFilterCount > 0 && ` (${activeFilterCount} filter${activeFilterCount !== 1 ? 's' : ''} active)`}
        </div>

        {/* Grouped Lessons */}
        <div className={styles.lessonsContainer}>
          {Object.entries(groupedLessons).map(([className, { classInfo, lessons }]) => (
            <div key={className} className={styles.classGroup}>
              <div className={styles.classHeader}>
                <h2>{className}</h2>
                {classInfo && (
                  <div className={styles.classDetails}>
                    <span className={styles.classGrade}>{classInfo.grade}</span>
                    <span className={styles.classSubject}>{classInfo.subject}</span>
                    <span className={styles.lessonCount}>{lessons.length} lesson{lessons.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
              <div className={styles.lessonsGrid}>
                {lessons.map((lesson) => (
                  <LessonCard
                    key={lesson._id}
                    lesson={lesson}
                    assessments={assessmentsByLesson[lesson._id] || []}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };
  
  const tabs = [
    { id: 'lessons', label: 'My Lessons' },
    { id: 'calendar', label: 'Calendar' },
    { id: 'materials', label: 'Materials' },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.tabsContainer}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <main className={styles.tabContent}>
        {activeTab === 'lessons' && renderAllLessons()}
        {activeTab === 'calendar' && <CalendarView />}
        {activeTab === 'materials' && <MaterialManagement />}
      </main>
    </div>
  );
};

export default PlannerPage;