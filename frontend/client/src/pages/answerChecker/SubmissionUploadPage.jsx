// frontend/client/src/pages/answerChecker/SubmissionUploadPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Card, Button, Form, Alert, ProgressBar, Badge } from "react-bootstrap";
import { Steps, message, Spin } from "antd";
import {
  UploadOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import StudentSelector from "../../components/AnswerChecker/StudentSelector";
import AssessmentSelector from "../../components/AnswerChecker/AssessmentSelector";
import ImageUploader from "../../components/AnswerChecker/ImageUploader";
import SpmAnswerSheetUploader from "../../components/AnswerChecker/SpmAnswerSheetUploader";
import BulkAnswerUploader from "../../components/AnswerChecker/BulkAnswerUploader";
import { submissionService } from "../../services/submissionService";
import { ocrAPI } from "../../services/ocrService";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL;

const SubmissionUploadPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get pre-selected assessment from navigation state
  const preSelectedAssessmentId = location.state?.assessmentId;
  const preSelectedClassId = location.state?.classId;
  const preSelectedAssessmentTitle = location.state?.assessmentTitle;

  // Step management - start at step 1 if assessment is pre-selected
  const [currentStep, setCurrentStep] = useState(
    preSelectedAssessmentId ? 1 : 0
  );

  // Form data - Initialize with pre-selected values
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(
    preSelectedClassId || null
  );
  const [selectedAssessment, setSelectedAssessment] = useState(
    preSelectedAssessmentId || null
  );
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [assessmentDetails, setAssessmentDetails] = useState(null);
  const [images, setImages] = useState({});
  const [uploadMode, setUploadMode] = useState("individual"); // "individual" or "bulk"
  const [bulkFiles, setBulkFiles] = useState([]);

  // UI states
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [initializingPreSelected, setInitializingPreSelected] = useState(
    !!preSelectedAssessmentId
  );

  const fetchClasses = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(`${API_BASE_URL}/classes`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setClasses(response.data.data);
    } catch (err) {
      message.error("Failed to load classes");
    }
  }, []);

  const fetchAssessmentDetails = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(
        `${API_BASE_URL}/assessment/${selectedAssessment}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      const assessment = response.data.data;
      setAssessmentDetails(assessment);

      // If class wasn't pre-selected but assessment has classId, use it
      if (!selectedClass && assessment.classId) {
        const classId =
          typeof assessment.classId === "string"
            ? assessment.classId
            : assessment.classId._id;
        setSelectedClass(classId);
      }

      // Initialize image slots based on question count
      // For SPM exams, prioritize examContent.totalQuestions (40 questions for Paper 1)
      let questionCount;
      if (assessment.activityType === "spm-exam") {
        questionCount =
          assessment.generatedContent?.examContent?.totalQuestions ||
          assessment.questionCount ||
          40; // Default to 40 for SPM Paper 1
      } else {
        questionCount =
          assessment.questionCount ||
          assessment.generatedContent?.assessmentContent?.questions?.length ||
          1;
      }

      const imageSlots = {};
      for (let i = 1; i <= questionCount; i++) {
        imageSlots[i] = null;
      }
      setImages(imageSlots);
    } catch (err) {
      message.error("Failed to load assessment details");
    } finally {
      setLoading(false);
      setInitializingPreSelected(false);
    }
  }, [selectedAssessment, selectedClass]);

  // Fetch classes on mount
  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // Fetch assessment details when assessment is selected
  useEffect(() => {
    if (selectedAssessment) {
      fetchAssessmentDetails();
    }
  }, [selectedAssessment, fetchAssessmentDetails]);

  const handleImageChange = (questionNumber, base64Image) => {
    setImages((prev) => ({
      ...prev,
      [questionNumber]: base64Image,
    }));
  };

  const validateStep = () => {
    setError("");

    if (currentStep === 0) {
      if (!selectedClass) {
        setError("Please select a class");
        return false;
      }
      if (!selectedAssessment) {
        setError("Please select an assessment");
        return false;
      }
      return true;
    }

    if (currentStep === 1) {
      if (!selectedStudent) {
        setError("Please select a student");
        return false;
      }
      return true;
    }

    if (currentStep === 2) {
      if (uploadMode === "bulk") {
        if (bulkFiles.length === 0) {
          setError("Please upload at least one file");
          return false;
        }
      } else {
        const uploadedImages = Object.values(images).filter(
          (img) => img !== null
        );
        if (uploadedImages.length === 0) {
          setError("Please upload at least one answer image");
          return false;
        }
      }
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevious = () => {
    // If assessment is pre-selected and we're on step 1, go back to assessment page
    if (preSelectedAssessmentId && currentStep === 1) {
      navigate(`/app/submissions/${preSelectedAssessmentId}`);
      return;
    }
    setCurrentStep(currentStep - 1);
    setError("");
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setSubmitting(true);
    setUploadProgress(0);

    try {
      let submissionData;

      if (uploadMode === "bulk") {
        // Prepare bulk submission with files
        submissionData = {
          assessmentId: selectedAssessment,
          lessonPlanId: assessmentDetails.lessonPlanId || null,
          classId: selectedClass,
          studentId: selectedStudent,
          submissionMethod: "upload_bulk",
          files: bulkFiles.map((file, index) => ({
            fileName: file.name,
            fileType: file.type,
            fileData: file.base64,
            fileIndex: index + 1,
          })),
        };
      } else {
        // Prepare individual answers array
        const answers = Object.entries(images)
          .filter(([_, image]) => image !== null)
          .map(([questionNumber, image]) => ({
            questionNumber: parseInt(questionNumber),
            questionText: `Question ${questionNumber}`,
            originalImage: image,
          }));

        submissionData = {
          assessmentId: selectedAssessment,
          lessonPlanId: assessmentDetails.lessonPlanId || null,
          classId: selectedClass,
          studentId: selectedStudent,
          submissionMethod: "upload_image",
          answers,
        };
      }

      setUploadProgress(30);

      // Submit to backend
      const result = await submissionService.submitAnswer(submissionData);

      if (result.success) {
        setUploadProgress(60);

        // Trigger OCR processing
        message.success("Submission created! Starting OCR processing...");

        const ocrResult = await ocrAPI.processSubmissionOCR(
          result.submissionId
        );

        setUploadProgress(100);

        if (ocrResult.success) {
          message.success("OCR processing completed successfully!");

          // Navigate to review page
          setTimeout(() => {
            navigate(
              `/app/submissions/${selectedAssessment}/${result.submissionId}`
            );
          }, 1000);
        } else {
          message.warning(
            "Submission created but OCR processing encountered issues. You can review it manually."
          );
          setTimeout(() => {
            navigate(
              `/app/submissions/${selectedAssessment}/${result.submissionId}`
            );
          }, 2000);
        }
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      setError(err.message || "Failed to submit answers");
      message.error("Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    {
      title: "Select Assessment",
      icon: <FileTextOutlined />,
    },
    {
      title: "Select Student",
      icon: <FileTextOutlined />,
    },
    {
      title: "Upload Answers",
      icon: <UploadOutlined />,
    },
  ];

  const getUploadedCount = () => {
    return Object.values(images).filter((img) => img !== null).length;
  };

  const getTotalQuestions = () => {
    return Object.keys(images).length;
  };

  return (
    <div className="container-fluid">
      {/* Header */}
      <Card className="mb-4" style={{ borderLeft: "4px solid #1890ff" }}>
        <Card.Body>
          <h2 className="mb-2">
            <UploadOutlined className="me-2" />
            Submit Student Answers
          </h2>
          <p className="text-muted mb-0">
            Upload handwritten student answers for AI-powered grading and review
          </p>
          {preSelectedAssessmentId && (
            <Alert variant="info" className="mt-3 mb-0">
              <strong>Assessment:</strong>{" "}
              {assessmentDetails?.title ||
                preSelectedAssessmentTitle ||
                "Loading..."}
              {assessmentDetails?.activityType && (
                <>
                  <br />
                  <strong>Type:</strong>{" "}
                  <Badge bg="primary" className="ms-2">
                    {assessmentDetails.activityType
                      ?.toUpperCase()
                      .replace(/-/g, " ")}
                  </Badge>
                </>
              )}
            </Alert>
          )}
        </Card.Body>
      </Card>

      {/* Progress Steps */}
      <Card className="mb-4">
        <Card.Body>
          <Steps current={currentStep} items={steps} />
        </Card.Body>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Step Content */}
      <Card>
        <Card.Body>
          {/* STEP 0: Select Class & Assessment */}
          {currentStep === 0 && (
            <div>
              <h4 className="mb-4">Step 1: Select Class and Assessment</h4>

              <Form.Group className="mb-3">
                <Form.Label>
                  Select Class <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  value={selectedClass || ""}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    setSelectedAssessment(null);
                    setAssessmentDetails(null);
                  }}
                >
                  <option value="">Choose a class...</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.className} - {cls.grade} ({cls.subject})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <AssessmentSelector
                classId={selectedClass}
                selectedAssessment={selectedAssessment}
                onAssessmentSelect={setSelectedAssessment}
              />
            </div>
          )}

          {/* STEP 1: Select Student */}
          {currentStep === 1 && (
            <div>
              <h4 className="mb-4">Step 2: Select Student</h4>

              {initializingPreSelected || loading ? (
                <div className="text-center py-5">
                  <Spin size="large" />
                  <p className="mt-3 text-muted">
                    Loading assessment details...
                  </p>
                </div>
              ) : (
                <StudentSelector
                  classId={selectedClass}
                  selectedStudent={selectedStudent}
                  onStudentSelect={setSelectedStudent}
                  assessmentId={selectedAssessment}
                />
              )}
            </div>
          )}

          {/* STEP 2: Upload Images */}
          {currentStep === 2 && (
            <div>
              {/* Upload Mode Selection */}
              {assessmentDetails?.activityType !== "spm-exam" && (
                <div className="mb-4">
                  <h5 className="mb-3">Choose Upload Method</h5>
                  <div className="d-flex gap-3">
                    <Button
                      variant={uploadMode === "individual" ? "primary" : "outline-primary"}
                      onClick={() => setUploadMode("individual")}
                      disabled={submitting}
                    >
                      Individual Questions
                    </Button>
                    <Button
                      variant={uploadMode === "bulk" ? "primary" : "outline-primary"}
                      onClick={() => setUploadMode("bulk")}
                      disabled={submitting}
                    >
                      Bulk Upload (Images/PDF)
                    </Button>
                  </div>
                  <Alert variant="info" className="mt-3 mb-0">
                    <small>
                      {uploadMode === "individual"
                        ? "Upload one image per question. Best for structured answer sheets."
                        : "Upload multiple images or PDF files at once. The system will process all pages/images together."}
                    </small>
                  </Alert>
                </div>
              )}

              {/* SPM Paper 1 - Single Answer Sheet Upload */}
              {assessmentDetails?.activityType === "spm-exam" ? (
                <div>
                  <h4 className="mb-4">
                    Step 3: Upload SPM Paper 1 Answer Sheet
                  </h4>

                  <Alert variant="info" className="mb-4">
                    <i className="bi bi-info-circle me-2"></i>
                    For SPM Paper 1, upload{" "}
                    <strong>ONE answer sheet image</strong> containing all 40
                    answers. The system will automatically detect and grade all
                    questions.
                  </Alert>

                  <SpmAnswerSheetUploader
                    assessmentId={selectedAssessment}
                    classId={selectedClass}
                    studentId={selectedStudent}
                    studentName={
                      classes
                        .find((c) => c._id === selectedClass)
                        ?.students?.find((s) => s._id === selectedStudent)
                        ?.name || "Student"
                    }
                    onUploadComplete={(results) => {
                      message.success("Answer sheet processed successfully!");
                      // Navigate to review page after a short delay
                      setTimeout(() => {
                        navigate(
                          `/app/submissions/${selectedAssessment}/${results.submissionId}`
                        );
                      }, 1500);
                    }}
                    disabled={submitting}
                  />
                </div>
              ) : uploadMode === "bulk" ? (
                /* Bulk Upload Mode */
                <div>
                  <h4 className="mb-4">Step 3: Bulk Upload Answer Files</h4>

                  <BulkAnswerUploader
                    onFilesChange={setBulkFiles}
                    disabled={submitting}
                  />
                </div>
              ) : (
                /* Regular Assessment - Individual Question Upload */
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="mb-0">Step 3: Upload Answer Images</h4>
                    <Badge
                      bg={
                        getUploadedCount() === getTotalQuestions()
                          ? "success"
                          : "warning"
                      }
                    >
                      {getUploadedCount()} / {getTotalQuestions()} Uploaded
                    </Badge>
                  </div>

                  <Alert variant="info" className="mb-4">
                    <i className="bi bi-info-circle me-2"></i>
                    Upload a clear image for each question. Ensure handwriting
                    is legible and the image is well-lit without shadows.
                  </Alert>

                  {Object.keys(images).map((questionNumber) => (
                    <ImageUploader
                      key={questionNumber}
                      questionNumber={parseInt(questionNumber)}
                      questionText={`Answer for Question ${questionNumber}`}
                      onImageChange={handleImageChange}
                      initialImage={images[questionNumber]}
                      disabled={submitting}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Submission Progress */}
          {submitting && (
            <div className="mt-4">
              <Alert variant="info">
                <LoadingOutlined className="me-2" />
                Processing submission... Please wait.
              </Alert>
              <ProgressBar
                now={uploadProgress}
                label={`${uploadProgress}%`}
                animated
                striped
              />
            </div>
          )}

          {/* Navigation Buttons */}
          {/* Hide submit button for SPM exams - the SpmAnswerSheetUploader handles submission */}
          {!(
            currentStep === 2 && assessmentDetails?.activityType === "spm-exam"
          ) && (
            <div className="d-flex justify-content-between mt-4">
              <Button
                variant="secondary"
                onClick={handlePrevious}
                disabled={
                  (currentStep === 0 ||
                    (preSelectedAssessmentId && currentStep === 1)) &&
                  !submitting
                    ? false
                    : submitting
                }
              >
                {preSelectedAssessmentId && currentStep === 1
                  ? "Back to Assessment"
                  : "Previous"}
              </Button>

              <div>
                {currentStep < 2 ? (
                  <Button
                    variant="primary"
                    onClick={handleNext}
                    disabled={submitting}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    variant="success"
                    onClick={handleSubmit}
                    disabled={
                      submitting ||
                      (uploadMode === "bulk"
                        ? bulkFiles.length === 0
                        : getUploadedCount() === 0)
                    }
                  >
                    {submitting ? (
                      <>
                        <LoadingOutlined className="me-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircleOutlined className="me-2" />
                        Submit Answers
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Back button for SPM exams */}
          {currentStep === 2 &&
            assessmentDetails?.activityType === "spm-exam" && (
              <div className="d-flex justify-content-start mt-4">
                <Button
                  variant="secondary"
                  onClick={handlePrevious}
                  disabled={submitting}
                >
                  Back to Student Selection
                </Button>
              </div>
            )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default SubmissionUploadPage;
