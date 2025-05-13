import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import './DisplayLesson.css';

const DisplayLesson = ({ lesson }) => {
    const [showParameters, setShowParameters] = useState(false);
    const contentRef = useRef(null);
    const navigate = useNavigate();

    const sampleLesson = {
        title: 'Introduction to Algebra',
        date: '2023-06-15',
        className: 'Mathematics 101',
        parameters: {
            gradeLevel: '8th Grade',
            duration: '45 minutes',
            objectives: ['Understand basic algebraic concepts', 'Solve simple equations'],
            standards: 'CCSS.MATH.CONTENT.8.EE.C.7'
        },
        content: {
            preLesson: 'Review basic arithmetic operations. Introduce variables concept.',
            duringLesson: 'Demonstrate solving for x in simple equations. Group practice problems.',
            postLesson: 'Assign homework problems. Preview next lesson on inequalities.'
        }
    };

    const currentLesson = lesson || sampleLesson;

    return (
        <div className="lesson-container">

            {/* Back Button */}
            <button className="back-button" onClick={() => navigate(-1)}>
                <ArrowBackIcon className="back-icon" />
                <span>Back</span>
            </button>

            {/* Header */}
            <div className="lesson-header">
                <h1 className="lesson-title">{currentLesson.title}</h1>
                <div className="lesson-meta">
                    <span className="lesson-date">{currentLesson.date}</span>
                    <span className="lesson-class">{currentLesson.className}</span>
                </div>
            </div>

            {/* Parameters Section */}
            <div className="parameters-section">
                <div className="parameters-header">
                    <h3>Lesson Parameters</h3>
                </div>

                <div
                    className={`parameters-content-wrapper ${showParameters ? 'open' : ''}`}
                    style={{
                        maxHeight: showParameters ? `${contentRef.current?.scrollHeight}px` : '0px'
                    }}
                >
                    <div className="parameters-content" ref={contentRef}>
                        <ul className="parameters-list">
                            {Object.entries(currentLesson.parameters).map(([key, value]) => (
                                <li key={key}>
                                    <strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong>
                                    {Array.isArray(value) ? (
                                        <ul>
                                            {value.map((item, i) => <li key={i}>{item}</li>)}
                                        </ul>
                                    ) : (
                                        ` ${value}`
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div
                    className="parameters-toggle"
                    onClick={() => setShowParameters(!showParameters)}
                >
                    <ArrowDropDownIcon className={`dropdown-icon ${showParameters ? 'open' : ''}`} />
                </div>
            </div>

            {/* Content Sections */}
            <div className="lesson-content">
                {['preLesson', 'duringLesson', 'postLesson'].map(phase => (
                    <div className="lesson-phase" key={phase}>
                        <h2>{phase.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h2>
                        <div className="phase-content">
                            {currentLesson.content[phase]}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DisplayLesson;
