import React from 'react';
import { useNavigate } from 'react-router-dom';
import ChevronRight from '@mui/icons-material/ChevronRight';
import './MyClass.css';

const MyClass = () => {
    const navigate = useNavigate();

    return (
        <div className="my-class-container">
            <div className="section-header">
                <h2 className="section-title">My Recent Classes</h2>
                <button
                    className="view-all-button"
                    onClick={() => navigate('/all-classes')}
                >
                    View All <ChevronRight />
                </button>
            </div>

            <div className="classes-grid">
                {recentClasses.map((classItem) => (
                    <div key={classItem.id} className="class-card">
                        <div className="class-header">
                            <h3 className="class-subject">{classItem.subject}</h3>
                        </div>
                        <div className="class-details">
                            <p><strong>Subject:</strong> {classItem.class}</p>
                            <p><strong>Time:</strong> {classItem.time}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MyClass;