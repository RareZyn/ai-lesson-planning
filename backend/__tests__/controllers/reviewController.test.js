/**
 * Unit Tests for Review Controller
 * Tests submission review and flagging operations
 */

const { createMockRequest, createMockResponse, createMockNext } = require('../mocks/req-res');

// Mock dependencies
jest.mock('../../model/StudentAnswer');
jest.mock('../../model/Student');

const StudentAnswer = require('../../model/StudentAnswer');
const Student = require('../../model/Student');

const reviewController = require('../../controller/reviewController');

describe('Review Controller', () => {
    let req, res, next;

    beforeEach(() => {
        req = createMockRequest();
        res = createMockResponse();
        next = createMockNext();
        req.user = { id: 'user123' };
        jest.clearAllMocks();
    });

    describe('getSubmissionsForReview', () => {
        it('should return submissions needing review with default filters', async () => {
            req.query = {};

            const mockSubmissions = [
                {
                    _id: 'submission1',
                    processingStatus: 'requires_review',
                    studentId: { name: 'John', studentId: 'STU001' },
                    assessmentId: { title: 'Test Assessment' },
                    classId: { className: '4A', grade: 'Form 4' },
                },
            ];

            StudentAnswer.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        populate: jest.fn().mockReturnValue({
                            sort: jest.fn().mockReturnValue({
                                limit: jest.fn().mockReturnValue({
                                    skip: jest.fn().mockResolvedValue(mockSubmissions),
                                }),
                            }),
                        }),
                    }),
                }),
            });

            StudentAnswer.countDocuments = jest.fn()
                .mockResolvedValueOnce(1) // total
                .mockResolvedValueOnce(0) // lowConfidence
                .mockResolvedValueOnce(0) // hasErrors
                .mockResolvedValueOnce(0); // flaggedForRegrade

            await reviewController.getSubmissionsForReview(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    count: 1,
                    data: mockSubmissions,
                    stats: expect.any(Object),
                })
            );
        });

        it('should filter by classId and assessmentId', async () => {
            req.query = { classId: 'class123', assessmentId: 'assessment123' };

            StudentAnswer.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        populate: jest.fn().mockReturnValue({
                            sort: jest.fn().mockReturnValue({
                                limit: jest.fn().mockReturnValue({
                                    skip: jest.fn().mockResolvedValue([]),
                                }),
                            }),
                        }),
                    }),
                }),
            });

            StudentAnswer.countDocuments = jest.fn().mockResolvedValue(0);

            await reviewController.getSubmissionsForReview(req, res);

            expect(StudentAnswer.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    classId: 'class123',
                    assessmentId: 'assessment123',
                })
            );
        });

        it('should filter by status when provided', async () => {
            req.query = { status: 'error' };

            StudentAnswer.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        populate: jest.fn().mockReturnValue({
                            sort: jest.fn().mockReturnValue({
                                limit: jest.fn().mockReturnValue({
                                    skip: jest.fn().mockResolvedValue([]),
                                }),
                            }),
                        }),
                    }),
                }),
            });

            StudentAnswer.countDocuments = jest.fn().mockResolvedValue(0);

            await reviewController.getSubmissionsForReview(req, res);

            expect(StudentAnswer.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    processingStatus: 'error',
                })
            );
        });

        it('should support pagination', async () => {
            req.query = { page: '2', limit: '10' };

            StudentAnswer.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        populate: jest.fn().mockReturnValue({
                            sort: jest.fn().mockReturnValue({
                                limit: jest.fn().mockReturnValue({
                                    skip: jest.fn().mockResolvedValue([]),
                                }),
                            }),
                        }),
                    }),
                }),
            });

            StudentAnswer.countDocuments = jest.fn().mockResolvedValue(25);

            await reviewController.getSubmissionsForReview(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    currentPage: 2,
                    totalPages: 3,
                })
            );
        });
    });

    describe('markAsReviewed', () => {
        it('should mark submission as reviewed successfully', async () => {
            req.params = { submissionId: 'submission123' };
            req.body = { comments: 'Looks good', approved: true };

            const mockSubmission = {
                _id: 'submission123',
                processingStatus: 'requires_review',
                answers: [{ status: 'graded' }],
                teacherReview: {},
                save: jest.fn().mockResolvedValue(true),
            };

            StudentAnswer.findById = jest.fn().mockResolvedValue(mockSubmission);

            await reviewController.markAsReviewed(req, res);

            expect(mockSubmission.teacherReview.reviewed).toBe(true);
            expect(mockSubmission.teacherReview.reviewedBy).toBe('user123');
            expect(mockSubmission.processingStatus).toBe('completed');
            expect(mockSubmission.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should flag for regrade when not approved', async () => {
            req.params = { submissionId: 'submission123' };
            req.body = { comments: 'Needs review', approved: false };

            const mockSubmission = {
                _id: 'submission123',
                processingStatus: 'requires_review',
                answers: [],
                teacherReview: {},
                save: jest.fn().mockResolvedValue(true),
            };

            StudentAnswer.findById = jest.fn().mockResolvedValue(mockSubmission);

            await reviewController.markAsReviewed(req, res);

            expect(mockSubmission.teacherReview.flaggedForRegrade).toBe(true);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Submission flagged for regrade',
                })
            );
        });

        it('should return 404 if submission not found', async () => {
            req.params = { submissionId: 'nonexistent' };
            req.body = { approved: true };

            StudentAnswer.findById = jest.fn().mockResolvedValue(null);

            await reviewController.markAsReviewed(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should update answer statuses to reviewed', async () => {
            req.params = { submissionId: 'submission123' };
            req.body = { approved: true };

            const mockSubmission = {
                _id: 'submission123',
                processingStatus: 'requires_review',
                answers: [
                    { status: 'graded' },
                    { status: 'graded' },
                ],
                teacherReview: {},
                save: jest.fn().mockResolvedValue(true),
            };

            StudentAnswer.findById = jest.fn().mockResolvedValue(mockSubmission);

            await reviewController.markAsReviewed(req, res);

            expect(mockSubmission.answers[0].status).toBe('reviewed');
            expect(mockSubmission.answers[1].status).toBe('reviewed');
        });
    });

    describe('flagForRegrade', () => {
        it('should flag submission for regrade successfully', async () => {
            req.params = { submissionId: 'submission123' };
            req.body = { reason: 'OCR errors detected' };

            const mockSubmission = {
                _id: 'submission123',
                teacherReview: {},
                save: jest.fn().mockResolvedValue(true),
            };

            StudentAnswer.findById = jest.fn().mockResolvedValue(mockSubmission);

            await reviewController.flagForRegrade(req, res);

            expect(mockSubmission.teacherReview.flaggedForRegrade).toBe(true);
            expect(mockSubmission.processingStatus).toBe('requires_review');
            expect(mockSubmission.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return 404 if submission not found', async () => {
            req.params = { submissionId: 'nonexistent' };
            req.body = { reason: 'Test' };

            StudentAnswer.findById = jest.fn().mockResolvedValue(null);

            await reviewController.flagForRegrade(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should use default reason if not provided', async () => {
            req.params = { submissionId: 'submission123' };
            req.body = {};

            const mockSubmission = {
                _id: 'submission123',
                teacherReview: {},
                save: jest.fn().mockResolvedValue(true),
            };

            StudentAnswer.findById = jest.fn().mockResolvedValue(mockSubmission);

            await reviewController.flagForRegrade(req, res);

            expect(mockSubmission.teacherReview.comments).toBe('Flagged for regrade');
        });
    });

    describe('bulkReview', () => {
        it('should bulk review submissions successfully', async () => {
            req.body = {
                submissionIds: ['sub1', 'sub2', 'sub3'],
                approved: true,
                comments: 'All look good',
            };

            StudentAnswer.updateMany = jest.fn().mockResolvedValue({
                modifiedCount: 3,
            });

            await reviewController.bulkReview(req, res);

            expect(StudentAnswer.updateMany).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'Reviewed 3 submissions',
                    data: expect.objectContaining({
                        total: 3,
                        modified: 3,
                    }),
                })
            );
        });

        it('should return 400 if submissionIds not provided', async () => {
            req.body = {};

            await reviewController.bulkReview(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Submission IDs array is required',
                })
            );
        });

        it('should return 400 if submissionIds is empty', async () => {
            req.body = { submissionIds: [] };

            await reviewController.bulkReview(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 400 if submissionIds is not an array', async () => {
            req.body = { submissionIds: 'not-array' };

            await reviewController.bulkReview(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('getLowConfidenceAnswers', () => {
        it('should return low confidence answers', async () => {
            req.query = { threshold: '0.5' };

            const mockSubmissions = [
                {
                    _id: 'submission1',
                    studentId: { name: 'John' },
                    assessmentId: { title: 'Test' },
                    answers: [
                        {
                            questionNumber: 1,
                            ocrData: { extractedText: 'answer', confidence: 0.3 },
                            status: 'graded',
                            originalImage: 'data:image/png;base64,abc',
                        },
                    ],
                },
            ];

            StudentAnswer.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        limit: jest.fn().mockReturnValue({
                            lean: jest.fn().mockResolvedValue(mockSubmissions),
                        }),
                    }),
                }),
            });

            await reviewController.getLowConfidenceAnswers(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    threshold: 0.5,
                    data: expect.arrayContaining([
                        expect.objectContaining({
                            questionNumber: 1,
                            confidence: 0.3,
                        }),
                    ]),
                })
            );
        });

        it('should filter by classId and assessmentId', async () => {
            req.query = { classId: 'class123', assessmentId: 'assessment123', threshold: '0.6' };

            StudentAnswer.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        limit: jest.fn().mockReturnValue({
                            lean: jest.fn().mockResolvedValue([]),
                        }),
                    }),
                }),
            });

            await reviewController.getLowConfidenceAnswers(req, res);

            expect(StudentAnswer.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    classId: 'class123',
                    assessmentId: 'assessment123',
                })
            );
        });
    });

    describe('getReviewStatistics', () => {
        it('should return review statistics for class', async () => {
            req.query = { classId: 'class123' };

            StudentAnswer.countDocuments = jest.fn()
                .mockResolvedValueOnce(10) // totalSubmissions
                .mockResolvedValueOnce(5) // reviewedCount
                .mockResolvedValueOnce(2); // flaggedCount

            StudentAnswer.aggregate = jest.fn()
                .mockResolvedValueOnce([
                    { _id: 'completed', count: 7 },
                    { _id: 'requires_review', count: 3 },
                ])
                .mockResolvedValueOnce([{
                    avgConfidence: 0.85,
                    minConfidence: 0.6,
                    maxConfidence: 0.99,
                }])
                .mockResolvedValueOnce([{
                    avgPercentage: 75,
                    minPercentage: 50,
                    maxPercentage: 100,
                }]);

            await reviewController.getReviewStatistics(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        totalSubmissions: 10,
                        statusBreakdown: expect.any(Object),
                        reviewStatus: expect.any(Object),
                    }),
                })
            );
        });

        it('should return 400 if neither classId nor assessmentId provided', async () => {
            req.query = {};

            await reviewController.getReviewStatistics(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Either classId or assessmentId is required',
                })
            );
        });

        it('should work with assessmentId', async () => {
            req.query = { assessmentId: 'assessment123' };

            StudentAnswer.countDocuments = jest.fn().mockResolvedValue(5);
            StudentAnswer.aggregate = jest.fn().mockResolvedValue([]);

            await reviewController.getReviewStatistics(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('exportReviewData', () => {
        it('should export review data as JSON', async () => {
            req.query = { classId: 'class123', format: 'json' };

            const mockSubmissions = [
                {
                    _id: 'submission1',
                    studentId: { name: 'John', studentId: 'STU001', email: 'john@test.com' },
                    assessmentId: { title: 'Test', activityType: 'assessment' },
                    classId: { className: '4A', grade: 'Form 4', subject: 'English' },
                    submittedAt: new Date(),
                    processingStatus: 'completed',
                    overallStats: { totalScore: 8, maxPossibleScore: 10, percentage: 80 },
                    teacherReview: { reviewed: true },
                    answers: [
                        {
                            questionNumber: 1,
                            status: 'graded',
                            ocrData: { confidence: 0.9, extractedText: 'answer' },
                            grading: { finalScore: 8, aiScore: { score: 8, maxScore: 10 } },
                        },
                    ],
                },
            ];

            StudentAnswer.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        populate: jest.fn().mockReturnValue({
                            populate: jest.fn().mockReturnValue({
                                lean: jest.fn().mockResolvedValue(mockSubmissions),
                            }),
                        }),
                    }),
                }),
            });

            await reviewController.exportReviewData(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    count: 1,
                    data: expect.any(Array),
                })
            );
        });

        it('should return 400 if neither classId nor assessmentId provided', async () => {
            req.query = { format: 'json' };

            await reviewController.exportReviewData(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Either classId or assessmentId is required',
                })
            );
        });

        it('should export as CSV when format is csv', async () => {
            req.query = { assessmentId: 'assessment123', format: 'csv' };

            const mockSubmissions = [
                {
                    _id: 'submission1',
                    studentId: { name: 'John', studentId: 'STU001' },
                    assessmentId: { title: 'Test', activityType: 'assessment' },
                    classId: { className: '4A', grade: 'Form 4', subject: 'English' },
                    submittedAt: new Date(),
                    processingStatus: 'completed',
                    overallStats: { totalScore: 8, maxPossibleScore: 10, percentage: 80 },
                    teacherReview: { reviewed: true, flaggedForRegrade: false },
                    answers: [],
                },
            ];

            StudentAnswer.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        populate: jest.fn().mockReturnValue({
                            populate: jest.fn().mockReturnValue({
                                lean: jest.fn().mockResolvedValue(mockSubmissions),
                            }),
                        }),
                    }),
                }),
            });

            await reviewController.exportReviewData(req, res);

            expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
            expect(res.setHeader).toHaveBeenCalledWith(
                'Content-Disposition',
                expect.stringContaining('attachment; filename=review-export-')
            );
        });
    });
});
