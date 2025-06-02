import React from 'react';
import { useNavigate } from 'react-router-dom';
import ChevronRight from '@mui/icons-material/ChevronRight';
import './MyClass.css';

const MyClass = () => {
    const navigate = useNavigate();

    const recentClasses = [
        {
            id: 1,
            subject: '4 Albiruni',
            class: 'English',
            time: '9:00 AM - 10:00 AM',
        },
        {
            id: 2,
            subject: '5 Ibn Sina',
            class: 'Mathematics',
            time: '10:00 AM - 11:00 AM',
        },
        {
            id: 3,
            subject: '3 Al-Khwarizmi',
            class: 'Science',
            time: '11:00 AM - 12:00 PM',
        },
        {
            id: 4,
            subject: '6 Tun Fatimah',
            class: 'Bahasa Melayu',
            time: '1:00 PM - 2:00 PM',
        },
        {
            id: 5,
            subject: '2 Hang Tuah',
            class: 'Sejarah',
            time: '2:00 PM - 3:00 PM',
        },
    ];


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