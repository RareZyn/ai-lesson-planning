// SyllabusManagement.jsx
import React, { useState } from 'react';
import './SyllabusManagement.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faBook, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';

const SyllabusManagement = ({ searchTerm }) => {
    // Dummy data for syllabuses
    const [syllabuses, setSyllabuses] = useState([
        { id: 's1', title: 'Mathematics Grade 10', subject: 'Mathematics', createdBy: 'Admin', date: '2023-01-15' },
        { id: 's2', title: 'Science Form 4 Chemistry', subject: 'Science', createdBy: 'Admin', date: '2023-02-20' },
        { id: 's3', title: 'History SPM Modern Era', subject: 'History', createdBy: 'Admin', date: '2023-03-10' },
        { id: 's4', title: 'English Year 5 Grammar', subject: 'English', createdBy: 'Admin', date: '2023-04-05' },
    ]);

    const filteredSyllabuses = syllabuses.filter(syllabus =>
        syllabus.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        syllabus.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCreateSyllabus = () => {
        alert('Open modal to create new syllabus');
        // Implement modal or form for creating a new syllabus
    };

    const handleEditSyllabus = (id) => {
        alert(`Edit syllabus with ID: ${id}`);
        // Implement modal or form for editing a syllabus
    };

    const handleDeleteSyllabus = (id) => {
        if (window.confirm(`Are you sure you want to delete syllabus ${id}?`)) {
            setSyllabuses(syllabuses.filter(syllabus => syllabus.id !== id));
        }
    };

    return (
        <div className="syllabusManagement">
            <div className="syllabusHeader">
                <h2>Syllabus List</h2>
                <button className="createButton" onClick={handleCreateSyllabus}>
                    <FontAwesomeIcon icon={faPlus} /> Create Syllabus
                </button>
            </div>

            {filteredSyllabuses.length === 0 ? (
                <p>No syllabuses found matching your search.</p>
            ) : (
                <div className="listContainer">
                    <div className="listHeader listItem">
                        <div className="listTitle">Title</div>
                        <div className="listDetail">Subject</div>
                        <div className="listDetail">Created By</div>
                        <div className="listDetail">Date Created</div>
                        <div className="listActions">Actions</div>
                    </div>
                    <div className="syllabusList">
                        {filteredSyllabuses.map(syllabus => (
                            <div key={syllabus.id} className="listItem">
                                <div className="listTitle">
                                    <FontAwesomeIcon icon={faBook} className="listIcon" /> {syllabus.title}
                                </div>
                                <div className="listDetail">{syllabus.subject}</div>
                                <div className="listDetail">{syllabus.createdBy}</div>
                                <div className="listDetail">{syllabus.date}</div>
                                <div className="listActions">
                                    <button onClick={() => handleEditSyllabus(syllabus.id)} className="actionButton edit">
                                        <FontAwesomeIcon icon={faEdit} />
                                    </button>
                                    <button onClick={() => handleDeleteSyllabus(syllabus.id)} className="actionButton delete">
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SyllabusManagement;