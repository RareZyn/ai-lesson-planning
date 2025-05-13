import React from 'react';
import './RecentOpened.css'; // We'll create this CSS file next

const RecentOpened = () => {
    // Sample data for recently opened items
    /*
    TODO:
    - Change this to fetch from the backend
    - Change the styling
    - Add a loading state while fetching data
    */
    const recentItems = [
        {
            id: 1,
            title: 'Project Proposal.docx',
            type: 'document',
            lastOpened: '2 hours ago',
            icon: '📄'
        },
        {
            id: 2,
            title: 'Budget Spreadsheet.xlsx',
            type: 'spreadsheet',
            lastOpened: 'Yesterday',
            icon: '📊'
        },
        {
            id: 3,
            title: 'Team Meeting Notes',
            type: 'note',
            lastOpened: '3 days ago',
            icon: '📝'
        },
        {
            id: 4,
            title: 'Product Design',
            type: 'image',
            lastOpened: '1 week ago',
            icon: '🖼️'
        },
        {
            id: 5,
            title: 'Presentation Deck.pptx',
            type: 'presentation',
            lastOpened: '2 weeks ago',
            icon: '📑'
        }
    ];

    return (
        <div className="recent-opened-container">
            <h2 className="recent-opened-title">Recently Opened</h2>
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