// CreateSyllabusModal.jsx
import React, { useState, useEffect } from 'react';
import { message } from "antd";
import './SyllabusModal.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faUpload, faTimes, faPlusCircle, faMinusCircle, faCaretRight, faCaretDown, faInfoCircle, faMagic } from '@fortawesome/free-solid-svg-icons';
import * as XLSX from 'xlsx'; // Import the xlsx library
import { uploadSyllabus, extractSyllabusData } from '../../services/adminService';

// --- DEFINED SCHEMAS ---
const SUBJECT_OPTIONS = ["Bahasa Melayu", "English", "Mathematics", "Science", "History", "Geography"];

const ENGLISH_SCHEMA = [
    { id: 1, name: 'Title', type: 'text', subFields: [] },
    {
        id: 2, name: 'Content Standard', type: 'object', subFields: [
            { id: 21, name: 'main', type: 'text', subFields: [] },
            { id: 22, name: 'comp', type: 'text', subFields: [] }
        ]
    },
    {
        id: 3, name: 'Learning Standard', type: 'object', subFields: [
            { id: 31, name: 'main', type: 'text', subFields: [] },
            { id: 32, name: 'comp', type: 'text', subFields: [] }
        ]
    },
    {
        id: 4, name: 'Learning Outline', type: 'object', subFields: [
            { id: 41, name: 'pre', type: 'text', subFields: [] },
            { id: 42, name: 'during', type: 'text', subFields: [] },
            { id: 43, name: 'post', type: 'text', subFields: [] }
        ]
    },
    { id: 5, name: 'Lesson No', type: 'text', subFields: [] },
    { id: 6, name: 'Theme', type: 'text', subFields: [] },
    { id: 7, name: 'Differentiation Strategy', type: 'text', subFields: [] },
    { id: 8, name: 'cce', type: 'list', subFields: [] },
];

const DEFAULT_SCHEMA = [
    { id: 1, name: 'Title', type: 'text', subFields: [] },
    { id: 2, name: 'Content Standard', type: 'list', subFields: [] },
    { id: 3, name: 'Learning Standard', type: 'list', subFields: [] },
    { id: 4, name: 'Notes', type: 'list', subFields: [] },
    { id: 5, name: 'Performance Value', type: 'list', subFields: [] },
];

const SchemaFieldInput = ({ field, onFieldNameChange, onFieldTypeChange, onRemoveField, onAddSubField, onRemoveSubField, onSubFieldNameChange, onSubFieldTypeChange, isSubField = false, canRemoveField }) => {
    const [isExpanded, setIsExpanded] = useState(true); // For object fields

    return (
        <div className={`schemaFieldRow ${isSubField ? 'sub-field-row' : ''}`}>
            <div className="field-controls">
                {field.type === 'object' && (
                    <button type="button" className="expand-toggle" onClick={() => setIsExpanded(!isExpanded)}>
                        <FontAwesomeIcon icon={isExpanded ? faCaretDown : faCaretRight} />
                    </button>
                )}
                <input
                    type="text"
                    placeholder={isSubField ? "Sub-Field Name (e.g., Pre-Lesson)" : "Field Name (e.g., Topic)"}
                    value={field.name}
                    onChange={(e) => onFieldNameChange(field.id, e.target.value)}
                    className="field-name-input"
                    style={{ marginLeft: field.type === 'object' ? '5px' : '0' }}
                />
                <select
                    value={field.type}
                    onChange={(e) => onFieldTypeChange(field.id, e.target.value)}
                    className="field-type-select"
                >
                    <option value="text">Text (single value)</option>
                    <option value="list">List (newline separated)</option>
                    <option value="object">Object (nested columns)</option>
                </select>
                <button
                    type="button"
                    onClick={() => onRemoveField(field.id)}
                    className="removeFieldButton"
                    disabled={!canRemoveField} // Disable removing the last field
                >
                    <FontAwesomeIcon icon={faMinusCircle} />
                </button>
            </div>

            {field.type === 'object' && isExpanded && (
                <div className="subFieldsContainer">
                    {field.subFields.map(subField => (
                        <SchemaFieldInput
                            key={subField.id}
                            field={subField}
                            onFieldNameChange={(subId, newName) => onSubFieldNameChange(field.id, subId, newName)}
                            onFieldTypeChange={(subId, newType) => onSubFieldTypeChange(field.id, subId, newType)}
                            onRemoveField={(subId) => onRemoveSubField(field.id, subId)}
                            isSubField={true}
                            canRemoveField={field.subFields.length > 0} // Can always remove if there's at least one
                        />
                    ))}
                    <button type="button" onClick={() => onAddSubField(field.id)} className="addSubFieldButton">
                        <FontAwesomeIcon icon={faPlusCircle} /> Add Sub-Field
                    </button>
                </div>
            )}
        </div>
    );
};


const CreateSyllabusModal = ({ onClose, onSave, allGrades }) => {
    const [selectedGrade, setSelectedGrade] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [file, setFile] = useState(null);
    const [parsedData, setParsedData] = useState(null);
    const [uploadError, setUploadError] = useState('');
    const [schemaFields, setSchemaFields] = useState(DEFAULT_SCHEMA);

    // AI Extraction State
    const [aiFile, setAiFile] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Handle Subject Change & Auto-Fill Schema
    const handleSubjectChange = (e) => {
        const subject = e.target.value;
        setSelectedSubject(subject);

        if (subject.toLowerCase() === 'english') {
            setSchemaFields(JSON.parse(JSON.stringify(ENGLISH_SCHEMA))); // Deep copy to avoid ref issues
        } else {
            setSchemaFields(JSON.parse(JSON.stringify(DEFAULT_SCHEMA)));
        }
    };

    // --- Helper Functions for Schema Management ---

    const handleAIFileChange = (e) => {
        const file = e.target.files[0];
        if (file) setAiFile(file);
    };

    const handleAnalyzeStructure = async () => {
        if (!aiFile) {
            setUploadError("Please select a file to analyze.");
            return;
        }

        try {
            setIsAnalyzing(true);
            setUploadError('');

            // Pass the schema to the API so AI knows what to extract
            const result = await extractSyllabusData(aiFile, schemaFields);

            // Set the data if available
            if (result.data) {
                setParsedData(result.data);
                message.success("Data extracted successfully!");
            }

        } catch (error) {
            console.error("Analysis failed:", error);
            setUploadError("Failed to extract syllabus data. " + error.message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const updateSchemaFields = (id, newValues, fieldsArray = schemaFields) => {
        return fieldsArray.map(field => {
            if (field.id === id) {
                return { ...field, ...newValues };
            }
            if (field.type === 'object' && field.subFields) { // Ensure subFields exist
                return { ...field, subFields: updateSchemaFields(id, newValues, field.subFields) };
            }
            return field;
        }).filter(Boolean);
    };

    const addSchemaField = (parentId = null) => {
        const newField = { id: Date.now(), name: '', type: 'text', subFields: [] };
        if (parentId) {
            setSchemaFields(prevFields =>
                updateSchemaFields(parentId, {
                    subFields: [...(prevFields.find(f => f.id === parentId)?.subFields || []), newField]
                })
            );
        } else {
            setSchemaFields(prevFields => [...prevFields, newField]);
        }
    };

    const removeSchemaField = (id, parentId = null) => {
        if (parentId) {
            setSchemaFields(prevFields =>
                updateSchemaFields(parentId, {
                    subFields: prevFields.find(f => f.id === parentId).subFields.filter(f => f.id !== id)
                })
            );
        } else {
            if (schemaFields.length === 1) {
                setUploadError("Cannot remove the last syllabus field.");
                return;
            }
            setSchemaFields(prevFields => prevFields.filter(field => field.id !== id));
        }
        setUploadError('');
    };

    const handleFieldNameChange = (id, newName) => {
        setSchemaFields(prevFields => updateSchemaFields(id, { name: newName }));
    };

    const handleFieldTypeChange = (id, newType) => {
        setSchemaFields(prevFields => updateSchemaFields(id, {
            type: newType,
            subFields: newType === 'object' ? (prevFields.find(f => f.id === id)?.subFields || []) : []
        }));
    };

    const handleAddSubField = (parentId) => {
        const newSubField = { id: Date.now(), name: '', type: 'text', subFields: [] };
        setSchemaFields(prevFields =>
            updateSchemaFields(parentId, {
                subFields: [...(prevFields.find(f => f.id === parentId)?.subFields || []), newSubField]
            })
        );
    };

    const handleRemoveSubField = (parentId, subFieldId) => {
        setSchemaFields(prevFields =>
            updateSchemaFields(parentId, {
                subFields: prevFields.find(f => f.id === parentId).subFields.filter(f => f.id !== subFieldId)
            })
        );
    };

    const handleSubFieldNameChange = (parentId, subFieldId, newName) => {
        setSchemaFields(prevFields =>
            updateSchemaFields(parentId, {
                subFields: prevFields.find(f => f.id === parentId).subFields.map(sub =>
                    sub.id === subFieldId ? { ...sub, name: newName } : sub
                )
            })
        );
    };

    const handleSubFieldTypeChange = (parentId, subFieldId, newType) => {
        setSchemaFields(prevFields =>
            updateSchemaFields(parentId, {
                subFields: prevFields.find(f => f.id === parentId).subFields.map(sub =>
                    sub.id === subFieldId ? { ...sub, type: newType, subFields: newType === 'object' ? (sub.subFields || []) : [] } : sub
                )
            })
        );
    };


    // --- Excel Template Generation ---

    const extractHeaders = (fields, prefix = "") => {
        let headers = [];

        for (const field of fields) {
            const currentName = prefix ? `${prefix}.${field.name}` : field.name;
            if (field.type === "object" && field.subFields && field.subFields.length > 0) {
                headers.push(...extractHeaders(field.subFields, currentName));
            } else {
                headers.push(currentName);
            }
        }
        return headers;
    };


    const handleDownloadTemplate = () => {
        if (schemaFields.length === 0) {
            message.warning("Please add at least one schema field.");
            return;
        }

        const headers = extractHeaders(schemaFields);
        const worksheet = XLSX.utils.aoa_to_sheet([headers]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
        XLSX.writeFile(workbook, "syllabus_template.xlsx");
    };


    // --- Excel File Parsing ---

    const parseExcelDataToStructuredObject = (excelData, schema) => {
        const structuredData = {};

        // Helper to recursively parse a single field
        const parseField = (field, currentPrefix, dataMap) => {
            const fullFieldName = currentPrefix ? `${currentPrefix}.${field.name}` : field.name;

            if (field.type === 'object' && field.subFields && field.subFields.length > 0) {
                const nestedObj = {};
                field.subFields.forEach(sub => {
                    nestedObj[sub.name] = parseField(sub, fullFieldName, dataMap);
                });
                return nestedObj;
            } else {
                // Leaf node - extract value using full dot notation name
                let val = dataMap[fullFieldName];

                if (val !== undefined && val !== null && val !== '') {
                    if (field.type === 'list') {
                        return String(val).split('\n').map(item => item.trim()).filter(Boolean);
                    } else if (field.type === 'text') {
                        return String(val);
                    } else {
                        return val;
                    }
                }
                return null;
            }
        };

        schema.forEach(field => {
            structuredData[field.name] = parseField(field, "", excelData);
        });

        return structuredData;
    };

    const handleFileChange = (e) => {
        const uploadedFile = e.target.files[0];
        if (!uploadedFile) {
            setFile(null);
            setParsedData(null);
            setUploadError('');
            return;
        }

        setFile(uploadedFile);
        setUploadError('');

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                const jsonFromExcel = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: '' });

                if (!jsonFromExcel || jsonFromExcel.length < 1) {
                    setUploadError('Uploaded Excel file is empty or too short.');
                    setParsedData(null);
                    return;
                }

                const headers = jsonFromExcel[0];
                const actualDataRows = jsonFromExcel.slice(1);

                if (actualDataRows.length === 0) {
                    setUploadError('No data rows found.');
                    setParsedData(null);
                    return;
                }

                const hasDefinedSchema = schemaFields.some(f => f.name.trim() !== '');

                let allParsedRows;
                if (hasDefinedSchema) {
                    allParsedRows = actualDataRows.map(row => {
                        // Create a flat map of Header -> Value for this row
                        const rawExcelData = {};
                        headers.forEach((header, index) => {
                            rawExcelData[header] = row[index];
                        });
                        return parseExcelDataToStructuredObject(rawExcelData, schemaFields);
                    });

                    // Validation
                    for (const rowData of allParsedRows) {
                        const validationResult = validateUploadedDataAgainstSchema(rowData, schemaFields);
                        if (!validationResult.isValid) {
                            setUploadError(`Invalid data: ${validationResult.message}`);
                            setParsedData(null);
                            return;
                        }
                    }
                } else {
                    allParsedRows = actualDataRows.map(row => {
                        const rowData = {};
                        headers.forEach((header, index) => {
                            rowData[header] = row[index];
                        });
                        return rowData;
                    });
                }

                setParsedData(allParsedRows);

            } catch (error) {
                setUploadError('Failed to parse Excel file. ' + error.message);
                setParsedData(null);
            }
        };
        reader.readAsArrayBuffer(uploadedFile);
    };


    const handleSubmit = async () => {
        const hasEmptyFieldName = (fields) => {
            return fields.some(f => !f.name.trim() || (f.type === 'object' && f.subFields && hasEmptyFieldName(f.subFields)));
        };

        if (!selectedGrade || !selectedSubject) {
            setUploadError('Please select a Grade and Subject.');
            return;
        }
        if (hasEmptyFieldName(schemaFields)) {
            setUploadError('Please define names for all schema fields and sub-fields.');
            return;
        }
        if (!parsedData) {
            setUploadError('Please upload and parse a valid syllabus file first.');
            return;
        }

        try {
            // Call the API to upload the syllabus (send parsed JSON)
            const response = await uploadSyllabus({
                grade: selectedGrade,
                subject: selectedSubject,
                syllabusData: parsedData,
            });
            console.log('Syllabus uploaded successfully:', response);
            onSave(); // Close modal and potentially refresh data
            onClose();
        } catch (error) {
            console.error('Error uploading syllabus:', error);
            setUploadError(error.message || 'Failed to upload syllabus.');
        }
    };

    // Re-use validation for data after parsing
    const validateUploadedDataAgainstSchema = (data, schema) => {
        for (const field of schema) {
            // Check if field exists in data
            if (!data || !Object.prototype.hasOwnProperty.call(data, field.name)) {
                // Determine if this is a "required" field. 
                // For now, let's assume all schema-defined fields are expected to be present, 
                // effectively treating them as required if they are in the schema.
                // You can add distinct "required" logic if needed.
                return { isValid: false, message: `Missing field: '${field.name}'` };
            }

            const value = data[field.name];

            if (field.type === 'object' && field.subFields && field.subFields.length > 0) {
                // If value is null/undefined but field is object, it's missing data
                if (value === null || value === undefined) {
                    return { isValid: false, message: `Missing data for object: '${field.name}'` };
                }
                // Recurse
                const subValidation = validateUploadedDataAgainstSchema(value, field.subFields);
                if (!subValidation.isValid) {
                    return { isValid: false, message: `In '${field.name}': ${subValidation.message}` };
                }
            }
            // Optional: Add type checks (e.g. array for 'list')
        }
        return { isValid: true, message: '' };
    };


    return (
        <div className="modalOverlay">
            <div className="modalContent largeModal">
                <div className="modalHeader">
                    <h3>Create New Syllabus (Dynamic Schema)</h3>
                    <button type="button" className="closeButton" onClick={onClose}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                <div className="modalBody">
                    <div className="formGroup">
                        <label>Grade:</label>
                        <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)}>
                            <option value="">Select Grade</option>
                            <option value="Form 1">Form 1</option>
                            <option value="Form 2">Form 2</option>
                            <option value="Form 3">Form 3</option>
                            <option value="Form 4">Form 4</option>
                            <option value="Form 5">Form 5</option>
                        </select>
                    </div>
                    <div className="formGroup">
                        <label>Subject:</label>
                        <select
                            value={selectedSubject}
                            onChange={handleSubjectChange}
                        >
                            <option value="">Select Subject</option>
                            {SUBJECT_OPTIONS.map((subj) => (
                                <option key={subj} value={subj}>{subj}</option>
                            ))}
                        </select>
                    </div>

                    {/* --- AI Data Extraction Section --- */}
                    <div className="aiSection">
                        <div className="aiHeader">
                            <FontAwesomeIcon icon={faMagic} />
                            <h4>AI Data Extraction (Optional)</h4>
                        </div>
                        <p className="aiDescription">
                            Upload a syllabus file (PDF or Image) and let AI extract data matching the schema below.
                        </p>
                        <div className="aiControls">
                            <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={handleAIFileChange}
                            />
                            <button
                                type="button"
                                className="aiButton"
                                onClick={handleAnalyzeStructure}
                                disabled={!aiFile || isAnalyzing}
                            >
                                {isAnalyzing ? 'Extracting Data...' : 'Extract Data'}
                            </button>
                        </div>
                    </div>

                    <h4>Define Syllabus Structure (Schema): <FontAwesomeIcon icon={faInfoCircle} title="Define the column headers for your syllabus. 'Object' fields create nested columns (e.g., 'Activities.Pre-Lesson'). 'List' fields expect newlines for each item in a single cell." /></h4>
                    <p className="hint-text">Add or edit the fields for this syllabus. For nested structures (e.g., Lesson Activities), use 'Object' type and define its sub-fields.</p>
                    <div className="schemaDefinition">
                        {schemaFields.map(field => (
                            <SchemaFieldInput
                                key={field.id}
                                field={field}
                                onFieldNameChange={handleFieldNameChange}
                                onFieldTypeChange={handleFieldTypeChange}
                                onRemoveField={(id) => removeSchemaField(id, null)}
                                onAddSubField={handleAddSubField}
                                onRemoveSubField={handleRemoveSubField}
                                onSubFieldNameChange={handleSubFieldNameChange}
                                onSubFieldTypeChange={handleSubFieldTypeChange}
                                isSubField={false}
                                canRemoveField={schemaFields.length > 1}
                            />
                        ))}
                        <button type="button" onClick={() => addSchemaField(null)} className="addFieldButton">
                            <FontAwesomeIcon icon={faPlusCircle} /> Add Root Field
                        </button>
                    </div>

                    <p className="hint-text">
                        Download the template. For <strong>List</strong> fields (arrays), separate multiple items in a single cell using <strong>Alt + Enter</strong> (newlines).
                    </p>
                    <button
                        type="button"
                        className="modalActionButton downloadButton"
                        onClick={handleDownloadTemplate}
                        disabled={!selectedGrade || !selectedSubject || schemaFields.some(f => !f.name.trim() || (f.type === 'object' && f.subFields && f.subFields.some(sf => !sf.name.trim())))}
                    >
                        <FontAwesomeIcon icon={faDownload} /> Download Custom Template (.xlsx)
                    </button>

                    <div className="formGroup fileUpload">
                        <label className="uploadLabel">
                            <input type="file" accept=".xlsx" onChange={handleFileChange} />
                            <FontAwesomeIcon icon={faUpload} /> {file ? file.name : 'Upload Syllabus File (.xlsx)'}
                        </label>
                        {uploadError && <p className="errorText">{uploadError}</p>}
                    </div>

                    {parsedData && (
                        <div className="syllabusPreview">
                            <h4>Preview Uploaded Data:</h4>
                            <pre className="json-preview">{JSON.stringify(parsedData, null, 2)}</pre>
                        </div>
                    )}
                </div>
                <div className="modalFooter">
                    <button type="button" className="cancelButton" onClick={onClose}>Cancel</button>
                    <button type="button" className="confirmButton" onClick={handleSubmit}
                        disabled={
                            !file || !selectedGrade || !selectedSubject ||
                            schemaFields.some(f => !f.name.trim() || (f.type === 'object' && f.subFields && f.subFields.some(sf => !sf.name.trim())))
                        }
                    >
                        Add Syllabus
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateSyllabusModal;