/**
 * Offline Content Manager Component
 * Allows users to download, view, and manage offline content
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  List,
  Button,
  Space,
  Tag,
  Typography,
  Modal,
  Progress,
  message,
  Tabs,
  Empty,
  Popconfirm,
  Input,
  Select
} from 'antd';
import {
  DownloadOutlined,
  DeleteOutlined,
  FileTextOutlined,
  BookOutlined,
  TeamOutlined,
  UserOutlined,
  SearchOutlined,
  SyncOutlined,
  CloudDownloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import offlineStorageManager from '../../services/offline/offlineStorageManager';
import * as lessonService from '../../services/offline/lessonOfflineService';
import * as assessmentService from '../../services/offline/assessmentOfflineService';
import * as classService from '../../services/offline/classOfflineService';
import * as studentService from '../../services/offline/studentOfflineService';
import { getStorageStats } from '../../services/offline/offlineStorageManager';

dayjs.extend(relativeTime);

const { Text, Title } = Typography;
const { TabPane } = Tabs;
const { Search } = Input;

const OfflineContentManager = () => {
  const [lessons, setLessons] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('lessons');

  useEffect(() => {
    loadOfflineContent();
    loadStats();
  }, []);

  const loadOfflineContent = async () => {
    setLoading(true);
    try {
      const [lessonsData, assessmentsData, classesData, studentsData] = await Promise.all([
        lessonService.getAllLessonsOffline(),
        assessmentService.getAllAssessmentsOffline(),
        classService.getAllClassesOffline(),
        studentService.getAllStudentsOffline()
      ]);

      setLessons(lessonsData || []);
      setAssessments(assessmentsData || []);
      setClasses(classesData || []);
      setStudents(studentsData || []);
    } catch (error) {
      console.error('Error loading offline content:', error);
      message.error('Failed to load offline content');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const storageStats = await getStorageStats();
      setStats(storageStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    try {
      await offlineStorageManager.removeOfflineContent('lesson', lessonId);
      message.success('Lesson removed from offline storage');
      loadOfflineContent();
      loadStats();
    } catch (error) {
      console.error('Error deleting lesson:', error);
      message.error('Failed to remove lesson');
    }
  };

  const handleDeleteAssessment = async (assessmentId) => {
    try {
      await offlineStorageManager.removeOfflineContent('assessment', assessmentId);
      message.success('Assessment removed from offline storage');
      loadOfflineContent();
      loadStats();
    } catch (error) {
      console.error('Error deleting assessment:', error);
      message.error('Failed to remove assessment');
    }
  };

  const handleDeleteClass = async (classId) => {
    try {
      await offlineStorageManager.removeOfflineContent('class', classId);
      message.success('Class removed from offline storage');
      loadOfflineContent();
      loadStats();
    } catch (error) {
      console.error('Error deleting class:', error);
      message.error('Failed to remove class');
    }
  };

  const filterContent = (content, searchFields) => {
    if (!searchTerm) return content;

    const lowerSearch = searchTerm.toLowerCase();
    return content.filter((item) =>
      searchFields.some((field) => {
        const value = field.split('.').reduce((obj, key) => obj?.[key], item);
        return value?.toString().toLowerCase().includes(lowerSearch);
      })
    );
  };

  const renderLessonList = () => {
    const filteredLessons = filterContent(lessons, [
      'specificTopic',
      'learningObjective',
      'grade'
    ]);

    return (
      <List
        dataSource={filteredLessons}
        loading={loading}
        locale={{ emptyText: <Empty description="No offline lessons" /> }}
        renderItem={(lesson) => (
          <List.Item
            actions={[
              <Popconfirm
                title="Remove this lesson from offline storage?"
                onConfirm={() => handleDeleteLesson(lesson._id)}
                okText="Yes"
                cancelText="No"
              >
                <Button type="text" danger icon={<DeleteOutlined />} size="small">
                  Remove
                </Button>
              </Popconfirm>
            ]}
          >
            <List.Item.Meta
              avatar={<FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
              title={
                <Space>
                  <span>{lesson.specificTopic || 'Untitled Lesson'}</span>
                  <Tag color="blue">{lesson.grade}</Tag>
                </Space>
              }
              description={
                <Space direction="vertical" size="small">
                  <Text type="secondary" ellipsis>
                    {lesson.learningObjective}
                  </Text>
                  <Space size="small">
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Downloaded: {dayjs(lesson.downloadedAt).fromNow()}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Date: {dayjs(lesson.lessonDate).format('MMM D, YYYY')}
                    </Text>
                  </Space>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    );
  };

  const renderAssessmentList = () => {
    const filteredAssessments = filterContent(assessments, ['title', 'description', 'activityType']);

    return (
      <List
        dataSource={filteredAssessments}
        loading={loading}
        locale={{ emptyText: <Empty description="No offline assessments" /> }}
        renderItem={(assessment) => (
          <List.Item
            actions={[
              <Popconfirm
                title="Remove this assessment from offline storage?"
                onConfirm={() => handleDeleteAssessment(assessment._id)}
                okText="Yes"
                cancelText="No"
              >
                <Button type="text" danger icon={<DeleteOutlined />} size="small">
                  Remove
                </Button>
              </Popconfirm>
            ]}
          >
            <List.Item.Meta
              avatar={<BookOutlined style={{ fontSize: 24, color: '#52c41a' }} />}
              title={
                <Space>
                  <span>{assessment.title || 'Untitled Assessment'}</span>
                  <Tag color="green">{assessment.assessmentType}</Tag>
                </Space>
              }
              description={
                <Space direction="vertical" size="small">
                  <Text type="secondary" ellipsis>
                    {assessment.description}
                  </Text>
                  <Space size="small">
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Downloaded: {dayjs(assessment.downloadedAt).fromNow()}
                    </Text>
                    {assessment.questionCount && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Questions: {assessment.questionCount}
                      </Text>
                    )}
                  </Space>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    );
  };

  const renderClassList = () => {
    const filteredClasses = filterContent(classes, ['className', 'grade', 'subject']);

    return (
      <List
        dataSource={filteredClasses}
        loading={loading}
        locale={{ emptyText: <Empty description="No offline classes" /> }}
        renderItem={(classData) => (
          <List.Item
            actions={[
              <Popconfirm
                title="Remove this class from offline storage?"
                onConfirm={() => handleDeleteClass(classData._id)}
                okText="Yes"
                cancelText="No"
              >
                <Button type="text" danger icon={<DeleteOutlined />} size="small">
                  Remove
                </Button>
              </Popconfirm>
            ]}
          >
            <List.Item.Meta
              avatar={<TeamOutlined style={{ fontSize: 24, color: '#fa8c16' }} />}
              title={
                <Space>
                  <span>{classData.className}</span>
                  <Tag color="orange">{classData.grade}</Tag>
                  <Tag color="cyan">{classData.subject}</Tag>
                </Space>
              }
              description={
                <Space size="small">
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Students: {classData.students?.length || 0}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Downloaded: {dayjs(classData.downloadedAt).fromNow()}
                  </Text>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    );
  };

  const renderStudentList = () => {
    const filteredStudents = filterContent(students, ['name', 'studentId', 'email']);

    return (
      <List
        dataSource={filteredStudents}
        loading={loading}
        locale={{ emptyText: <Empty description="No offline students" /> }}
        renderItem={(student) => (
          <List.Item>
            <List.Item.Meta
              avatar={<UserOutlined style={{ fontSize: 24, color: '#722ed1' }} />}
              title={
                <Space>
                  <span>{student.name}</span>
                  <Tag>{student.studentId}</Tag>
                </Space>
              }
              description={
                <Space size="small">
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {student.email}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Grade: {student.grade}
                  </Text>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    );
  };

  return (
    <div>
      {/* Statistics Card */}
      {stats && (
        <Card style={{ marginBottom: 16 }}>
          <Space size="large" wrap>
            <div>
              <Text type="secondary">Total Items</Text>
              <br />
              <Title level={3} style={{ margin: 0 }}>
                {stats.total}
              </Title>
            </div>
            <div>
              <Text type="secondary">Lessons</Text>
              <br />
              <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
                {stats.lessons}
              </Title>
            </div>
            <div>
              <Text type="secondary">Assessments</Text>
              <br />
              <Title level={3} style={{ margin: 0, color: '#52c41a' }}>
                {stats.assessments}
              </Title>
            </div>
            <div>
              <Text type="secondary">Classes</Text>
              <br />
              <Title level={3} style={{ margin: 0, color: '#fa8c16' }}>
                {stats.classes}
              </Title>
            </div>
            <div>
              <Text type="secondary">Students</Text>
              <br />
              <Title level={3} style={{ margin: 0, color: '#722ed1' }}>
                {stats.students}
              </Title>
            </div>
            <div>
              <Text type="secondary">Storage Used</Text>
              <br />
              <Title level={3} style={{ margin: 0 }}>
                {stats.estimatedSize.mb} MB
              </Title>
            </div>
          </Space>
        </Card>
      )}

      {/* Search Bar */}
      <Card style={{ marginBottom: 16 }}>
        <Search
          placeholder={`Search ${activeTab}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%' }}
          prefix={<SearchOutlined />}
          allowClear
        />
      </Card>

      {/* Content Tabs */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane
            tab={
              <span>
                <FileTextOutlined />
                Lessons ({lessons.length})
              </span>
            }
            key="lessons"
          >
            {renderLessonList()}
          </TabPane>
          <TabPane
            tab={
              <span>
                <BookOutlined />
                Assessments ({assessments.length})
              </span>
            }
            key="assessments"
          >
            {renderAssessmentList()}
          </TabPane>
          <TabPane
            tab={
              <span>
                <TeamOutlined />
                Classes ({classes.length})
              </span>
            }
            key="classes"
          >
            {renderClassList()}
          </TabPane>
          <TabPane
            tab={
              <span>
                <UserOutlined />
                Students ({students.length})
              </span>
            }
            key="students"
          >
            {renderStudentList()}
          </TabPane>
        </Tabs>
      </Card>

      {/* Download Progress Modal */}
      {downloadProgress && (
        <Modal
          visible={true}
          closable={false}
          footer={null}
          title="Downloading Content"
        >
          <Progress percent={downloadProgress.percent} />
          <Text>{downloadProgress.message}</Text>
        </Modal>
      )}
    </div>
  );
};

export default OfflineContentManager;
