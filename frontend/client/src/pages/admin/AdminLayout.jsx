// AdminLayout.jsx
import React, { useState } from 'react';
import './AdminLayout.css';
import SyllabusManagement from './SyllabusManagement';
import LessonApproval from './LessonApproval';
import TeacherManagement from './TeacherManagement';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons'; // Example icon, adjust as needed

const AdminLayout = () => {
    const [activeTab, setActiveTab] = useState('syllabus'); // Default active tab
    const [searchTerm, setSearchTerm] = useState('');

    const renderContent = () => {
        switch (activeTab) {
            case 'syllabus':
                return <SyllabusManagement searchTerm={searchTerm} />;
            case 'approval':
                return <LessonApproval searchTerm={searchTerm} />;
            case 'teachers':
                return <TeacherManagement searchTerm={searchTerm} />;
            default:
                return <SyllabusManagement searchTerm={searchTerm} />;
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
                        Syllabus Management
                    </button>
                    <button
                        className={`tabButton ${activeTab === 'approval' ? 'active' : ''}`}
                        onClick={() => setActiveTab('approval')}
                    >
                        Lesson Approval
                    </button>
                    <button
                        className={`tabButton ${activeTab === 'teachers' ? 'active' : ''}`}
                        onClick={() => setActiveTab('teachers')}
                    >
                        Teacher Management
                    </button>
                </div>
            </div>

            <div className="controlBarWrapper">
                <div className="searchFilterGroup">
                    <div className="customSearchBar">
                        <FontAwesomeIcon icon={faSearch} className="searchIcon" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="searchInput"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {/* You can add more filters here, like a customSelect */}
                    {/* <select className="customSelect">
                        <option>All Subjects</option>
                        <option>Mathematics</option>
                        <option>Science</option>
                    </select> */}
                </div>
                {/* Potentially add a "Create New" button or other admin actions here */}
                {/* <button className="createLessonButton">Create New</button> */}
            </div>

            <div className="tabContent">
                {renderContent()}
            </div>
        </div>
    );
};

export default AdminLayout;