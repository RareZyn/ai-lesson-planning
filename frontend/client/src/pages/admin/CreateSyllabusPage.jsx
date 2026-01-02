import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Steps, Form, Input, Select, Button,
    Upload, Table, Space, Divider, message, Alert, Row, Col, Card
} from 'antd';
import {
    InboxOutlined, PlusOutlined, DeleteOutlined,
    FileExcelOutlined, ExperimentOutlined, SaveOutlined, ArrowLeftOutlined, DownloadOutlined
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { uploadSyllabus, extractSyllabusData } from '../../services/adminService';
import styles from './CreateSyllabusPage.module.css';

const { Option } = Select;
const { Dragger } = Upload;
const { Step } = Steps;

// --- SCHEMA DEFINITIONS ---
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

// --- SUB-COMPONENTS ---

const SchemaFieldEditor = ({ fields, onUpdate }) => {
    const updateField = (id, key, value) => {
        const updated = fields.map(f => f.id === id ? { ...f, [key]: value } : f);
        onUpdate(updated);
    };

    const addField = () => {
        const newField = { id: Date.now(), name: '', type: 'text', subFields: [] };
        onUpdate([...fields, newField]);
    };

    const removeField = (id) => {
        onUpdate(fields.filter(f => f.id !== id));
    };

    return (
        <Space direction="vertical" style={{ width: '100%' }}>
            {fields.map((field) => (
                <div key={field.id} style={{ marginBottom: 8, background: '#fafafa', padding: 12, borderRadius: 8, border: '1px solid #f0f0f0' }}>
                    <Space style={{ width: '100%', flexWrap: 'wrap' }} align="center" size={[8, 8]}>
                        <Input
                            addonBefore={field.type === 'object' ? 'Parent' : 'Field'}
                            placeholder="e.g. Topic"
                            value={field.name}
                            onChange={e => updateField(field.id, 'name', e.target.value)}
                            style={{ flex: 1, minWidth: '200px' }}
                        />
                        <Select
                            value={field.type}
                            onChange={val => updateField(field.id, 'type', val)}
                            style={{ width: 100 }}
                        >
                            <Option value="text">Text</Option>
                            <Option value="list">List</Option>
                            <Option value="object">Object</Option>
                        </Select>
                        <Button
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => removeField(field.id)}
                            disabled={fields.length <= 1}
                        />
                    </Space>

                    {field.type === 'object' && (
                        <div style={{ paddingLeft: 24, marginTop: 8 }}>
                            <SchemaFieldEditor
                                fields={field.subFields}
                                onUpdate={(newSubFields) => {
                                    const updated = fields.map(f => f.id === field.id ? { ...f, subFields: newSubFields } : f);
                                    onUpdate(updated);
                                }}
                            />
                        </div>
                    )}
                </div>
            ))}
            <Button type="dashed" onClick={addField} block icon={<PlusOutlined />}>
                Add Field
            </Button>
        </Space>
    );
};

const CreateSyllabusPage = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);

    // Form State
    const [grade, setGrade] = useState(null);
    const [subject, setSubject] = useState(null);
    const [schemaFields, setSchemaFields] = useState(DEFAULT_SCHEMA);
    const [parsedData, setParsedData] = useState(null);

    // AI Extraction State
    const [aiFile, setAiFile] = useState(null);
    const [extracting, setExtracting] = useState(false);

    // --- LOGIC ---

    const handleSubjectChange = (val) => {
        setSubject(val);
        if (val.toLowerCase() === 'english') {
            setSchemaFields(JSON.parse(JSON.stringify(ENGLISH_SCHEMA)));
        } else {
            setSchemaFields(JSON.parse(JSON.stringify(DEFAULT_SCHEMA)));
        }
    };

    const handleAIFileChange = (info) => {
        const { status } = info.file;
        if (status !== 'uploading') {
            setAiFile(info.file.originFileObj);
        }
    };

    const handleExtractData = async () => {
        if (!aiFile) {
            message.error("Please upload a file first.");
            return;
        }
        setExtracting(true);
        try {
            const result = await extractSyllabusData(aiFile, schemaFields);
            if (result.data) {
                setParsedData(result.data);
                message.success("Data extracted successfully!");
                setCurrentStep(2);
            }
        } catch (error) {
            message.error("Extraction failed: " + error.message);
        } finally {
            setExtracting(false);
        }
    };

    const handleExcelUpload = (info) => {
        const file = info.file.originFileObj;
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

            if (jsonData.length > 1) {
                const headers = jsonData[0];
                const rows = jsonData.slice(1);
                const mappedData = rows.map(row => {
                    const rowObj = {};
                    headers.forEach((h, i) => {
                        rowObj[h] = row[i];
                    });
                    return rowObj;
                });
                setParsedData(mappedData);
                message.success("Excel parsed successfully");
                setCurrentStep(2);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleDownloadTemplate = () => {
        const getFlattenedHeaders = (fields, prefix = '') => {
            let headers = [];
            fields.forEach(f => {
                const currentName = prefix ? `${prefix}.${f.name}` : f.name;
                if (f.type === 'object' && f.subFields && f.subFields.length > 0) {
                    headers.push(...getFlattenedHeaders(f.subFields, currentName));
                } else {
                    headers.push(currentName);
                }
            });
            return headers;
        };

        const headers = getFlattenedHeaders(schemaFields);
        const ws = XLSX.utils.aoa_to_sheet([headers]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, `${subject || 'Syllabus'}_Template.xlsx`);
    };

    const handleSave = async () => {
        if (!grade || !subject || !parsedData) return;
        setLoading(true);
        try {
            await uploadSyllabus({
                grade,
                subject,
                syllabusData: parsedData,
            });
            message.success("Syllabus created successfully!");
            navigate('/admin');
        } catch (error) {
            message.error("Save failed: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const generateTableColumns = (fields, prefix = '') => {
        let cols = [];
        fields.forEach(f => {
            if (f.type === 'object' && f.subFields) {
                cols.push(...generateTableColumns(f.subFields, f.name + '.'));
            } else {
                cols.push({
                    title: f.name,
                    dataIndex: prefix ? [...prefix.split('.').filter(Boolean), f.name] : f.name,
                    key: f.id,
                    render: (val) => Array.isArray(val) ? val.join(', ') : val
                });
            }
        });
        return cols;
    };

    const previewColumns = generateTableColumns(schemaFields);

    return (
        <div className={styles.pageContainer}>
            <div className={styles.headerContainer}>
                <div style={{ textAlign: 'left', marginBottom: '1rem' }}>
                    <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ paddingLeft: 0 }}>
                        Back
                    </Button>
                </div>
                <h1>Create New Syllabus</h1>
                <p style={{ color: '#6b7280' }}>Define structure and import curriculum data</p>

                <div style={{ maxWidth: '600px', margin: '2rem auto 0' }}>
                    <Steps current={currentStep} responsive={false} labelPlacement="vertical">
                        <Step title="Details" />
                        <Step title="Data" />
                        <Step title="Review" />
                    </Steps>
                </div>
            </div>

            <div className={styles.contentContainer}>
                <div className={styles.card}>
                    {/* STEP 0: DETAILS & SCHEMA */}
                    {currentStep === 0 && (
                        <Form layout="vertical">
                            <Row gutter={[24, 24]}>
                                <Col xs={24} md={12}>
                                    <Form.Item label={<span className={styles.formLabel}>Grade</span>} required>
                                        <Select size="large" placeholder="Select Grade" value={grade} onChange={setGrade}>
                                            {["Form 1", "Form 2", "Form 3", "Form 4", "Form 5"].map(g => (
                                                <Option key={g} value={g}>{g}</Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item label={<span className={styles.formLabel}>Subject</span>} required>
                                        <Select size="large" placeholder="Select Subject" value={subject} onChange={handleSubjectChange}>
                                            {SUBJECT_OPTIONS.map(s => (
                                                <Option key={s} value={s}>{s}</Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Divider orientation="left">Schema Definition</Divider>
                            <Alert message="Customize the structure below containing the columns for your syllabus." type="info" showIcon style={{ marginBottom: 24 }} />

                            <SchemaFieldEditor fields={schemaFields} onUpdate={setSchemaFields} />

                            <div className={styles.actions}>
                                <button
                                    className={`${styles.primaryButton}`}
                                    onClick={() => setCurrentStep(1)}
                                    disabled={!grade || !subject}
                                >
                                    Next: Import Data
                                </button>
                            </div>
                        </Form>
                    )}

                    {/* STEP 1: DATA INJECTION */}
                    {currentStep === 1 && (
                        <Space direction="vertical" style={{ width: '100%' }} size="large">

                            <Card
                                title="Option A: Clean Excel Upload"
                                bordered={false}
                                style={{ background: '#f9fafb', border: '1px dashed #d9d9d9' }}
                                extra={
                                    <Button type="link" icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
                                        Download Template
                                    </Button>
                                }
                            >
                                <Alert
                                    message="Instructions"
                                    description={
                                        <div style={{ fontSize: '0.9em' }}>
                                            <ul style={{ paddingLeft: 20, margin: '0 0 8px 0' }}>
                                                <li>Use the <b>Download Template</b> button to get the correct format.</li>
                                                <li>Ensure the <b>first row</b> headers match exactly.</li>
                                            </ul>
                                            <div style={{ background: '#fff', padding: '8px', borderRadius: '4px', border: '1px solid #d9d9d9' }}>
                                                <b>Data Types Guide:</b>
                                                <ul style={{ paddingLeft: 20, margin: 0 }}>
                                                    <li><b>Text:</b> Enter standard text (e.g., "Algebra").</li>
                                                    <li><b>List:</b> Separate items using <b>Alt + Enter</b> (New Line) within the cell.</li>
                                                    <li><b>Object (Nested):</b> Fill the specific columns generated by the template (e.g., if you defined <i>Topic</i> with sub-field <i>Main</i>, look for column <b>Topic.Main</b>).</li>
                                                </ul>
                                            </div>
                                        </div>
                                    }
                                    type="info"
                                    showIcon
                                    style={{ marginBottom: 16 }}
                                />
                                <Dragger
                                    accept=".xlsx, .xls"
                                    customRequest={({ onSuccess }) => setTimeout(() => onSuccess("ok"), 0)}
                                    onChange={handleExcelUpload}
                                    showUploadList={false}
                                >
                                    <p className="ant-upload-drag-icon"><FileExcelOutlined style={{ color: '#4f46e5' }} /></p>
                                    <p className="ant-upload-text">Click or drag Excel file here</p>
                                    <p className="ant-upload-hint">Ensure columns match the schema defined previously.</p>
                                </Dragger>
                            </Card>

                            <Divider><span style={{ color: '#9ca3af', fontSize: '0.9rem' }}>OR USE AI</span></Divider>

                            <Card title={<span><ExperimentOutlined /> Option B: AI Data Extraction</span>} style={{ borderColor: '#4f46e5', background: '#eff6ff' }}>
                                <Alert message="Upload a PDF/Image (e.g., DSKP) and let AI extract the data." type="info" showIcon style={{ marginBottom: 16 }} />
                                <Dragger
                                    accept=".pdf, image/*"
                                    customRequest={({ onSuccess }) => setTimeout(() => onSuccess("ok"), 0)}
                                    onChange={handleAIFileChange}
                                    maxCount={1}
                                    style={{ background: 'white' }}
                                >
                                    <p className="ant-upload-drag-icon"><InboxOutlined style={{ color: '#4f46e5' }} /></p>
                                    <p className="ant-upload-text">Drag DSKP PDF/Image here</p>
                                </Dragger>
                                <Button
                                    type="primary"
                                    icon={<ExperimentOutlined />}
                                    size="large"
                                    style={{ marginTop: 16, background: '#4f46e5', borderColor: '#4f46e5' }}
                                    onClick={handleExtractData}
                                    loading={extracting}
                                    disabled={!aiFile}
                                    block
                                >
                                    Extract Data with AI
                                </Button>
                            </Card>

                            <div className={styles.actions}>
                                <button className={styles.secondaryButton} onClick={() => setCurrentStep(0)}>Back</button>
                            </div>
                        </Space>
                    )}

                    {/* STEP 2: REVIEW */}
                    {currentStep === 2 && (
                        <div>
                            <Alert message={`Previewing ${parsedData?.length || 0} rows. Please verify data accuracy.`} type="success" showIcon style={{ marginBottom: 24 }} />

                            <Table
                                dataSource={parsedData}
                                columns={previewColumns}
                                rowKey={(record, index) => index}
                                scroll={{ x: true }}
                                pagination={{ pageSize: 5 }}
                                bordered
                                size="middle"
                            />

                            <div className={styles.actions}>
                                <button className={styles.secondaryButton} onClick={() => setCurrentStep(1)}>Back</button>
                                <button className={styles.primaryButton} onClick={handleSave} disabled={loading}>
                                    <SaveOutlined style={{ marginRight: 8 }} />
                                    {loading ? 'Saving...' : 'Save Syllabus'}
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default CreateSyllabusPage;
