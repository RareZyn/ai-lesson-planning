// frontend/client/src/pages/class/StudentManagementSection.jsx
import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Alert } from "react-bootstrap";
import { Modal as AntModal } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { studentAPI } from "../../services/studentService";
import { PersonAdd, Edit, Delete, Search } from "@mui/icons-material";
import styles from "./StudentManagementSection.module.css";

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

  // Form state
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
        student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStudents(filtered);
  }, [searchTerm, students]);

  const fetchStudents = async () => {
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
  };

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
      title: 'Delete Student',
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to delete ${student.name} (${student.studentId})? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Students</h2>
          <p className={styles.subtitle}>
            Manage students in {classInfo?.className || "this class"}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowAddModal(true)}
          className={styles.addButton}
        >
          <PersonAdd className="me-2" />
          Add Student
        </Button>
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
      {loading ? (
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
                  <p className={styles.gender}>
                    Gender: {student.gender}
                  </p>
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

      {/* Add Student Modal */}
      <Modal show={showAddModal} onHide={closeAddModal} size="lg">
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

      {/* Edit Student Modal */}
      <Modal show={showEditModal} onHide={closeEditModal} size="lg">
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
    </div>
  );
};

export default StudentManagementSection;
