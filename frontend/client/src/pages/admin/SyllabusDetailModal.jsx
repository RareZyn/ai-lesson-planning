// SyllabusDetailModal.jsx
import React from 'react';
import './SyllabusModal.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

const renderFieldValue = (fieldSchema, value) => {
    if (value === null || value === undefined || value === '') { // Also check for empty string
        return <span className="empty-field-value">N/A</span>;
    }

    switch (fieldSchema.type) {
        case 'text':
            return value;
        case 'list':
            return (
                <ul>
                    {Array.isArray(value) ? (
                        value.map((item, index) => <li key={index}>{item}</li>)
                    ) : (
                        <li>{String(value)} (Expected List)</li> // Handle cases where data doesn't match type
                    )}
                </ul>
            );
        case 'object':
            return (
                <div className="nested-object-display">
                    {typeof value === 'object' && value !== null ? (
                        // If the object has a schema defined, we can use it to render sub-fields nicely
                        // Otherwise, just stringify
                        (fieldSchema.subFields && fieldSchema.subFields.length > 0) ? (
                            fieldSchema.subFields.map((subFieldSchema, idx) => (
                                <div key={idx} className="nested-item">
                                    <strong>{subFieldSchema.name}:</strong> {renderFieldValue(subFieldSchema, value[subFieldSchema.name])}
                                </div>
                            ))
                        ) : (
                             // Fallback if no sub-schema was defined for the object
                            Object.entries(value).map(([subKey, subValue], idx) => (
                                <div key={idx} className="nested-item">
                                    <strong>{subKey}:</strong> {
                                        Array.isArray(subValue)
                                            ? `[${subValue.join(', ')}]`
                                            : typeof subValue === 'object' && subValue !== null
                                                ? JSON.stringify(subValue, null, 2)
                                                : subValue
                                    }
                                </div>
                            ))
                        )
                    ) : (
                        <span className="empty-field-value">{String(value)} (Expected Object)</span>
                    )}
                </div>
            );
        default:
            return String(value);
    }
};

const SyllabusDetailModal = ({ syllabus, onClose }) => {
    if (!syllabus) return null;

    const { grade, subject, schema, data, createdBy, date } = syllabus;

    return (
        <div className="modalOverlay">
            <div className="modalContent largeModal">
                <div className="modalHeader">
                    <h3>{data.Title || 'Syllabus Details'}</h3>
                    <button type="button" className="closeButton" onClick={onClose}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                <div className="modalBody syllabusDetailBody">
                    <p><strong>Grade:</strong> {grade}</p>
                    <p><strong>Subject:</strong> {subject}</p>

                    <h4 className="dynamic-data-heading">Syllabus Content:</h4>
                    {schema.map((fieldSchema) => (
                        <div key={fieldSchema.name} className="dynamic-field-row">
                            <strong>{fieldSchema.name}:</strong>
                            {renderFieldValue(fieldSchema, data[fieldSchema.name])}
                        </div>
                    ))}

                    <p className="metaInfo">Created By: {createdBy} on {date}</p>
                </div>
                <div className="modalFooter">
                    <button type="button" className="cancelButton" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default SyllabusDetailModal;