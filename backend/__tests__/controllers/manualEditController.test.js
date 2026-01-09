/**
 * Unit Tests for Manual Edit Controller
 * Tests manual text editing and score adjustment operations
 */

const { createMockRequest, createMockResponse, createMockNext } = require('../mocks/req-res');

// Mock dependencies
jest.mock('../../model/StudentAnswer');
jest.mock('../../model/Assessment');
jest.mock('../../model/User');
jest.mock('../../services/gradingService');

const StudentAnswer = require('../../model/StudentAnswer');
const Assessment = require('../../model/Assessment');
const User = require('../../model/User');
const { regradeAnswer } = require('../../services/gradingService');

const manualEditController = require('../../controller/manualEditController');

describe('Manual Edit Controller', () => {
    let req, res, next;

    beforeEach(() => {
        req = createMockRequest();
        res = createMockResponse();
        next = createMockNext();
        req.user = { id: 'user123' };
        jest.clearAllMocks();
    });

    describe('editExtractedText', () => {
        it('should edit extracted text successfully', async () => {
            req.params = { submissionId: 'submission123', questionNumber: '1' };
            req.body = { editedText: 'Updated answer text', autoRegrade: false };

            const mockSubmission = {
                _id: 'submission123',
                assessmentId: 'assessment123',
                answers: [
                    {
                        questionNumber: 1,
                        status: 'graded',
                        ocrData: { extractedText: 'Original text' },
                    },
                ],
                calculateOverallStats: jest.fn(),
                save: jest.fn().mockResolvedValue(true),
            };

            StudentAnswer.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockSubmission),
            });

            await manualEditController.editExtractedText(req, res);

            expect(mockSubmission.answers[0].editedText).toBe('Updated answer text');
            expect(mockSubmission.answers[0].isEdited).toBe(true);
            expect(mockSubmission.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should auto-regrade when enabled', async () => {
            req.params = { submissionId: 'submission123', questionNumber: '1' };
            req.body = { editedText: 'Updated answer', autoRegrade: true };

            const mockAnswer = {
                questionNumber: 1,
                status: 'graded',
                grading: { aiScore: { score: 5, maxScore: 10 } },
            };

            const mockSubmission = {
                _id: 'submission123',
                assessmentId: 'assessment123',
                answers: [mockAnswer],
                calculateOverallStats: jest.fn(),
                save: jest.fn().mockResolvedValue(true),
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

            Assessment.findById = jest.fn().mockResolvedValue({
                generatedContent: {
                    answerKeyContent: {
                        answers: [{ questionNumber: 1, answer: 'correct' }],
                    },
                },
            });

            regradeAnswer.mockResolvedValue({ score: 8, maxScore: 10 });

            await manualEditController.editExtractedText(req, res);

            expect(regradeAnswer).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return 400 if editedText is empty', async () => {
            req.params = { submissionId: 'submission123', questionNumber: '1' };
            req.body = { editedText: '' };

            await manualEditController.editExtractedText(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Edited text is required',
                })
            );
        });

        it('should return 404 if submission not found', async () => {
            req.params = { submissionId: 'nonexistent', questionNumber: '1' };
            req.body = { editedText: 'Text' };

            StudentAnswer.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue(null),
            });

            await manualEditController.editExtractedText(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return 404 if answer not found', async () => {
            req.params = { submissionId: 'submission123', questionNumber: '99' };
            req.body = { editedText: 'Text' };

            const mockSubmission = {
                _id: 'submission123',
                answers: [{ questionNumber: 1 }],
            };

            StudentAnswer.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockSubmission),
            });

            await manualEditController.editExtractedText(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('adjustScore', () => {
        it('should adjust score successfully', async () => {
            req.params = { submissionId: 'submission123', questionNumber: '1' };
            req.body = { newScore: 8, adjustmentReason: 'Partial credit' };

            const mockSubmission = {
                _id: 'submission123',
                answers: [
                    {
                        questionNumber: 1,
                        grading: { aiScore: { score: 5, maxScore: 10 } },
                    },
                ],
                calculateOverallStats: jest.fn(),
                save: jest.fn().mockResolvedValue(true),
            };

            StudentAnswer.findById = jest.fn().mockResolvedValue(mockSubmission);

            await manualEditController.adjustScore(req, res);

            expect(mockSubmission.answers[0].grading.finalScore).toBe(8);
            expect(mockSubmission.answers[0].grading.isManuallyAdjusted).toBe(true);
            expect(mockSubmission.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return 400 if newScore not provided', async () => {
            req.params = { submissionId: 'submission123', questionNumber: '1' };
            req.body = {};

            await manualEditController.adjustScore(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'New score is required',
                })
            );
        });

        it('should return 404 if submission not found', async () => {
            req.params = { submissionId: 'nonexistent', questionNumber: '1' };
            req.body = { newScore: 8 };

            StudentAnswer.findById = jest.fn().mockResolvedValue(null);

            await manualEditController.adjustScore(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return 400 if answer not graded yet', async () => {
            req.params = { submissionId: 'submission123', questionNumber: '1' };
            req.body = { newScore: 8 };

            const mockSubmission = {
                _id: 'submission123',
                answers: [{ questionNumber: 1, grading: null }],
            };

            StudentAnswer.findById = jest.fn().mockResolvedValue(mockSubmission);

            await manualEditController.adjustScore(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Answer must be graded before score adjustment',
                })
            );
        });

        it('should return 400 if score out of range', async () => {
            req.params = { submissionId: 'submission123', questionNumber: '1' };
            req.body = { newScore: 15 };

            const mockSubmission = {
                _id: 'submission123',
                answers: [
                    {
                        questionNumber: 1,
                        grading: { aiScore: { score: 5, maxScore: 10 } },
                    },
                ],
            };

            StudentAnswer.findById = jest.fn().mockResolvedValue(mockSubmission);

            await manualEditController.adjustScore(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Score must be between 0 and 10',
                })
            );
        });
    });

    describe('bulkEditAnswers', () => {
        it('should bulk edit answers successfully', async () => {
            req.params = { submissionId: 'submission123' };
            req.body = {
                edits: [
                    { questionNumber: 1, editedText: 'New text 1' },
                    { questionNumber: 2, newScore: 8 },
                ],
            };

            const mockSubmission = {
                _id: 'submission123',
                assessmentId: 'assessment123',
                answers: [
                    { questionNumber: 1, status: 'graded' },
                    { questionNumber: 2, grading: { aiScore: { score: 5, maxScore: 10 } } },
                ],
                calculateOverallStats: jest.fn(),
                save: jest.fn().mockResolvedValue(true),
            };

            StudentAnswer.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockSubmission),
            });

            const mockUser = {
                getGeminiApiKey: jest.fn().mockReturnValue(null),
            };

            User.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser),
            });

            Assessment.findById = jest.fn().mockResolvedValue({
                generatedContent: { answerKeyContent: { answers: [] } },
            });

            await manualEditController.bulkEditAnswers(req, res);

            expect(mockSubmission.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return 400 if edits array is empty', async () => {
            req.params = { submissionId: 'submission123' };
            req.body = { edits: [] };

            await manualEditController.bulkEditAnswers(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 404 if submission not found', async () => {
            req.params = { submissionId: 'nonexistent' };
            req.body = { edits: [{ questionNumber: 1, editedText: 'Text' }] };

            StudentAnswer.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue(null),
            });

            await manualEditController.bulkEditAnswers(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('resetAdjustments', () => {
        it('should reset adjustments successfully', async () => {
            req.params = { submissionId: 'submission123', questionNumber: '1' };

            const mockSubmission = {
                _id: 'submission123',
                answers: [
                    {
                        questionNumber: 1,
                        isEdited: true,
                        editedText: 'Edited text',
                        grading: {
                            aiScore: { score: 5, maxScore: 10 },
                            finalScore: 8,
                            isManuallyAdjusted: true,
                        },
                    },
                ],
                calculateOverallStats: jest.fn(),
                save: jest.fn().mockResolvedValue(true),
            };

            StudentAnswer.findById = jest.fn().mockResolvedValue(mockSubmission);

            await manualEditController.resetAdjustments(req, res);

            const answer = mockSubmission.answers[0];
            expect(answer.isEdited).toBe(false);
            expect(answer.grading.finalScore).toBe(5);
            expect(answer.grading.isManuallyAdjusted).toBe(false);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return 404 if submission not found', async () => {
            req.params = { submissionId: 'nonexistent', questionNumber: '1' };

            StudentAnswer.findById = jest.fn().mockResolvedValue(null);

            await manualEditController.resetAdjustments(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return 404 if answer not found', async () => {
            req.params = { submissionId: 'submission123', questionNumber: '99' };

            const mockSubmission = {
                answers: [{ questionNumber: 1 }],
            };

            StudentAnswer.findById = jest.fn().mockResolvedValue(mockSubmission);

            await manualEditController.resetAdjustments(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('getEditHistory', () => {
        it('should return edit history', async () => {
            req.params = { submissionId: 'submission123' };

            const mockSubmission = {
                _id: 'submission123',
                answers: [
                    {
                        questionNumber: 1,
                        isEdited: true,
                        editedText: 'Edited text',
                        editedBy: { name: 'Teacher', email: 'teacher@test.com' },
                        editedAt: new Date(),
                        ocrData: { extractedText: 'Original text' },
                        grading: {
                            isManuallyAdjusted: true,
                            aiScore: { score: 5 },
                            finalScore: 8,
                            adjustedBy: { name: 'Teacher' },
                            adjustedAt: new Date(),
                            adjustmentReason: 'Partial credit',
                        },
                    },
                    {
                        questionNumber: 2,
                        isEdited: false,
                        grading: { isManuallyAdjusted: false },
                    },
                ],
            };

            StudentAnswer.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        lean: jest.fn().mockResolvedValue(mockSubmission),
                    }),
                }),
            });

            await manualEditController.getEditHistory(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    submissionId: 'submission123',
                    totalEdits: 1, // Only one answer was edited
                    editHistory: expect.any(Array),
                }),
            });
        });

        it('should return 404 if submission not found', async () => {
            req.params = { submissionId: 'nonexistent' };

            StudentAnswer.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        lean: jest.fn().mockResolvedValue(null),
                    }),
                }),
            });

            await manualEditController.getEditHistory(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });
});
