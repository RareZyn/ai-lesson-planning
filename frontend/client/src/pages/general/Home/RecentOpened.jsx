import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Functions,        // Math
  Language,        // English
  Science,         // Science
  Translate,       // Bahasa
  History,         // Sejarah
  CalendarToday,   // Calendar
  Description,     // Document
  Assessment,      // Spreadsheet
  Image,           // Image
  Notes            // Note
} from '@mui/icons-material';
import './RecentOpened.css';

const RecentOpened = () => {
    const navigate = useNavigate();

    const recentItems = [
        {
            id: 1,
            title: 'Mathematics',
            type: '5 Ibn Sina',
            lastOpened: '2 hours ago',
            icon: <Functions fontSize="large" />
        },
        {
            id: 2,
            title: 'English',
            type: '4 Albiruni',
            lastOpened: 'Yesterday',
            icon: <Language fontSize="large" />
        },
        {
            id: 3,
            title: 'Science',
            type: '3 Al-Khwarizmi',
            lastOpened: '3 days ago',
            icon: <Science fontSize="large" />
        },
        {
            id: 4,
            title: 'Bahasa Melayu',
            type: '6 Tun Fatimah',
            lastOpened: '1 week ago',
            icon: <Translate fontSize="large" />
        },
        {
            id: 5,
            title: 'Sejarah',
            type: '2 Hang Tuah',
            lastOpened: '2 weeks ago',
            icon: <History fontSize="large" />
        }
    ];

    return (
        <div className="recent-opened-container">
            <div className="section-header">
                <h2 className="section-title">Recently Opened</h2>
                <button 
                    className="view-all-button"
                    onClick={() => navigate('/app/lessons')}
                >
                    View All 
                    <ChevronRight className="chevron-icon" />
                </button>
            </div>
            <div className="recent-opened-grid">
                {recentItems.map((item) => (
                    <div key={item.id} className="recent-card">
                        <div className="card-icon">{item.icon}</div>
                        <div className="card-content">
                            <h3 className="card-title">{item.title}</h3>
                            <p className="card-subtitle">{item.type}</p>
                            <p className="card-meta">Opened {item.lastOpened}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecentOpened;