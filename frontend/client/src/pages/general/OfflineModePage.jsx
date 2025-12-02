/**
 * Offline Mode Page
 *
 * Central page for managing offline functionality
 * Shows downloaded content, pending actions, and storage management
 */

import React, { useState } from 'react';
import { Card, Tabs, Space, Typography, Alert } from 'antd';
import {
  Download,
  Database,
  RefreshCw,
  HardDrive,
  Activity
} from 'lucide-react';
import {
  StorageIndicator,
  OfflineContentManager,
  PendingActionsViewer,
  ConflictsManager,
  SyncProgress
} from '../../components/Offline';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import './OfflineModePage.css';

const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;

const OfflineModePage = () => {
  const { online, offline, quality } = useNetworkStatus();
  const [activeTab, setActiveTab] = useState('content');

  return (
    <div className="offline-mode-page">
      <div className="offline-mode-header">
        <Space direction="vertical" size="small">
          <Title level={2}>
            <Database size={28} style={{ marginRight: 12 }} />
            Offline Mode Manager
          </Title>
          <Paragraph type="secondary">
            Manage your offline content, view pending sync actions, and monitor storage usage
          </Paragraph>
        </Space>

        <StorageIndicator showDetails={true} />
      </div>

      {offline && (
        <Alert
          type="warning"
          message="You are currently offline"
          description="Some features are limited while offline. Your changes will sync automatically when you reconnect."
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {online && quality === 'poor' && (
        <Alert
          type="info"
          message="Slow connection detected"
          description="Consider downloading content for offline use to improve your experience."
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        size="large"
        type="card"
      >
        <TabPane
          tab={
            <span>
              <Download size={16} style={{ marginRight: 8 }} />
              Downloaded Content
            </span>
          }
          key="content"
        >
          <OfflineContentManager />
        </TabPane>

        <TabPane
          tab={
            <span>
              <RefreshCw size={16} style={{ marginRight: 8 }} />
              Pending Actions
            </span>
          }
          key="pending"
        >
          <PendingActionsViewer showStats={true} />
        </TabPane>

        <TabPane
          tab={
            <span>
              <Activity size={16} style={{ marginRight: 8 }} />
              Sync Status
            </span>
          }
          key="sync"
        >
          <SyncProgress showHistory={true} />
        </TabPane>

        <TabPane
          tab={
            <span>
              <RefreshCw size={16} style={{ marginRight: 8 }} />
              Conflicts
            </span>
          }
          key="conflicts"
        >
          <ConflictsManager />
        </TabPane>

        <TabPane
          tab={
            <span>
              <HardDrive size={16} style={{ marginRight: 8 }} />
              Storage Management
            </span>
          }
          key="storage"
        >
          <Card>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Title level={4}>Storage Usage</Title>
                <Paragraph type="secondary">
                  Monitor and manage your local storage usage. Downloaded content is stored on your device for offline access.
                </Paragraph>
                <StorageIndicator showDetails={true} compact={false} />
              </div>

              <div>
                <Title level={4}>What's Stored Offline?</Title>
                <ul>
                  <li>Downloaded lesson plans and related content</li>
                  <li>Downloaded assessments and rubrics</li>
                  <li>Class and student information</li>
                  <li>Pending actions waiting to sync</li>
                  <li>Download metadata and timestamps</li>
                </ul>
              </div>

              <Alert
                type="info"
                message="Storage Tips"
                description={
                  <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                    <li>Request persistent storage to prevent data loss</li>
                    <li>Regularly clear old completed sync actions</li>
                    <li>Remove downloaded content you no longer need</li>
                    <li>Monitor storage usage to avoid quota issues</li>
                  </ul>
                }
              />
            </Space>
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <Activity size={16} style={{ marginRight: 8 }} />
              Offline Guide
            </span>
          }
          key="guide"
        >
          <Card>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Title level={4}>How Offline Mode Works</Title>
                <Paragraph>
                  The AI Lesson Planning System supports offline functionality, allowing you to continue
                  working even without an internet connection.
                </Paragraph>
              </div>

              <div>
                <Title level={5}>What You Can Do Offline</Title>
                <ul>
                  <li><strong>View Content:</strong> Access downloaded lesson plans, assessments, and rubrics</li>
                  <li><strong>Edit Content:</strong> Make changes to existing lesson plans and assessments</li>
                  <li><strong>Browse:</strong> View class and student information</li>
                  <li><strong>Export:</strong> Generate PDF exports of your content</li>
                  <li><strong>Bookmark:</strong> Add or remove bookmarks (syncs later)</li>
                  <li><strong>Search:</strong> Search through downloaded content</li>
                </ul>
              </div>

              <div>
                <Title level={5}>What Requires Internet Connection</Title>
                <ul>
                  <li><strong>AI Generation:</strong> Creating new lesson plans or assessments</li>
                  <li><strong>AI Enhancement:</strong> Using AI to improve content</li>
                  <li><strong>OCR Processing:</strong> Grading student answer sheets</li>
                  <li><strong>Community Features:</strong> Sharing or downloading community content</li>
                  <li><strong>Real-time Sync:</strong> Immediate synchronization of changes</li>
                </ul>
              </div>

              <div>
                <Title level={5}>Automatic Synchronization</Title>
                <Paragraph>
                  When you're offline, all your actions are queued locally:
                </Paragraph>
                <ol>
                  <li>Changes are saved to your device immediately</li>
                  <li>Actions are added to the sync queue</li>
                  <li>When you reconnect, the app detects the connection</li>
                  <li>Pending actions are synchronized automatically</li>
                  <li>You'll see a notification when sync completes</li>
                </ol>
              </div>

              <div>
                <Title level={5}>Download for Offline Use</Title>
                <Paragraph>
                  To make content available offline:
                </Paragraph>
                <ol>
                  <li>Navigate to any lesson plan or assessment</li>
                  <li>Click the "Download for Offline" button</li>
                  <li>Wait for the download to complete</li>
                  <li>Content is now accessible offline</li>
                </ol>
                <Paragraph type="secondary">
                  You can also download complete lesson packages including all assessments, class info, and students.
                </Paragraph>
              </div>

              <Alert
                type="success"
                message="Tip: Download Before You Go"
                description="If you know you'll be working offline (e.g., during travel or in areas with poor connectivity), download the content you need beforehand."
              />
            </Space>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default OfflineModePage;
