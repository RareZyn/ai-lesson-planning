// frontend/client/src/pages/class/StudentManagementSection.jsx
import React, { useState, useEffect, useRef, useCallback } from "react"; // Import useRef
import { Modal, Button, Form, Alert, ProgressBar } from "react-bootstrap"; // Add ProgressBar
import { Modal as AntModal } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { studentAPI } from "../../services/studentService";
import {
  PersonAdd,
  Edit,
  Delete,
  Search,
  CloudUpload, // New icon for upload
  Download, // New icon for download
} from "@mui/icons-material";
import styles from "./StudentManagementSection.module.css";
// You'll need to install 'xlsx' and 'file-saver'
// npm install xlsx file-saver
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const StudentManagementSection = ({ classId, classInfo }) => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  // NEW: Bulk Add Modal states
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [bulkUploadStatus, setBulkUploadStatus] = useState("");
  const [bulkUploadProgress, setBulkUploadProgress] = useState(0);
  const [bulkUploadErrors, setBulkUploadErrors] = useState([]); // To store specific row errors
  const fileInputRef = useRef(null); // Ref for file input

  // Form state (for single add/edit)
  const [formData, setFormData] = useState({
    name: "",
    rollNumber: "",
    gender: "",
    notes: "",
  });

  useEffect(() => {
    if (classId) {
      fetchStudents();
    }
  }, [classId]);

  useEffect(() => {
    // Filter students based on search
    const filtered = students.filter(
      (student) =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) // Assuming studentId is available
    );
    setFilteredStudents(filtered);
  }, [searchTerm, students]);

  const fetchStudents = async () => {
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await studentAPI.getStudentsByClass(classId, {
        status: "active",
        sortBy: "name",
        sortOrder: "asc",
      });

      if (result.success) {
        setStudents(result.data);
        setFilteredStudents(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Failed to load students");
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    if (classId) {
      fetchStudents();
    }
  }, [classId, fetchStudents]);

  useEffect(() => {
    // Filter students based on search
    const filtered = students.filter(
      (student) =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStudents(filtered);
  }, [searchTerm, students]);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await studentAPI.addStudent({
        name: formData.name.trim(),
        classId,
        rollNumber: formData.rollNumber || undefined,
        gender: formData.gender || undefined,
        notes: formData.notes.trim(),
      });

      if (result.success) {
        setSuccess(`Student added successfully! ID: ${result.data.studentId}`);
        setShowAddModal(false);
        resetForm();
        await fetchStudents();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Failed to add student");
    } finally {
      setLoading(false);
    }
  };

  const handleEditStudent = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await studentAPI.updateStudent(editingStudent._id, {
        name: formData.name.trim(),
        rollNumber: formData.rollNumber || undefined,
        gender: formData.gender || undefined,
        notes: formData.notes.trim(),
      });

      if (result.success) {
        setSuccess("Student updated successfully!");
        setShowEditModal(false);
        setEditingStudent(null);
        resetForm();
        await fetchStudents();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Failed to update student");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (student) => {
    AntModal.confirm({
      title: "Delete Student",
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to delete ${student.name} (${student.studentId})? This action cannot be undone.`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        setLoading(true);
        try {
          const result = await studentAPI.deleteStudent(student._id);
          if (result.success) {
            setSuccess("Student deleted successfully!");
            await fetchStudents();
            setTimeout(() => setSuccess(""), 3000);
          } else {
            setError(result.message);
          }
        } catch (err) {
          setError("Failed to delete student");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      rollNumber: student.rollNumber || "",
      gender: student.gender || "",
      notes: student.notes || "",
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      rollNumber: "",
      gender: "",
      notes: "",
    });
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    resetForm();
    setError("");
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingStudent(null);
    resetForm();
    setError("");
  };

  // --- NEW BULK ADD FUNCTIONS ---

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (
        file.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel"
      ) {
        setExcelFile(file);
        setError("");
        setBulkUploadStatus("");
        setBulkUploadErrors([]);
      } else {
        setExcelFile(null);
        setError("Please upload a valid Excel file (.xlsx or .xls).");
        setBulkUploadStatus("");
        setBulkUploadErrors([]);
      }
    } else {
      setExcelFile(null);
      setError("");
      setBulkUploadStatus("");
      setBulkUploadErrors([]);
    }
  };

  const downloadTemplate = () => {
    const headers = ["Student Name", "Roll Number", "Notes"];
    const worksheet = XLSX.utils.aoa_to_sheet([headers]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

    // Auto-fit columns
    const max_width = headers.reduce((w, r) => Math.max(w, r.length), 10);
    worksheet["!cols"] = [{ wch: max_width }];

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });
    saveAs(data, "student_upload_template.xlsx");
  };

  const handleBulkUpload = async () => {
    if (!excelFile) {
      setError("Please select an Excel file to upload.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setBulkUploadStatus("Processing file...");
    setBulkUploadProgress(0);
    setBulkUploadErrors([]);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonStudents = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // Read as array of arrays

        if (jsonStudents.length < 2) {
          setError("The Excel file is empty or only contains headers.");
          setLoading(false);
          return;
        }

        const headers = jsonStudents[0].map(h => String(h).trim());
        const expectedHeaders = ["Student Name", "Roll Number", "Notes"];

        // Basic header validation
        const missingHeaders = expectedHeaders.filter(
          (header) => !headers.includes(header)
        );
        if (missingHeaders.length > 0) {
            setError(`Missing required headers: ${missingHeaders.join(', ')}. Please use the provided template.`);
            setLoading(false);
            return;
        }

        const studentsToUpload = [];
        for (let i = 1; i < jsonStudents.length; i++) { // Start from second row
          const row = jsonStudents[i];
          const studentData = {
            name: row[headers.indexOf("Student Name")] ? String(row[headers.indexOf("Student Name")]).trim() : '',
            rollNumber: row[headers.indexOf("Roll Number")] ? parseInt(row[headers.indexOf("Roll Number")], 10) : undefined,
            notes: row[headers.indexOf("Notes")] ? String(row[headers.indexOf("Notes")]).trim() : '',
            classId: classId,
          };

          // Basic client-side validation for name
          if (!studentData.name) {
            setBulkUploadErrors(prev => [...prev, { row: i + 1, message: "Student Name is required" }]);
            continue; // Skip this student
          }
          if (isNaN(studentData.rollNumber) && row[headers.indexOf("Roll Number")]) {
             setBulkUploadErrors(prev => [...prev, { row: i + 1, message: "Roll Number must be a number" }]);
             studentData.rollNumber = undefined; // Clear invalid roll number
          }

          studentsToUpload.push(studentData);
        }

        if (studentsToUpload.length === 0 && bulkUploadErrors.length > 0) {
            setError("No valid students found to upload. Please check the errors above.");
            setLoading(false);
            return;
        } else if (studentsToUpload.length === 0) {
            setError("No students found to upload after parsing the file.");
            setLoading(false);
            return;
        }

        setBulkUploadStatus(`Uploading ${studentsToUpload.length} students...`);

        // Call the new bulk add API endpoint
        const uploadResult = await studentAPI.bulkAddStudents(
          classId,
          studentsToUpload,
          (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setBulkUploadProgress(percentCompleted);
          }
        );

        if (uploadResult.success) {
          setSuccess("Bulk student upload completed!");
          if (uploadResult.data?.failedStudents && uploadResult.data.failedStudents.length > 0) {
            setBulkUploadErrors(prev => [...prev, ...uploadResult.data.failedStudents.map(fs => ({
                row: fs.originalRow + 1, // +1 for 1-based indexing in excel
                message: `${fs.studentName || 'Unknown student'}: ${fs.error}`,
                isServer: true
            }))]);
            setError(`Some students failed to upload. See details below.`);
          }
          setShowBulkAddModal(false);
          setExcelFile(null);
          await fetchStudents();
          setTimeout(() => setSuccess(""), 5000);
        } else {
          setError(uploadResult.message || "Failed to bulk add students.");
          setBulkUploadErrors(uploadResult.data?.failedStudents?.map(fs => ({
              row: fs.originalRow + 1, // +1 for 1-based indexing in excel
              message: `${fs.studentName || 'Unknown student'}: ${fs.error}`,
              isServer: true
          })) || []);
        }
      } catch (fileReadError) {
        setError("Error reading Excel file: " + fileReadError.message);
      } finally {
        setLoading(false);
        setExcelFile(null); // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };

    reader.onerror = () => {
      setError("Failed to read file.");
      setLoading(false);
    };

    reader.readAsArrayBuffer(excelFile);
  };

  const closeBulkAddModal = () => {
    setShowBulkAddModal(false);
    setExcelFile(null);
    setBulkUploadStatus("");
    setBulkUploadProgress(0);
    setBulkUploadErrors([]);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // --- END NEW BULK ADD FUNCTIONS ---

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Students</h2>
          <p className={styles.subtitle}>
            Manage students in {classInfo?.className || "this class"}
          </p>
        </div>
        <div className={styles.actionButtons}> {/* New div for multiple buttons */}
          <Button
            variant="outline-primary" // Changed to outline for secondary action
            onClick={() => setShowBulkAddModal(true)}
            className="me-2" // Margin for separation
          >
            <CloudUpload className="me-2" />
            Bulk Add
          </Button>
          <Button
            variant="primary"
            onClick={() => setShowAddModal(true)}
            className={styles.addButton}
          >
            <PersonAdd className="me-2" />
            Add Student
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      {/* Search Bar */}
      <div className={styles.searchBar}>
        <Search className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search by name or student ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* Students List */}
      {loading && !showBulkAddModal ? ( // Only show global loading if not in bulk modal
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading students...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className={styles.empty}>
          {searchTerm ? (
            <>
              <Search style={{ fontSize: 48, color: "#ccc" }} />
              <p>No students found matching "{searchTerm}"</p>
            </>
          ) : (
            <>
              <PersonAdd style={{ fontSize: 48, color: "#ccc" }} />
              <p>No students in this class yet</p>
              <Button variant="primary" onClick={() => setShowAddModal(true)}>
                Add First Student
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className={styles.studentGrid}>
          {filteredStudents.map((student) => (
            <div key={student._id} className={styles.studentCard}>
              <div className={styles.studentInfo}>
                <h3 className={styles.studentName}>{student.name}</h3>
                <p className={styles.studentId}>ID: {student.studentId}</p>
                {student.rollNumber && (
                  <p className={styles.rollNumber}>
                    Roll #{student.rollNumber}
                  </p>
                )}
                {student.gender && (
                  <p className={styles.gender}>Gender: {student.gender}</p>
                )}
                {student.notes && (
                  <p className={styles.notes}>{student.notes}</p>
                )}
              </div>
              <div className={styles.studentActions}>
                <button
                  className={`${styles.actionBtn} ${styles.editBtn}`}
                  onClick={() => openEditModal(student)}
                  title="Edit student"
                >
                  <Edit fontSize="small" />
                </button>
                <button
                  className={`${styles.actionBtn} ${styles.deleteBtn}`}
                  onClick={() => handleDeleteStudent(student)}
                  title="Delete student"
                >
                  <Delete fontSize="small" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Student Modal (Existing) */}
      <Modal show={showAddModal} onHide={closeAddModal} size="lg">
        {/* ... (Existing Add Student Modal content) ... */}
        <Modal.Header closeButton>
          <Modal.Title>Add New Student</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddStudent}>
          <Modal.Body>
            {error && (
              <Alert variant="danger" dismissible onClose={() => setError("")}>
                {error}
              </Alert>
            )}

            <Alert variant="info" className="mb-3">
              <i className="bi bi-info-circle me-2"></i>
              Student ID will be automatically generated (Format: STU-YEAR-XXXX)
            </Alert>

            <Form.Group className="mb-3">
              <Form.Label>
                Student Name <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter full name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                autoFocus
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Roll Number (Optional)</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="e.g., 1"
                    value={formData.rollNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, rollNumber: e.target.value })
                    }
                    min="1"
                  />
                  <Form.Text className="text-muted">
                    Class roll number for attendance
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Gender (Optional)</Form.Label>
                  <Form.Select
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value })
                    }
                  >
                    <option value="">Select gender...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Notes (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Any additional information..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                maxLength={500}
              />
              <Form.Text className="text-muted">
                {formData.notes.length}/500 characters
              </Form.Text>
            </Form.Group>
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={closeAddModal}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Student"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Student Modal (Existing) */}
      <Modal show={showEditModal} onHide={closeEditModal} size="lg">
        {/* ... (Existing Edit Student Modal content) ... */}
        <Modal.Header closeButton>
          <Modal.Title>Edit Student</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditStudent}>
          <Modal.Body>
            {error && (
              <Alert variant="danger" dismissible onClose={() => setError("")}>
                {error}
              </Alert>
            )}

            {editingStudent && (
              <Alert variant="info" className="mb-3">
                <strong>Student ID:</strong> {editingStudent.studentId} (cannot
                be changed)
              </Alert>
            )}

            <Form.Group className="mb-3">
              <Form.Label>
                Student Name <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter full name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Roll Number (Optional)</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="e.g., 1"
                    value={formData.rollNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, rollNumber: e.target.value })
                    }
                    min="1"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Gender (Optional)</Form.Label>
                  <Form.Select
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value })
                    }
                  >
                    <option value="">Select gender...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Notes (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Any additional information..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                maxLength={500}
              />
              <Form.Text className="text-muted">
                {formData.notes.length}/500 characters
              </Form.Text>
            </Form.Group>
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={closeEditModal}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Student"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* NEW: Bulk Add Student Modal */}
      <Modal show={showBulkAddModal} onHide={closeBulkAddModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Bulk Add Students</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError("")}>
              {error}
            </Alert>
          )}
          {bulkUploadStatus && !error && (
            <Alert variant="info">{bulkUploadStatus}</Alert>
          )}

          <p className="mb-3">
            To bulk add students, download the template below, fill in the student
            details, and then upload the completed Excel file.
          </p>

          <Button
            variant="outline-secondary"
            onClick={downloadTemplate}
            className="mb-4"
            block
          >
            <Download className="me-2" /> Download Excel Template
          </Button>

          <Form.Group controlId="excelFile" className="mb-3">
            <Form.Label>Upload Excel File</Form.Label>
            <Form.Control
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              ref={fileInputRef}
            />
            <Form.Text className="text-muted">
              Accepted formats: .xlsx, .xls
            </Form.Text>
          </Form.Group>

          {loading && bulkUploadProgress > 0 && (
            <ProgressBar
              animated
              now={bulkUploadProgress}
              label={`${bulkUploadProgress}%`}
              className="mb-3"
            />
          )}

          {bulkUploadErrors.length > 0 && (
            <div className="mt-4">
              <h4>Errors during upload:</h4>
              <ul className="list-unstyled">
                {bulkUploadErrors.map((err, index) => (
                  <li key={index} className={err.isServer ? "text-danger" : "text-warning"}>
                    <strong>Row {err.row}:</strong> {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={closeBulkAddModal}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleBulkUpload}
            disabled={!excelFile || loading || bulkUploadErrors.some(err => !err.isServer)} // Disable if client-side errors exist
          >
            {loading ? "Uploading..." : "Upload Students"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default StudentManagementSection;