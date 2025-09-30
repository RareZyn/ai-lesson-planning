// frontend/client/src/components/AnswerChecker/StudentSelector.jsx
import React, { useState, useEffect } from "react";
import { Form, Button, Modal, Alert, Row, Col, Card } from "react-bootstrap";
import { Spin, Tag, Empty } from "antd";
import { PlusOutlined, UserOutlined } from "@ant-design/icons";
import { studentAPI, studentUtils } from "../../services/studentService";

const StudentSelector = ({ classId, selectedStudent, onStudentSelect }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state for adding new student
  const [newStudent, setNewStudent] = useState({
    name: "",
    studentId: "",
    email: "",
    rollNumber: "",
    notes: "",
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (classId) {
      fetchStudents();
    }
  }, [classId]);

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
    setFormErrors({});
    setError("");
    setSuccess("");

    // Validate form
    const validation = studentUtils.validateStudentData({
      ...newStudent,
      classId,
      grade: "Standard 1", // Will be set from class
    });

    if (!validation.isValid) {
      const errors = {};
      validation.errors.forEach((err) => {
        if (err.includes("name")) errors.name = err;
        if (err.includes("studentId")) errors.studentId = err;
        if (err.includes("email")) errors.email = err;
      });
      setFormErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const result = await studentAPI.addStudent({
        ...newStudent,
        classId,
        grade: "Standard 1", // This should be fetched from the class
      });

      if (result.success) {
        setSuccess("Student added successfully!");
        setShowAddModal(false);
        setNewStudent({
          name: "",
          studentId: "",
          email: "",
          rollNumber: "",
          notes: "",
        });
        await fetchStudents();
        // Auto-select the newly added student
        onStudentSelect(result.data._id);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Failed to add student");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setNewStudent((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div>
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

      <Form.Group className="mb-3">
        <Form.Label>
          Select Student <span className="text-danger">*</span>
        </Form.Label>

        {!classId ? (
          <Alert variant="info" className="mb-0">
            Please select a class first to view students
          </Alert>
        ) : loading ? (
          <div className="text-center py-4">
            <Spin size="large" />
            <p className="mt-2 text-muted">Loading students...</p>
          </div>
        ) : students.length === 0 ? (
          <Card className="text-center py-4">
            <Card.Body>
              <Empty
                description="No students found in this class"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
              <Button
                variant="primary"
                size="sm"
                className="mt-3"
                onClick={() => setShowAddModal(true)}
              >
                <PlusOutlined className="me-2" />
                Add First Student
              </Button>
            </Card.Body>
          </Card>
        ) : (
          <div>
            <Form.Select
              value={selectedStudent || ""}
              onChange={(e) => onStudentSelect(e.target.value)}
              className="mb-2"
            >
              <option value="">Choose a student...</option>
              {students.map((student) => (
                <option key={student._id} value={student._id}>
                  {studentUtils.formatDisplayName(student)}
                  {student.rollNumber ? ` - Roll #${student.rollNumber}` : ""}
                </option>
              ))}
            </Form.Select>

            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => setShowAddModal(true)}
            >
              <PlusOutlined className="me-2" />
              Add New Student
            </Button>
          </div>
        )}
      </Form.Group>

      {/* Selected Student Info */}
      {selectedStudent && (
        <Card className="mb-3" style={{ borderLeft: "4px solid #52c41a" }}>
          <Card.Body>
            <div className="d-flex align-items-center">
              <UserOutlined
                style={{
                  fontSize: "24px",
                  marginRight: "12px",
                  color: "#52c41a",
                }}
              />
              <div>
                <strong>
                  {students.find((s) => s._id === selectedStudent)?.name ||
                    "Unknown"}
                </strong>
                <br />
                <small className="text-muted">
                  ID:{" "}
                  {students.find((s) => s._id === selectedStudent)?.studentId ||
                    "N/A"}
                </small>
                {students.find((s) => s._id === selectedStudent)?.email && (
                  <>
                    <br />
                    <small className="text-muted">
                      Email:{" "}
                      {students.find((s) => s._id === selectedStudent)?.email}
                    </small>
                  </>
                )}
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Add Student Modal */}
      <Modal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        size="lg"
      >
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

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Student Name <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter full name"
                    value={newStudent.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    isInvalid={!!formErrors.name}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Student ID <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., STU001"
                    value={newStudent.studentId}
                    onChange={(e) =>
                      handleInputChange(
                        "studentId",
                        e.target.value.toUpperCase()
                      )
                    }
                    isInvalid={!!formErrors.studentId}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.studentId}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Unique identifier for the student
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email (Optional)</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="student@example.com"
                    value={newStudent.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    isInvalid={!!formErrors.email}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.email}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Roll Number (Optional)</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="e.g., 1"
                    value={newStudent.rollNumber}
                    onChange={(e) =>
                      handleInputChange("rollNumber", e.target.value)
                    }
                    min="1"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Notes (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Any additional information..."
                value={newStudent.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                maxLength={500}
              />
              <Form.Text className="text-muted">
                {newStudent.notes.length}/500 characters
              </Form.Text>
            </Form.Group>

            <Alert variant="info" className="mb-0">
              <i className="bi bi-info-circle me-2"></i>
              The student will be added to the selected class with active
              status.
            </Alert>
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowAddModal(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Spin size="small" className="me-2" />
                  Adding...
                </>
              ) : (
                <>
                  <PlusOutlined className="me-2" />
                  Add Student
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default StudentSelector;
