// frontend/client/src/pages/answerChecker/SubmissionReviewPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Card, Button, Badge, Alert, Form, Modal } from "react-bootstrap";
import { Image, Tag, Spin, InputNumber, Input, Modal as AntModal } from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  EditOutlined,
  SaveOutlined,
  ReloadOutlined,
  FlagOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { submissionService } from "../../services/submissionService";
import {
  gradingService,
  manualEditService,
  gradingUtils,
} from "../../services/gradingServiceClient";
import { reviewService } from "../../services/reviewServiceClient";

const { TextArea } = Input;

const SubmissionReviewPage = () => {
  const { assessmentId, submissionId, id } = useParams();
  const { assessmentId, submissionId, id } = useParams();
  const navigate = useNavigate();

  // Use submissionId from new route structure, fallback to id for backward compatibility
  const actualSubmissionId = submissionId || id;

  // State
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [grading, setGrading] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // Edit states
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editedText, setEditedText] = useState("");
  const [editedScore, setEditedScore] = useState(null);
  const [adjustmentReason, setAdjustmentReason] = useState("");

  // Modal states
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewComments, setReviewComments] = useState("");

  const fetchSubmission = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await submissionService.getSubmissionById(
        actualSubmissionId
      );

      if (result.success) {
        setSubmission(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Failed to load submission");
    } finally {
      setLoading(false);
    }
  }, [actualSubmissionId]);

  useEffect(() => {
    fetchSubmission();
  }, [fetchSubmission]);

  const handleStartGrading = async () => {
    setGrading(true);
    setError("");

    try {
      const result = await gradingService.scoreSubmission(actualSubmissionId);

      if (result.success) {
        await fetchSubmission();
        AntModal.success({
          title: "Success",
          content: "Grading completed successfully!",
        });
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Failed to grade submission");
    } finally {
      setGrading(false);
    }
  };

  const handleEditText = (answer) => {
    setEditingQuestion(answer.questionNumber);
    setEditedText(
      answer.isEdited && answer.editedText
        ? answer.editedText
        : answer.ocrData?.extractedText || ""
    );
  };

  const handleSaveText = async () => {
    if (!editingQuestion) return;

    setSavingEdit(true);
    try {
      const result = await manualEditService.editText(
        actualSubmissionId,
        editingQuestion,
        {
          editedText,
          autoRegrade: true,
        }
      );

      if (result.success) {
        await fetchSubmission();
        setEditingQuestion(null);
        AntModal.success({
          title: "Success",
          content: "Text updated and answer re-graded!",
        });
      } else {
        AntModal.error({
          title: "Error",
          content: result.message,
        });
      }
    } catch (err) {
      AntModal.error({
        title: "Error",
        content: "Failed to save edit",
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingQuestion(null);
    setEditedText("");
  };

  const handleOpenScoreModal = (answer) => {
    setEditingQuestion(answer.questionNumber);
    setEditedScore(
      answer.grading?.finalScore || answer.grading?.aiScore?.score || 0
    );
    setAdjustmentReason("");
    setShowScoreModal(true);
  };

  const handleSaveScore = async () => {
    if (!editingQuestion || editedScore === null) return;

    try {
      const result = await manualEditService.adjustScore(
        actualSubmissionId,
        editingQuestion,
        {
          newScore: editedScore,
          adjustmentReason: adjustmentReason || "Manual adjustment",
        }
      );

      if (result.success) {
        await fetchSubmission();
        setShowScoreModal(false);
        setEditingQuestion(null);
        AntModal.success({
          title: "Success",
          content: "Score adjusted successfully!",
        });
      } else {
        AntModal.error({
          title: "Error",
          content: result.message,
        });
      }
    } catch (err) {
      AntModal.error({
        title: "Error",
        content: "Failed to adjust score",
      });
    }
  };

  const handleMarkAsReviewed = async () => {
    try {
      const result = await reviewService.markAsReviewed(actualSubmissionId, {
        comments: reviewComments,
        approved: true,
      });

      if (result.success) {
        await fetchSubmission();
        setShowReviewModal(false);
        AntModal.success({
          title: "Success",
          content: "Submission marked as reviewed!",
        });
      } else {
        AntModal.error({
          title: "Error",
          content: result.message,
        });
      }
    } catch (err) {
      AntModal.error({
        title: "Error",
        content: "Failed to mark as reviewed",
      });
    }
  };

  const handleFlagForRegrade = async () => {
    AntModal.confirm({
      title: "Flag for Regrade",
      icon: <ExclamationCircleOutlined />,
      content: "Are you sure you want to flag this submission for regrade?",
      okText: "Flag",
      okType: "primary",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          const result = await reviewService.flagForRegrade(
            actualSubmissionId,
            {
              reason: "Flagged for regrade",
            }
          );

          if (result.success) {
            await fetchSubmission();
            AntModal.success({
              title: "Success",
              content: "Submission flagged for regrade!",
            });
          } else {
            AntModal.error({
              title: "Error",
              content: result.message,
            });
          }
        } catch (err) {
          AntModal.error({
            title: "Error",
            content: "Failed to flag submission",
          });
        }
      },
    });
  };

  const getConfidenceBadge = (confidence) => {
    if (confidence >= 0.8) {
      return (
        <Badge bg="success">High ({(confidence * 100).toFixed(0)}%)</Badge>
      );
    } else if (confidence >= 0.6) {
      return (
        <Badge bg="warning">Medium ({(confidence * 100).toFixed(0)}%)</Badge>
      );
    } else {
      return <Badge bg="danger">Low ({(confidence * 100).toFixed(0)}%)</Badge>;
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending_ocr: "secondary",
      ocr_completed: "info",
      pending_grading: "info",
      graded: "success",
      reviewed: "success",
    };
    return (
      <Badge bg={colors[status] || "secondary"}>
        {status.replace(/_/g, " ")}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spin size="large" />
        <p className="mt-3 text-muted">Loading submission...</p>
      </div>
    );
  }

  if (!submission) {
    return (
      <Alert variant="danger">
        Submission not found or you don't have permission to view it.
      </Alert>
    );
  }

  return (
    <div className="container-fluid">
      {/* Header */}
      <Card className="mb-4" style={{ borderLeft: "4px solid #1890ff" }}>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <Button
                variant="link"
                className="p-0 mb-2"
                onClick={() =>
                  navigate(
                    assessmentId
                      ? `/app/submissions/${assessmentId}`
                      : "/app/submissions"
                  )
                }
              >
                <ArrowLeftOutlined className="me-2" />
                Back to Submissions
              </Button>
              <h2 className="mb-2">Review Submission</h2>
              <div className="d-flex gap-3 flex-wrap">
                <div>
                  <small className="text-muted">Student:</small>
                  <br />
                  <strong>{submission.studentId?.name}</strong> (
                  {submission.studentId?.studentId})
                </div>
                <div>
                  <small className="text-muted">Assessment:</small>
                  <br />
                  <strong>{submission.assessmentId?.title}</strong>
                </div>
                <div>
                  <small className="text-muted">Status:</small>
                  <br />
                  {getStatusBadge(submission.processingStatus)}
                </div>
              </div>
            </div>

            <div className="d-flex gap-2">
              {submission.processingStatus === "ocr_completed" && (
                <Button
                  variant="primary"
                  onClick={handleStartGrading}
                  disabled={grading}
                >
                  {grading ? (
                    <>
                      <Spin size="small" className="me-2" />
                      Grading...
                    </>
                  ) : (
                    <>
                      <CheckCircleOutlined className="me-2" />
                      Start Grading
                    </>
                  )}
                </Button>
              )}

              {submission.processingStatus === "completed" && (
                <>
                  <Button
                    variant="success"
                    onClick={() => setShowReviewModal(true)}
                  >
                    <CheckCircleOutlined className="me-2" />
                    Mark as Reviewed
                  </Button>
                  <Button variant="warning" onClick={handleFlagForRegrade}>
                    <FlagOutlined className="me-2" />
                    Flag for Regrade
                  </Button>
                </>
              )}

              <Button variant="outline-secondary" onClick={fetchSubmission}>
                <ReloadOutlined />
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Overall Stats */}
      {submission.processingStatus === "completed" && (
        <Card className="mb-4">
          <Card.Body>
            <h5 className="mb-3">Overall Performance</h5>
            <div className="row">
              <div className="col-md-3">
                <small className="text-muted">Total Score</small>
                <h3 className="mb-0">
                  {submission.overallStats?.totalScore || 0}/
                  {submission.overallStats?.maxPossibleScore || 0}
                </h3>
              </div>
              <div className="col-md-3">
                <small className="text-muted">Percentage</small>
                <h3 className="mb-0">
                  <Badge
                    bg={gradingUtils.getScoreColor(
                      submission.overallStats?.percentage || 0
                    )}
                  >
                    {submission.overallStats?.percentage?.toFixed(1) || 0}%
                  </Badge>
                </h3>
              </div>
              <div className="col-md-3">
                <small className="text-muted">Questions Attempted</small>
                <h3 className="mb-0">
                  {submission.overallStats?.questionsAttempted || 0}/
                  {submission.overallStats?.totalQuestions || 0}
                </h3>
              </div>
              <div className="col-md-3">
                <small className="text-muted">Avg. OCR Confidence</small>
                <h3 className="mb-0">
                  {getConfidenceBadge(
                    submission.overallStats?.averageConfidence || 0
                  )}
                </h3>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Answers */}
      <h5 className="mb-3">Student Answers</h5>

      {submission.answers.map((answer, index) => (
        <Card key={index} className="mb-4">
          <Card.Body>
            <div className="row">
              {/* Question Image */}
              <div className="col-md-4">
                <h6 className="mb-3">
                  Question {answer.questionNumber}{" "}
                  {getStatusBadge(answer.status)}
                </h6>
                {answer.originalImage && (
                  <Image
                    src={answer.originalImage}
                    alt={`Question ${answer.questionNumber}`}
                    style={{
                      width: "100%",
                      maxHeight: "300px",
                      objectFit: "contain",
                      borderRadius: "8px",
                      border: "1px solid #ddd",
                    }}
                  />
                )}
              </div>

              {/* Extracted Text & Editing */}
              <div className="col-md-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0">Extracted Text</h6>
                  {answer.ocrData?.confidence !== undefined && (
                    <span>{getConfidenceBadge(answer.ocrData.confidence)}</span>
                  )}
                </div>

                {editingQuestion === answer.questionNumber ? (
                  <div>
                    <TextArea
                      rows={6}
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      placeholder="Edit extracted text..."
                    />
                    <div className="d-flex gap-2 mt-2">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={handleSaveText}
                        disabled={savingEdit}
                      >
                        <SaveOutlined className="me-1" />
                        Save & Regrade
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleCancelEdit}
                        disabled={savingEdit}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div
                      className="p-3"
                      style={{
                        background: "#f8f9fa",
                        border: "1px solid #dee2e6",
                        borderRadius: "6px",
                        minHeight: "120px",
                        maxHeight: "200px",
                        overflowY: "auto",
                      }}
                    >
                      <pre style={{ margin: 0, fontFamily: "inherit" }}>
                        {answer.isEdited && answer.editedText
                          ? answer.editedText
                          : answer.ocrData?.extractedText ||
                            "No text extracted"}
                      </pre>
                    </div>
                    {answer.isEdited && (
                      <small className="text-warning">
                        <EditOutlined className="me-1" />
                        Manually edited
                      </small>
                    )}
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="mt-2"
                      onClick={() => handleEditText(answer)}
                    >
                      <EditOutlined className="me-1" />
                      Edit Text
                    </Button>
                  </div>
                )}
              </div>

              {/* Grading Results */}
              <div className="col-md-4">
                <h6 className="mb-3">Grading Results</h6>

                {answer.grading && answer.grading.aiScore ? (
                  <div>
                    <div className="mb-3">
                      <small className="text-muted">Score:</small>
                      <h4>
                        {answer.grading.finalScore !== undefined
                          ? answer.grading.finalScore
                          : answer.grading.aiScore.score}
                        /{answer.grading.aiScore.maxScore}
                        <Badge
                          bg={gradingUtils.getScoreColor(
                            answer.grading.aiScore.percentage
                          )}
                          className="ms-2"
                        >
                          {answer.grading.aiScore.percentage?.toFixed(0)}%
                        </Badge>
                      </h4>
                      {answer.grading.isManuallyAdjusted && (
                        <small className="text-warning">
                          <EditOutlined className="me-1" />
                          Manually adjusted
                        </small>
                      )}
                    </div>

                    {answer.grading.aiScore.feedback && (
                      <div className="mb-3">
                        <small className="text-muted">Feedback:</small>
                        <p
                          className="small"
                          style={{
                            background: "#e8f4fd",
                            padding: "10px",
                            borderRadius: "6px",
                          }}
                        >
                          {answer.grading.aiScore.feedback}
                        </p>
                      </div>
                    )}

                    {answer.grading.comparisonMetadata && (
                      <div className="mb-3">
                        <small className="text-muted">Analysis:</small>
                        <div className="mt-1">
                          {answer.grading.comparisonMetadata.keyPointsMatched
                            ?.length > 0 && (
                            <div className="mb-2">
                              <small className="text-success">
                                ✓ Key Points Matched:
                              </small>
                              <div className="d-flex flex-wrap gap-1 mt-1">
                                {answer.grading.comparisonMetadata.keyPointsMatched.map(
                                  (point, idx) => (
                                    <Tag key={idx} color="success">
                                      {point}
                                    </Tag>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                          {answer.grading.comparisonMetadata.keyPointsMissed
                            ?.length > 0 && (
                            <div>
                              <small className="text-danger">
                                ✗ Key Points Missed:
                              </small>
                              <div className="d-flex flex-wrap gap-1 mt-1">
                                {answer.grading.comparisonMetadata.keyPointsMissed.map(
                                  (point, idx) => (
                                    <Tag key={idx} color="error">
                                      {point}
                                    </Tag>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <Button
                      variant="outline-warning"
                      size="sm"
                      onClick={() => handleOpenScoreModal(answer)}
                    >
                      <EditOutlined className="me-1" />
                      Adjust Score
                    </Button>
                  </div>
                ) : (
                  <div className="text-muted text-center py-4">
                    {answer.status === "pending_ocr" ? (
                      <div>
                        <Spin />
                        <p className="mt-2">Processing OCR...</p>
                      </div>
                    ) : answer.status === "ocr_completed" ? (
                      <p>Click "Start Grading" to grade this answer</p>
                    ) : (
                      <p>Not yet graded</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card.Body>
        </Card>
      ))}

      {/* Score Adjustment Modal */}
      <Modal show={showScoreModal} onHide={() => setShowScoreModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Adjust Score - Question {editingQuestion}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>New Score</Form.Label>
              <InputNumber
                min={0}
                max={
                  submission.answers.find(
                    (a) => a.questionNumber === editingQuestion
                  )?.grading?.aiScore?.maxScore || 100
                }
                value={editedScore}
                onChange={setEditedScore}
                style={{ width: "100%" }}
              />
              <Form.Text className="text-muted">
                Max Score:{" "}
                {submission.answers.find(
                  (a) => a.questionNumber === editingQuestion
                )?.grading?.aiScore?.maxScore || "N/A"}
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Reason for Adjustment (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                placeholder="Explain why you adjusted the score..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowScoreModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveScore}>
            <SaveOutlined className="me-2" />
            Save Score
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Review Confirmation Modal */}
      <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Mark as Reviewed</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            Marking this submission as reviewed will indicate that you have
            verified the OCR extraction and grading results.
          </Alert>

          <Form>
            <Form.Group>
              <Form.Label>Comments (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                placeholder="Add any comments about this submission..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReviewModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleMarkAsReviewed}>
            <CheckCircleOutlined className="me-2" />
            Mark as Reviewed
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default SubmissionReviewPage;
