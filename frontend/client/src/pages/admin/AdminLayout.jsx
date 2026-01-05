// AdminLayout.jsx
import React, { useState } from 'react';
import { BookOutlined, CheckCircleOutlined, TeamOutlined } from '@ant-design/icons';
import './AdminLayout.css';
import SyllabusManagement from './SyllabusManagement';
import LessonApproval from './LessonApproval';
import TeacherManagement from './TeacherManagement';

const AdminLayout = () => {
    const [activeTab, setActiveTab] = useState('syllabus'); // Default active tab

    const renderContent = () => {
        switch (activeTab) {
            case 'syllabus':
                return <SyllabusManagement />;
            case 'approval':
                return <LessonApproval />;
            case 'teachers':
                return <TeacherManagement />;
            default:
                return <SyllabusManagement />;
        }
    };

    return (
        <div className="adminLayoutContainer">
            <div className="header">
                <div className="tabsContainer">
                    <button
                        className={`tabButton ${activeTab === 'syllabus' ? 'active' : ''}`}
                        onClick={() => setActiveTab('syllabus')}
                    >
                        <BookOutlined style={{ fontSize: '1.1rem' }} />
                        Syllabus Management
                    </button>
                    <button
                        className={`tabButton ${activeTab === 'approval' ? 'active' : ''}`}
                        onClick={() => setActiveTab('approval')}
                    >
                        <CheckCircleOutlined style={{ fontSize: '1.1rem' }} />
                        Lesson Approval
                    </button>
                    <button
                        className={`tabButton ${activeTab === 'teachers' ? 'active' : ''}`}
                        onClick={() => setActiveTab('teachers')}
                    >
                        <TeamOutlined style={{ fontSize: '1.1rem' }} />
                        Teacher Management
                    </button>
                </div>
            </div>



            <div className="tabContent">
                {renderContent()}
            </div>
        </div>
    );
};

export default AdminLayout;