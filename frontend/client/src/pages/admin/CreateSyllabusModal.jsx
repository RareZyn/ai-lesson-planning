// CreateSyllabusModal.jsx
import React, { useState } from 'react';
import './SyllabusModal.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faUpload, faTimes, faPlusCircle, faMinusCircle, faCaretRight, faCaretDown, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import * as XLSX from 'xlsx'; // Import the xlsx library
import { uploadSyllabus } from '../../services/adminService';
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
    const [schemaFields, setSchemaFields] = useState([
        { id: 1, name: 'Title', type: 'text', subFields: [] }
    ]);

    // --- Helper Functions for Schema Management ---

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

    const extractHeaders = (fields) => {
        let headers = [];

        for (const field of fields) {
            if (field.type === "object" && field.subFields?.length > 0) {
                field.subFields.forEach((sub) => {
                    headers.push(`${field.name}.${sub.name}`);
                });
            } else {
                headers.push(field.name);
            }
        }

        return headers;
    };


    const handleDownloadTemplate = () => {
        if (schemaFields.length === 0) {
            alert("Please add at least one schema field.");
            return;
        }

        // Extract only the headers
        const headers = extractHeaders(schemaFields); // flatten dot notation

        const worksheet = XLSX.utils.aoa_to_sheet([headers]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

        XLSX.writeFile(workbook, "syllabus_template.xlsx");
    };



    // --- Excel File Parsing ---

    const parseExcelDataToStructuredObject = (excelData, schema) => {
        const structuredData = {};

        schema.forEach(field => {
            const excelValue = excelData[field.name]; // Try to get the exact column name

            if (field.type === 'object' && field.subFields && field.subFields.length > 0) {
                const nestedData = {};
                field.subFields.forEach(subField => {
                    const fullSubFieldName = `${field.name}.${subField.name}`; // e.g., "LessonActivities.PreLesson"
                    const subExcelValue = excelData[fullSubFieldName]; // Get value from combined column

                    if (subExcelValue !== undefined && subExcelValue !== null && subExcelValue !== '') {
                        if (subField.type === 'list') {
                            nestedData[subField.name] = String(subExcelValue).split('\n').map(item => item.trim()).filter(Boolean);
                        } else if (subField.type === 'text') {
                            nestedData[subField.name] = String(subExcelValue);
                        } else {
                            nestedData[subField.name] = subExcelValue; // Fallback for other types
                        }
                    } else {
                        nestedData[subField.name] = null; // Or empty array/string based on type
                    }
                });
                structuredData[field.name] = nestedData;

            } else if (field.type === 'list') {
                if (excelValue !== undefined && excelValue !== null && excelValue !== '') {
                    structuredData[field.name] = String(excelValue).split('\n').map(item => item.trim()).filter(Boolean);
                } else {
                    structuredData[field.name] = [];
                }
            } else if (field.type === 'text') {
                structuredData[field.name] = excelValue !== undefined && excelValue !== null ? String(excelValue) : '';
            } else {
                structuredData[field.name] = excelValue; // Direct assignment for other types
            }
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

                // Options: raw=false to get formatted values, defval='' for empty cells
                const jsonFromExcel = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: '' });

                if (!jsonFromExcel || jsonFromExcel.length < 1) {
                    setUploadError('Uploaded Excel file is empty or too short. Expected at least headers.');
                    setParsedData(null);
                    return;
                }

                // Assuming the first row is headers, and data starts from the 2nd row
                const headers = jsonFromExcel[0];
                const actualDataRows = jsonFromExcel.slice(1); // Skip header row

                if (actualDataRows.length === 0) {
                    setUploadError('No data rows found in the uploaded Excel file. Please fill out the template.');
                    setParsedData(null);
                    return;
                }

                // Check if schema is defined (has fields with names)
                const hasDefinedSchema = schemaFields.some(f => f.name.trim() !== '');

                let allParsedRows;
                if (hasDefinedSchema) {
                    // Process all data rows with schema
                    allParsedRows = actualDataRows.map(row => {
                        const rawExcelData = {};
                        headers.forEach((header, index) => {
                            rawExcelData[header] = row[index];
                        });
                        return parseExcelDataToStructuredObject(rawExcelData, schemaFields);
                    });

                    // Basic validation: Check if required fields from schema have data for each row
                    for (const rowData of allParsedRows) {
                        const validationResult = validateUploadedDataAgainstSchema(rowData, schemaFields);
                        if (!validationResult.isValid) {
                            setUploadError(`Invalid syllabus data in one of the rows: ${validationResult.message}`);
                            setParsedData(null);
                            return;
                        }
                    }
                } else {
                    // No schema defined - parse Excel as-is with its headers
                    allParsedRows = actualDataRows.map(row => {
                        const rowData = {};
                        headers.forEach((header, index) => {
                            rowData[header] = row[index];
                        });
                        return rowData;
                    });
                }

                setParsedData(allParsedRows); // Store all parsed rows

            } catch (error) {
                setUploadError('Failed to parse Excel file. Please ensure it is a valid XLSX format. ' + error.message);
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
        if (!file) { // Changed from parsedData to file, as we send the raw file to backend
            setUploadError('Please upload a valid syllabus file matching your defined schema.');
            return;
        }

        try {
            // Call the API to upload the syllabus
            const response = await uploadSyllabus({
                grade: selectedGrade,
                subject: selectedSubject,
                file: file,
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
        // Flatten schema for easier key comparison, handling nested objects
        const flattenSchemaKeys = (fields, prefix = '') => {
            let keys = [];
            fields.forEach(field => {
                const currentKey = prefix ? `${prefix}.${field.name}` : field.name;
                if (field.type === 'object' && field.subFields && field.subFields.length > 0) {
                    keys = keys.concat(flattenSchemaKeys(field.subFields, currentKey));
                } else {
                    keys.push({ name: currentKey, type: field.type });
                }
            });
            return keys;
        };

        const flatSchema = flattenSchemaKeys(schemaFields);
        const uploadedKeys = Object.keys(data);

        for (const schemaField of flatSchema) {
            const fieldName = schemaField.name;

            // Check if the flattened schema field name exists in the uploaded data keys
            if (!uploadedKeys.includes(fieldName)) {
                // If it's a required field (e.g., 'Title'), return an error
                if (fieldName.endsWith('.Title') || fieldName === 'Title') { // Assuming 'Title' or any nested 'Title' is required
                    return { isValid: false, message: `Required field '${fieldName}' is missing in the uploaded file.` };
                }
            }

            // You might add more specific type validation here if needed
            // e.g., if (fieldType === 'list' && !Array.isArray(data[fieldName])) { ... }
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
                        <input
                            type="text"
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            placeholder="e.g., Mathematics, English"
                        />
                    </div>

                    <h4>Define Syllabus Structure (Schema): <FontAwesomeIcon icon={faInfoCircle} title="Define the column headers for your syllabus. 'Object' fields create nested columns (e.g., 'Activities.Pre-Lesson'). 'List' fields expect newlines for each item in a single cell." /></h4>
                    <p className="hint-text">Add the fields for this syllabus. For nested structures (e.g., Lesson Activities), use 'Object' type and define its sub-fields.</p>
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

                    <p className="hint-text">Once schema is defined, download the Excel template, fill it, and upload.</p>
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