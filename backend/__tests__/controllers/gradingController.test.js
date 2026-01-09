/**
 * Unit Tests for Grading Controller
 * Tests grading operations for student submissions
 */

const { createMockRequest, createMockResponse, createMockNext } = require('../mocks/req-res');

// Mock dependencies
jest.mock('../../model/StudentAnswer');
jest.mock('../../model/Assessment');
jest.mock('../../model/User');
jest.mock('@google/generative-ai');
jest.mock('../../services/gradingService');

const StudentAnswer = require('../../model/StudentAnswer');
const Assessment = require('../../model/Assessment');
const User = require('../../model/User');
const { gradeSubmission, regradeAnswer, gradeSpmAnswerSheet } = require('../../services/gradingService');

const gradingController = require('../../controller/gradingController');

describe('Grading Controller', () => {
    let req, res, next;

    beforeEach(() => {
        req = createMockRequest();
        res = createMockResponse();
        next = createMockNext();
        req.user = { id: 'user123' };
        jest.clearAllMocks();
    });

    describe('scoreSubmission', () => {
        it('should grade submission successfully', async () => {
            req.params = { submissionId: 'submission123' };

            const mockSubmission = {
                _id: 'submission123',
                assessmentId: 'assessment123',
                studentId: { name: 'John', updatePerformanceStats: jest.fn() },
                answers: [{ status: 'ocr_complete' }],
                processingStatus: 'pending',
                overallStats: { percentage: 80 },
                save: jest.fn().mockResolvedValue(true),
            };

            const mockAssessment = {
                _id: 'assessment123',
                generatedContent: {
                    answerKeyContent: { answers: [{ questionNumber: 1, answer: 'A' }] },
                },
            };

            const mockUser = {
                getGeminiApiKey: jest.fn().mockReturnValue('fake-api-key'),
            };

            StudentAnswer.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(mockSubmission),
                }),
            });

            Assessment.findById = jest.fn().mockResolvedValue(mockAssessment);

            User.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser),
            });

            gradeSubmission.mockResolvedValue({
                results: [],
                summary: {
                    totalScore: 8,
                    maxPossibleScore: 10,
                    percentage: 80,
                },
            });

            await gradingController.scoreSubmission(req, res);

            expect(gradeSubmission).toHaveBeenCalled();
            expect(mockSubmission.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'Submission graded successfully',
                })
            );
        });

        it('should return 404 if submission not found', async () => {
            req.params = { submissionId: 'nonexistent' };

            StudentAnswer.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(null),
                }),
            });

            await gradingController.scoreSubmission(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return 400 if OCR not completed', async () => {
            req.params = { submissionId: 'submission123' };

            const mockSubmission = {
                _id: 'submission123',
                answers: [{ status: 'pending_ocr' }],
            };

            StudentAnswer.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(mockSubmission),
                }),
            });

            await gradingController.scoreSubmission(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'OCR processing must be completed before grading',
                })
            );
        });

        it('should return 400 if no API key', async () => {
            req.params = { submissionId: 'submission123' };

            const mockSubmission = {
                _id: 'submission123',
                answers: [{ status: 'ocr_complete' }],
            };

            StudentAnswer.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(mockSubmission),
                }),
            });

            const mockUser = {
                getGeminiApiKey: jest.fn().mockReturnValue(null),
            };

            User.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser),
            });

            await gradingController.scoreSubmission(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 400 if no answer key or rubric', async () => {
            req.params = { submissionId: 'submission123' };

            const mockSubmission = {
                _id: 'submission123',
                assessmentId: 'assessment123',
                answers: [{ status: 'ocr_complete' }],
            };

            const mockAssessment = {
                _id: 'assessment123',
                generatedContent: {},
            };

            StudentAnswer.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(mockSubmission),
                }),
            });

            const mockUser = {
                getGeminiApiKey: jest.fn().mockReturnValue('fake-api-key'),
            };

            User.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser),
            });

            Assessment.findById = jest.fn().mockResolvedValue(mockAssessment);

            await gradingController.scoreSubmission(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('scoreAnswer', () => {
        it('should grade single answer successfully', async () => {
            req.params = { submissionId: 'submission123', questionNumber: '1' };

            const mockSubmission = {
                _id: 'submission123',
                assessmentId: 'assessment123',
                answers: [
                    { questionNumber: 1, status: 'ocr_complete' },
                ],
                calculateOverallStats: jest.fn(),
                save: jest.fn().mockResolvedValue(true),
            };

            const mockAssessment = {
                generatedContent: {
                    answerKeyContent: {
                        answers: [{ questionNumber: 1, answer: 'A' }],
                    },
                },
            };

            StudentAnswer.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockSubmission),
            });

            const mockUser = {
                getGeminiApiKey: jest.fn().mockReturnValue('fake-api-key'),
            };

            User.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser),
            });

            Assessment.findById = jest.fn().mockResolvedValue(mockAssessment);

            regradeAnswer.mockResolvedValue({
                score: 10,
                maxScore: 10,
                percentage: 100,
                feedback: 'Correct!',
            });

            await gradingController.scoreAnswer(req, res);

            expect(regradeAnswer).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return 404 if submission not found', async () => {
            req.params = { submissionId: 'nonexistent', questionNumber: '1' };

            StudentAnswer.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue(null),
            });

            await gradingController.scoreAnswer(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return 404 if answer not found', async () => {
            req.params = { submissionId: 'submission123', questionNumber: '99' };

            const mockSubmission = {
                _id: 'submission123',
                answers: [{ questionNumber: 1 }],
            };

            StudentAnswer.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockSubmission),
            });

            await gradingController.scoreAnswer(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return 400 if OCR not complete for answer', async () => {
            req.params = { submissionId: 'submission123', questionNumber: '1' };

            const mockSubmission = {
                _id: 'submission123',
                answers: [{ questionNumber: 1, status: 'pending_ocr' }],
            };

            StudentAnswer.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockSubmission),
            });

            await gradingController.scoreAnswer(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('batchGradeSubmissions', () => {
        it('should batch grade submissions', async () => {
            req.body = { submissionIds: ['sub1', 'sub2'] };

            const mockUser = {
                getGeminiApiKey: jest.fn().mockReturnValue('fake-api-key'),
            };

            User.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser),
            });

            const mockSubmission = {
                _id: 'sub1',
                assessmentId: 'assessment123',
                studentId: { name: 'John', updatePerformanceStats: jest.fn() },
                answers: [{ status: 'ocr_complete' }],
                processingStatus: 'pending',
                save: jest.fn().mockResolvedValue(true),
            };

            StudentAnswer.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(mockSubmission),
                }),
            });

            Assessment.findById = jest.fn().mockResolvedValue({
                generatedContent: {
                    answerKeyContent: { answers: [] },
                },
            });

            gradeSubmission.mockResolvedValue({
                results: [],
                summary: { totalScore: 8, maxPossibleScore: 10, percentage: 80 },
            });

            await gradingController.batchGradeSubmissions(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                })
            );
        });

        it('should return 400 if no submission IDs provided', async () => {
            req.body = { submissionIds: [] };

            await gradingController.batchGradeSubmissions(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 400 if submissionIds not an array', async () => {
            req.body = { submissionIds: 'not-array' };

            await gradingController.batchGradeSubmissions(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('getGradingStatus', () => {
        it('should return grading status', async () => {
            req.params = { submissionId: 'submission123' };

            const mockSubmission = {
                _id: 'submission123',
                processingStatus: 'completed',
                overallStats: { totalScore: 8, maxPossibleScore: 10 },
                answers: [
                    { questionNumber: 1, status: 'graded', grading: { aiScore: { score: 8, maxScore: 10 } } },
                ],
            };

            StudentAnswer.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(mockSubmission),
                }),
            });

            await gradingController.getGradingStatus(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    processingStatus: 'completed',
                    gradingComplete: true,
                }),
            });
        });

        it('should return 404 if submission not found', async () => {
            req.params = { submissionId: 'nonexistent' };

            StudentAnswer.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(null),
                }),
            });

            await gradingController.getGradingStatus(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('processAndGradeSpmAnswerSheet', () => {
        it('should return 400 if required fields missing', async () => {
            req.body = { image: 'data:image/png;base64,abc' };

            await gradingController.processAndGradeSpmAnswerSheet(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Missing required fields: image, assessmentId, classId, studentId',
                })
            );
        });

        it('should return 400 if invalid image format', async () => {
            req.body = {
                image: 'invalid-format',
                assessmentId: 'assessment123',
                classId: 'class123',
                studentId: 'student123',
            };

            await gradingController.processAndGradeSpmAnswerSheet(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Invalid file format. Expected image or PDF base64 data URL.',
                })
            );
        });

        it('should return 400 if no API key', async () => {
            req.body = {
                image: 'data:image/png;base64,abc123',
                assessmentId: 'assessment123',
                classId: 'class123',
                studentId: 'student123',
            };

            const mockUser = {
                getGeminiApiKey: jest.fn().mockReturnValue(null),
            };

            User.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser),
            });

            await gradingController.processAndGradeSpmAnswerSheet(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 404 if assessment not found', async () => {
            req.body = {
                image: 'data:image/png;base64,abc123',
                assessmentId: 'nonexistent',
                classId: 'class123',
                studentId: 'student123',
            };

            const mockUser = {
                getGeminiApiKey: jest.fn().mockReturnValue('fake-api-key'),
            };

            User.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser),
            });

            Assessment.findById = jest.fn().mockResolvedValue(null);

            await gradingController.processAndGradeSpmAnswerSheet(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return 400 if not SPM exam', async () => {
            req.body = {
                image: 'data:image/png;base64,abc123',
                assessmentId: 'assessment123',
                classId: 'class123',
                studentId: 'student123',
            };

            const mockUser = {
                getGeminiApiKey: jest.fn().mockReturnValue('fake-api-key'),
            };

            User.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser),
            });

            Assessment.findById = jest.fn().mockResolvedValue({
                _id: 'assessment123',
                activityType: 'essay', // Not spm-exam
            });

            await gradingController.processAndGradeSpmAnswerSheet(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'This endpoint is only for SPM Paper 1 exams',
                })
            );
        });
    });
});
