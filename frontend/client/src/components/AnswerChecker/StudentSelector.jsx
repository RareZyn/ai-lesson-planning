// frontend/client/src/components/AnswerChecker/StudentSelector.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Form, Button, Modal, Alert, Row, Col, Card, Badge } from "react-bootstrap";
import { Spin, Empty } from "antd";
import { PlusOutlined, UserOutlined } from "@ant-design/icons";
import { studentAPI } from "../../services/studentService";
import { submissionService } from "../../services/submissionService";

const StudentSelector = ({ classId, selectedStudent, onStudentSelect, assessmentId = null }) => {
  const [students, setStudents] = useState([]);
  const [submittedStudentIds, setSubmittedStudentIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Simplified form state - only name is required
  const [newStudent, setNewStudent] = useState({
    name: "",
    rollNumber: "",
    gender: "",
    notes: "",
  });

  const [formErrors, setFormErrors] = useState({});

  const fetchSubmittedStudents = useCallback(async () => {
    if (!assessmentId) {
      setSubmittedStudentIds([]);
      return;
    }

    try {
      const result = await submissionService.getSubmissionsByAssessment(assessmentId);
      if (result.success) {
        // Extract student IDs from submissions
        const submittedIds = result.data
          .map((submission) => submission.studentId?._id || submission.studentId)
          .filter(Boolean);
        setSubmittedStudentIds(submittedIds);
      }
    } catch (err) {
      console.error("Failed to fetch submitted students:", err);
    }
  }, [assessmentId]);

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
      fetchSubmittedStudents();
    }
  }, [classId, fetchStudents, fetchSubmittedStudents]);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setError("");
    setSuccess("");

    // Simple validation - only name is required
    if (!newStudent.name.trim()) {
      setFormErrors({ name: "Student name is required" });
      return;
    }

    setLoading(true);

    try {
      const result = await studentAPI.addStudent({
        name: newStudent.name.trim(),
        classId,
        rollNumber: newStudent.rollNumber || undefined,
        gender: newStudent.gender || undefined,
        notes: newStudent.notes.trim() || "",
      });

      if (result.success) {
        setSuccess(`Student added successfully! ID: ${result.data.studentId}`);
        setShowAddModal(false);
        setNewStudent({
          name: "",
          rollNumber: "",
          gender: "",
          notes: "",
        });
        await fetchStudents();
        await fetchSubmittedStudents(); // Refresh submitted students list
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
        <div className="d-flex justify-content-between align-items-center mb-2">
          <Form.Label className="mb-0">
            Select Student <span className="text-danger">*</span>
          </Form.Label>
          {assessmentId && students.length > 0 && (
            <div className="d-flex gap-2">
              <Badge bg="success">
                {students.filter(s => !submittedStudentIds.includes(s._id)).length} Not Submitted
              </Badge>
              <Badge bg="secondary">
                {submittedStudentIds.length} Already Submitted
              </Badge>
            </div>
          )}
        </div>

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
        ) : students.filter(s => !submittedStudentIds.includes(s._id)).length === 0 ? (
          <Alert variant="warning" className="mb-2">
            <i className="bi bi-check-circle me-2"></i>
            All students in this class have already submitted for this assessment.
          </Alert>
        ) : (
          <div>
            <Form.Select
              value={selectedStudent || ""}
              onChange={(e) => onStudentSelect(e.target.value)}
              className="mb-2"
            >
              <option value="">Choose a student...</option>
              {students
                .filter((student) => !submittedStudentIds.includes(student._id))
                .map((student) => (
                  <option key={student._id} value={student._id}>
                    {student.name} ({student.studentId})
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
        centered
        scrollable
      >
        <Form onSubmit={handleAddStudent}>
          <Modal.Header closeButton>
            <Modal.Title>Add New Student</Modal.Title>
          </Modal.Header>

          <Modal.Body style={{ maxHeight: "60vh", overflowY: "auto" }}>
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
                value={newStudent.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                isInvalid={!!formErrors.name}
                required
                autoFocus
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.name}
              </Form.Control.Feedback>
            </Form.Group>

            <Row>
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
                  <Form.Text className="text-muted">
                    Class roll number for attendance
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Gender (Optional)</Form.Label>
                  <Form.Select
                    value={newStudent.gender}
                    onChange={(e) =>
                      handleInputChange("gender", e.target.value)
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
                placeholder="Any additional information about the student..."
                value={newStudent.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                maxLength={500}
              />
              <Form.Text className="text-muted">
                {newStudent.notes.length}/500 characters
              </Form.Text>
            </Form.Group>

            <Alert variant="success" className="mb-0">
              <i className="bi bi-check-circle me-2"></i>
              The student will be added to the selected class with active
              status. Grade will be automatically set from the class.
            </Alert>
          </Modal.Body>

          <Modal.Footer className="d-flex justify-content-end border-top">
            <Button
              variant="secondary"
              onClick={() => {
                setShowAddModal(false);
                setError("");
                setNewStudent({
                  name: "",
                  rollNumber: "",
                  gender: "",
                  notes: "",
                });
                setFormErrors({});
              }}
              disabled={loading}
              className="me-2"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={loading}
              style={{ minWidth: "120px" }}
            >
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
