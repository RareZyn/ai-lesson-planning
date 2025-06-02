import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import './DisplayLesson.css';

const DisplayLesson = ({ lesson }) => {
    const [showParameters, setShowParameters] = useState(false);
    const contentRef = useRef(null);
    const navigate = useNavigate();

    // const sampleLesson = {
    //     title: "Algebraic Expressions",
    //     date: "2023-06-15",
    //     className: "5 Albiruni",
    //     parameters: {
    //         gradeLevel: "Form 2",
    //         duration: "1 hour",
    //         curriculum: "KSSM (Kurikulum Standard Sekolah Menengah)",
    //         learningStandards: [
    //             "3.1.1: Understand and use algebraic terms.",
    //             "3.2.1: Simplify algebraic expressions with one variable.",
    //             "3.3.1: Solve linear equations in one variable."
    //         ],
    //         objectives: [
    //             "Identify variables, coefficients, and constants in algebraic expressions.",
    //             "Simplify expressions like 3x + 2x = 5x.",
    //             "Solve linear equations (e.g., 2x + 3 = 7)."
    //         ],
    //         materials: [
    //             "Whiteboard/markers",
    //             "KSSM Mathematics Textbook (Form 2)",
    //             "Worksheet with practice problems"
    //         ]
    //     },
    //     content: {
    //         preLesson: {
    //             description: "Activate prior knowledge and introduce key terms.",
    //             activities: [
    //                 "Quick quiz: Solve 5 + 3 × 2 (recall BODMAS rule).",
    //                 "Define: Variable (e.g., x), Coefficient (e.g., 3 in 3x), Constant (e.g., +5).",
    //                 "Real-world example: 'If 1 nasi lemak costs RMx, how much for 3?' → 3x."
    //             ],
    //             teacherActions: [
    //                 "Write examples on the board.",
    //                 "Call students to identify parts of 4y - 7 (coefficient: 4, variable: y, constant: -7)."
    //             ]
    //         },
    //         duringLesson: {
    //             part1: {
    //                 title: "Simplifying Expressions",
    //                 examples: [
    //                     "3x + 2x = 5x (combine like terms)",
    //                     "4y - y + 7 = 3y + 7"
    //                 ],
    //                 activity: {
    //                     description: "Pair work: Simplify these on mini-whiteboards:",
    //                     problems: ["6a + 2a - 4", "5b - 2b + 8"],
    //                     expectedAnswers: ["8a - 4", "3b + 8"]
    //                 }
    //             },
    //             part2: {
    //                 title: "Solving Linear Equations",
    //                 steps: [
    //                     "Example: 2x + 3 = 7",
    //                     "Step 1: Subtract 3 → 2x = 4",
    //                     "Step 2: Divide by 2 → x = 2"
    //                 ],
    //                 activity: {
    //                     description: "Guided practice (teacher solves first, then students try):",
    //                     problems: ["3x - 5 = 4", "x/2 + 1 = 3"],
    //                     scaffolding: "Hint for x/2: 'How do we undo division?'"
    //                 }
    //             }
    //         },
    //         postLesson: {
    //             summary: "Recap key takeaways:",
    //             points: [
    //                 "Like terms have the same variable (e.g., 2x and 5x).",
    //                 "To solve equations, isolate x using inverse operations."
    //             ],
    //             assessment: [
    //                 "Exit ticket: Solve 4x + 1 = 9 (answer: x = 2).",
    //                 "Homework: Textbook Exercise 3.1, problems 1–5."
    //             ],
    //             nextLessonPreview: "Tomorrow: Expanding expressions like 2(x + 3)."
    //         }
    //     }
    // };

    const sampleLesson = {
        title: "Poetry for Pleasure: Nature's Beauty",
        date: "2023-08-20",
        className: "English Form 3 (KSSM)",
        parameters: {
            gradeLevel: "Form 3",
            duration: "60 minutes",
            curriculum: "KSSM English Literature",
            learningStandards: [
                "5.1.1: Respond imaginatively to literary texts.",
                "5.2.1: Analyse stylistic devices in poems.",
                "5.3.1: Express personal responses to themes."
            ],
            objectives: [
                "Identify poetic devices (metaphor, simile, personification).",
                "Analyze the poem 'Daffodils' by William Wordsworth.",
                "Create original nature-themed couplets."
            ],
            materials: [
                "Anthology of Poems",
                "Audio recording of 'Daffodils'",
                "Projector for imagery",
                "Worksheet with guided questions"
            ],
            poems: [
                {
                    title: "Daffodils",
                    author: "William Wordsworth",
                    excerpt: "I wandered lonely as a cloud... A host, of golden daffodils"
                },
                {
                    title: "The Rainbow",
                    author: "Christina Rossetti",
                    excerpt: "Boats sail on the rivers... Bridges build the skies"
                }
            ]
        },
        content: {
            preLesson: {
                description: "Activate prior knowledge about nature poetry.",
                activities: [
                    "Mind-map: What comes to mind when you think 'nature'?",
                    "Listening activity: Play sounds of nature (waves, birds).",
                    "Show images of famous landscapes (e.g., Cameron Highlands)."
                ],
                teacherActions: [
                    "Distribute poem anthologies to groups.",
                    "Introduce the Romantic poetry movement briefly."
                ]
            },
            duringLesson: {
                part1: {
                    title: "Analyzing 'Daffodils'",
                    focus: [
                        "Stanza 1: Simile ('lonely as a cloud')",
                        "Stanza 2: Personification ('daffodils dancing')",
                        "Theme: Nature's impact on human emotions"
                    ],
                    activity: {
                        description: "Group analysis with guided questions:",
                        questions: [
                            "Why does the poet compare himself to a cloud?",
                            "How does the poem make you feel about nature?"
                        ],
                        scaffolding: "Hint: Think about how you feel when seeing something beautiful"
                    }
                },
                part2: {
                    title: "Creative Writing",
                    steps: [
                        "1. Brainstorm nature elements (trees, rivers, etc.)",
                        "2. Create similes/metaphors for 2 elements",
                        "3. Compose a 4-line stanza in pairs"
                    ],
                    examples: [
                        "Example: The river sings like a choir (personification)",
                        "The mountains are sleeping giants (metaphor)"
                    ]
                }
            },
            postLesson: {
                summary: "Key takeaways from today:",
                points: [
                    "Poets use figurative language to express emotions.",
                    "Nature can be a powerful inspiration for art."
                ],
                assessment: [
                    "Exit ticket: Write one simile about Malaysian nature.",
                    "Homework: Annotate the second stanza of 'Daffodils'."
                ],
                nextLessonPreview: "Next week: Analyzing 'The Rainbow' - color symbolism."
            }
        }
    };


    const currentLesson = lesson  || sampleLesson;

    const renderContent = (content) => {
        if (typeof content === 'string') {
            return <p>{content}</p>;
        } else if (Array.isArray(content)) {
            return (
                <ul>
                    {content.map((item, index) => (
                        <li key={index}>{item}</li>
                    ))}
                </ul>
            );
        } else if (typeof content === 'object' && content !== null) {
            return (
                <div className="nested-content">
                    {Object.entries(content).map(([key, value]) => (
                        <div key={key} className="content-section">
                            <h4>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h4>
                            {renderContent(value)}
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    const renderDuringLesson = (duringLesson) => {
        return (
            <div className="during-lesson-container">
                {Object.entries(duringLesson).map(([partKey, partValue]) => (
                    <div key={partKey} className="lesson-part">
                        <h3>{partValue.title}</h3>
                        {partValue.examples && (
                            <div className="examples">
                                <h4>Examples:</h4>
                                <ul>
                                    {partValue.examples.map((example, idx) => (
                                        <li key={idx}>{example}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {partValue.steps && (
                            <div className="steps">
                                <h4>Steps:</h4>
                                <ol>
                                    {partValue.steps.map((step, idx) => (
                                        <li key={idx}>{step}</li>
                                    ))}
                                </ol>
                            </div>
                        )}
                        {partValue.activity && (
                            <div className="activity">
                                <h4>Activity:</h4>
                                <p>{partValue.activity.description}</p>
                                {partValue.activity.problems && (
                                    <div className="problems">
                                        <h5>Problems:</h5>
                                        <ul>
                                            {partValue.activity.problems.map((problem, idx) => (
                                                <li key={idx}>
                                                    {problem}
                                                    {partValue.activity.expectedAnswers && (
                                                        <span className="expected-answer">
                                                            → {partValue.activity.expectedAnswers[idx]}
                                                        </span>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {partValue.activity.scaffolding && (
                                    <div className="scaffolding">
                                        <h5>Scaffolding:</h5>
                                        <p>{partValue.activity.scaffolding}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

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
                                            {value.map((item, i) => {
                                                if (typeof item === 'object') {
                                                    return (
                                                        <li key={i}>
                                                            <strong>{item.title}</strong> by {item.author}
                                                            <div className="poem-excerpt">"{item.excerpt}"</div>
                                                        </li>
                                                    );
                                                }
                                                return <li key={i}>{item}</li>;
                                            })}
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
                {/* Pre-Lesson */}
                <div className="lesson-phase">
                    <h2>Pre Lesson</h2>
                    <div className="phase-content">
                        <p>{currentLesson.content.preLesson.description}</p>
                        <div className="content-section">
                            <h4>Activities</h4>
                            <ul>
                                {currentLesson.content.preLesson.activities.map((activity, idx) => (
                                    <li key={idx}>{activity}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="content-section">
                            <h4>Teacher Actions</h4>
                            <ul>
                                {currentLesson.content.preLesson.teacherActions.map((action, idx) => (
                                    <li key={idx}>{action}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* During Lesson */}
                <div className="lesson-phase">
                    <h2>During Lesson</h2>
                    <div className="phase-content">
                        {Object.entries(currentLesson.content.duringLesson).map(([partKey, partValue]) => (
                            <div key={partKey} className="lesson-part">
                                <h3>{partValue.title}</h3>
                                
                                {partValue.focus && (
                                    <div className="focus-points">
                                        <h4>Focus Points:</h4>
                                        <ul>
                                            {partValue.focus.map((point, idx) => (
                                                <li key={idx}>{point}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                
                                {partValue.activity && (
                                    <div className="activity">
                                        <h4>Activity:</h4>
                                        <p>{partValue.activity.description}</p>
                                        {partValue.activity.questions && (
                                            <div className="questions">
                                                <ul>
                                                    {partValue.activity.questions.map((question, idx) => (
                                                        <li key={idx}>{question}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {partValue.activity.scaffolding && (
                                            <div className="scaffolding">
                                                <p> {partValue.activity.scaffolding}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                {partValue.steps && (
                                    <div className="steps">
                                        <h4>Steps:</h4>
                                        <ol>
                                            {partValue.steps.map((step, idx) => (
                                                <li key={idx}>{step}</li>
                                            ))}
                                        </ol>
                                    </div>
                                )}
                                
                                {partValue.examples && (
                                    <div className="examples">
                                        <h4>Examples:</h4>
                                        <ul>
                                            {partValue.examples.map((example, idx) => (
                                                <li key={idx}>{example}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Post Lesson */}
                <div className="lesson-phase">
                    <h2>Post Lesson</h2>
                    <div className="phase-content">
                        <p>{currentLesson.content.postLesson.summary}</p>
                        <div className="content-section">
                            <h4>Key Points</h4>
                            <ul>
                                {currentLesson.content.postLesson.points.map((point, idx) => (
                                    <li key={idx}>{point}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="content-section">
                            <h4>Assessment</h4>
                            <ul>
                                {currentLesson.content.postLesson.assessment.map((item, idx) => (
                                    <li key={idx}>{item}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="content-section">
                            <h4>Next Lesson Preview</h4>
                            <p>{currentLesson.content.postLesson.nextLessonPreview}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DisplayLesson;