/**
 * Unit Tests for OCR Controller
 * Tests OCR text extraction operations
 */

const { createMockRequest, createMockResponse, createMockNext } = require('../mocks/req-res');

// Mock dependencies
jest.mock('@google/generative-ai');
jest.mock('../../model/User');
jest.mock('../../model/StudentAnswer');

const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require('../../model/User');
const StudentAnswer = require('../../model/StudentAnswer');

const ocrController = require('../../controller/ocrController');

describe('OCR Controller', () => {
    let req, res, next;

    beforeEach(() => {
        req = createMockRequest();
        res = createMockResponse();
        next = createMockNext();
        req.user = { id: 'user123' };
        jest.clearAllMocks();
    });

    describe('extractTextFromImage', () => {
        it('should extract text from image successfully', async () => {
            req.body = { image: 'data:image/png;base64,abc123def456' };

            const mockUser = {
                _id: 'user123',
                getGeminiApiKey: jest.fn().mockReturnValue('fake-api-key'),
            };

            User.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser),
            });

            const mockGenerateContent = jest.fn().mockResolvedValue({
                response: {
                    text: jest.fn().mockReturnValue('Extracted text from image'),
                },
            });

            const mockGetGenerativeModel = jest.fn().mockReturnValue({
                generateContent: mockGenerateContent,
            });

            GoogleGenerativeAI.mockImplementation(() => ({
                getGenerativeModel: mockGetGenerativeModel,
            }));

            await ocrController.extractTextFromImage(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        extractedText: 'Extracted text from image',
                    }),
                })
            );
        });

        it('should return 401 if user not authenticated', async () => {
            req.user = null;
            req.body = { image: 'data:image/png;base64,abc123' };

            await ocrController.extractTextFromImage(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('should return 400 if no image provided', async () => {
            req.body = {};

            await ocrController.extractTextFromImage(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'No image data provided',
                })
            );
        });

        it('should return 400 if invalid image format', async () => {
            req.body = { image: 'invalid-format' };

            await ocrController.extractTextFromImage(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Invalid file format. Expected image or PDF base64 data URL.',
                })
            );
        });

        it('should return 404 if user not found', async () => {
            req.body = { image: 'data:image/png;base64,abc123' };

            User.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(null),
            });

            await ocrController.extractTextFromImage(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return 400 if no Gemini API key', async () => {
            req.body = { image: 'data:image/png;base64,abc123' };

            const mockUser = {
                _id: 'user123',
                getGeminiApiKey: jest.fn().mockReturnValue(null),
            };

            User.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser),
            });

            await ocrController.extractTextFromImage(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('No Gemini API key found'),
                })
            );
        });

        it('should handle PDF files', async () => {
            req.body = { image: 'data:application/pdf;base64,abc123def456' };

            const mockUser = {
                _id: 'user123',
                getGeminiApiKey: jest.fn().mockReturnValue('fake-api-key'),
            };

            User.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser),
            });

            const mockGenerateContent = jest.fn().mockResolvedValue({
                response: {
                    text: jest.fn().mockReturnValue('Extracted text from PDF'),
                },
            });

            GoogleGenerativeAI.mockImplementation(() => ({
                getGenerativeModel: jest.fn().mockReturnValue({
                    generateContent: mockGenerateContent,
                }),
            }));

            await ocrController.extractTextFromImage(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return 400 if file too large', async () => {
            // Create a large base64 string (> 50MB)
            const largeBase64 = 'a'.repeat(70 * 1024 * 1024); // ~70MB
            req.body = { image: `data:image/png;base64,${largeBase64}` };

            const mockUser = {
                _id: 'user123',
                getGeminiApiKey: jest.fn().mockReturnValue('fake-api-key'),
            };

            User.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser),
            });

            await ocrController.extractTextFromImage(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('exceeds 50MB limit'),
                })
            );
        });
    });

    describe('processSubmissionOCR', () => {
        it('should process submission OCR successfully', async () => {
            req.params = { submissionId: 'submission123' };

            const mockSubmission = {
                _id: 'submission123',
                answers: [
                    {
                        questionNumber: 1,
                        originalImage: 'data:image/png;base64,abc123',
                        status: 'pending_ocr',
                        ocrData: {},
                    },
                ],
                processingStatus: 'pending',
                save: jest.fn().mockResolvedValue(true),
            };

            StudentAnswer.findById = jest.fn().mockResolvedValue(mockSubmission);

            const mockUser = {
                getGeminiApiKey: jest.fn().mockReturnValue('fake-api-key'),
            };

            User.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser),
            });

            const mockGenerateContent = jest.fn().mockResolvedValue({
                response: {
                    text: jest.fn().mockReturnValue('Extracted answer text'),
                },
            });

            GoogleGenerativeAI.mockImplementation(() => ({
                getGenerativeModel: jest.fn().mockReturnValue({
                    generateContent: mockGenerateContent,
                }),
            }));

            await ocrController.processSubmissionOCR(req, res);

            expect(mockSubmission.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return 404 if submission not found', async () => {
            req.params = { submissionId: 'nonexistent' };

            StudentAnswer.findById = jest.fn().mockResolvedValue(null);

            await ocrController.processSubmissionOCR(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return 400 if no API key', async () => {
            req.params = { submissionId: 'submission123' };

            const mockSubmission = {
                _id: 'submission123',
                answers: [{ questionNumber: 1, status: 'pending_ocr' }],
            };

            StudentAnswer.findById = jest.fn().mockResolvedValue(mockSubmission);

            const mockUser = {
                getGeminiApiKey: jest.fn().mockReturnValue(null),
            };

            User.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser),
            });

            await ocrController.processSubmissionOCR(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 400 if no pending OCR answers', async () => {
            req.params = { submissionId: 'submission123' };

            const mockSubmission = {
                _id: 'submission123',
                answers: [{ questionNumber: 1, status: 'graded' }],
            };

            StudentAnswer.findById = jest.fn().mockResolvedValue(mockSubmission);

            const mockUser = {
                getGeminiApiKey: jest.fn().mockReturnValue('fake-api-key'),
            };

            User.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser),
            });

            await ocrController.processSubmissionOCR(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'No answers pending OCR processing',
                })
            );
        });
    });

    describe('processSingleAnswerOCR', () => {
        it('should process single answer OCR successfully', async () => {
            req.params = { submissionId: 'submission123', questionNumber: '1' };

            const mockSubmission = {
                _id: 'submission123',
                answers: [
                    {
                        questionNumber: 1,
                        originalImage: 'data:image/png;base64,abc123',
                        status: 'pending_ocr',
                        ocrData: {},
                    },
                ],
                save: jest.fn().mockResolvedValue(true),
            };

            StudentAnswer.findById = jest.fn().mockResolvedValue(mockSubmission);

            const mockUser = {
                getGeminiApiKey: jest.fn().mockReturnValue('fake-api-key'),
            };

            User.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser),
            });

            const mockGenerateContent = jest.fn().mockResolvedValue({
                response: {
                    text: jest.fn().mockReturnValue('Extracted text'),
                },
            });

            GoogleGenerativeAI.mockImplementation(() => ({
                getGenerativeModel: jest.fn().mockReturnValue({
                    generateContent: mockGenerateContent,
                }),
            }));

            await ocrController.processSingleAnswerOCR(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return 404 if submission not found', async () => {
            req.params = { submissionId: 'nonexistent', questionNumber: '1' };

            StudentAnswer.findById = jest.fn().mockResolvedValue(null);

            await ocrController.processSingleAnswerOCR(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return 404 if answer not found', async () => {
            req.params = { submissionId: 'submission123', questionNumber: '99' };

            const mockSubmission = {
                _id: 'submission123',
                answers: [{ questionNumber: 1 }],
            };

            StudentAnswer.findById = jest.fn().mockResolvedValue(mockSubmission);

            await ocrController.processSingleAnswerOCR(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return 400 if no image for answer', async () => {
            req.params = { submissionId: 'submission123', questionNumber: '1' };

            const mockSubmission = {
                _id: 'submission123',
                answers: [{ questionNumber: 1, originalImage: null }],
            };

            StudentAnswer.findById = jest.fn().mockResolvedValue(mockSubmission);

            const mockUser = {
                getGeminiApiKey: jest.fn().mockReturnValue('fake-api-key'),
            };

            User.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser),
            });

            await ocrController.processSingleAnswerOCR(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });
});
