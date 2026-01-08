/**
 * Unit Tests for Suggestions Controller
 * Tests smart suggestions and feedback
 * 
 * UPDATED: Matches actual suggestionsController.js implementation
 */

const { createMockRequest, createMockResponse, createMockNext } = require('../mocks/req-res');
const { createMockUser } = require('../mocks/models');

// Mock dependencies
jest.mock('../../services/aiSuggestionService');
jest.mock('../../model/Lesson');
jest.mock('../../model/Class');

const { generateSmartSuggestions } = require('../../services/aiSuggestionService');
const LessonPlan = require('../../model/Lesson');
const Class = require('../../model/Class');

const suggestionsController = require('../../controller/suggestionsController');

describe('Suggestions Controller', () => {
    let req, res, next;

    beforeEach(() => {
        req = createMockRequest();
        res = createMockResponse();
        next = createMockNext();
        req.user = { id: 'user123', _id: 'user123' };
        jest.clearAllMocks();
    });

    describe('getSmartSuggestions', () => {
        it('should return 400 if classId is missing', async () => {
            req.body = {}; // Missing classId

            await suggestionsController.getSmartSuggestions(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'classId is required',
            });
        });

        it('should return 404 if class not found', async () => {
            req.body = { classId: 'nonexistent' };

            Class.findOne = jest.fn().mockResolvedValue(null);

            await suggestionsController.getSmartSuggestions(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Class not found or you don't have access to it",
            });
        });

        it('should return AI-generated suggestions', async () => {
            req.body = { classId: 'class123' };

            const mockClass = {
                _id: 'class123',
                subject: 'Mathematics',
                grade: '10',
                year: '2024',
            };

            const mockSuggestions = {
                success: true,
                suggestions: {
                    nextTopic: { topic: 'Linear Equations' },
                    suggestedDate: { date: '2024-01-15' },
                },
                patterns: { preferredDays: ['Monday'] },
            };

            Class.findOne = jest.fn().mockResolvedValue(mockClass);
            generateSmartSuggestions.mockResolvedValue(mockSuggestions);

            await suggestionsController.getSmartSuggestions(req, res);

            expect(generateSmartSuggestions).toHaveBeenCalledWith(
                'user123',
                'class123',
                expect.objectContaining({
                    subject: 'Mathematics',
                    grade: '10',
                })
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    suggestions: mockSuggestions.suggestions,
                    patterns: mockSuggestions.patterns,
                },
            });
        });

        it('should handle service returning unsuccessful result', async () => {
            req.body = { classId: 'class123' };

            const mockClass = { _id: 'class123', subject: 'Math' };

            Class.findOne = jest.fn().mockResolvedValue(mockClass);
            generateSmartSuggestions.mockResolvedValue({
                success: false,
                message: 'Not enough data',
            });

            await suggestionsController.getSmartSuggestions(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Not enough data',
                suggestions: null,
                patterns: null,
            });
        });

        it('should handle service errors gracefully', async () => {
            req.body = { classId: 'class123' };

            Class.findOne = jest.fn().mockResolvedValue({ _id: 'class123' });
            generateSmartSuggestions.mockRejectedValue(new Error('AI service unavailable'));

            await suggestionsController.getSmartSuggestions(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Failed to generate suggestions',
                })
            );
        });
    });

    describe('recordSuggestionFeedback', () => {
        it('should return 400 if required fields are missing', async () => {
            req.body = { lessonId: 'lesson123' }; // Missing suggestionType and accepted

            await suggestionsController.recordSuggestionFeedback(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'lessonId, suggestionType, and accepted are required',
            });
        });

        it('should return 400 for invalid suggestionType', async () => {
            req.body = {
                lessonId: 'lesson123',
                suggestionType: 'invalidType',
                accepted: true,
            };

            await suggestionsController.recordSuggestionFeedback(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'suggestionType must be one of: sowTopic, date, activityType, resource',
            });
        });

        it('should return 404 if lesson not found', async () => {
            req.body = {
                lessonId: 'nonexistent',
                suggestionType: 'sowTopic',
                accepted: true,
            };

            LessonPlan.findOne = jest.fn().mockResolvedValue(null);

            await suggestionsController.recordSuggestionFeedback(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Lesson not found or you don't have access to it",
            });
        });

        it('should record positive feedback for a suggestion', async () => {
            req.body = {
                lessonId: 'lesson123',
                suggestionType: 'sowTopic',
                accepted: true,
            };

            const mockLesson = {
                _id: 'lesson123',
                aiSuggestions: { acceptedSuggestions: [] },
                save: jest.fn().mockResolvedValue(true),
            };

            LessonPlan.findOne = jest.fn().mockResolvedValue(mockLesson);

            await suggestionsController.recordSuggestionFeedback(req, res);

            expect(mockLesson.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Feedback recorded successfully',
            });
        });

        it('should not save if suggestion was rejected', async () => {
            req.body = {
                lessonId: 'lesson123',
                suggestionType: 'sowTopic',
                accepted: false,
            };

            const mockLesson = {
                _id: 'lesson123',
                aiSuggestions: { acceptedSuggestions: [] },
                save: jest.fn(),
            };

            LessonPlan.findOne = jest.fn().mockResolvedValue(mockLesson);

            await suggestionsController.recordSuggestionFeedback(req, res);

            expect(mockLesson.save).not.toHaveBeenCalled(); // Not saved for rejected
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('getSuggestionStats', () => {
        it('should return suggestion acceptance statistics', async () => {
            const mockLessons = [
                {
                    aiSuggestions: {
                        acceptedSuggestions: [
                            { suggestionType: 'sowTopic', wasAccurate: true },
                            { suggestionType: 'date', wasAccurate: true },
                        ],
                    },
                },
                {
                    aiSuggestions: {
                        acceptedSuggestions: [
                            { suggestionType: 'sowTopic', wasAccurate: false },
                        ],
                    },
                },
            ];

            LessonPlan.find = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(mockLessons),
            });

            await suggestionsController.getSuggestionStats(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    totalSuggestionsAccepted: 3,
                    byType: expect.objectContaining({
                        sowTopic: 2,
                        date: 1,
                    }),
                }),
            });
        });

        it('should handle empty stats', async () => {
            LessonPlan.find = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue([]),
            });

            await suggestionsController.getSuggestionStats(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    totalSuggestionsAccepted: 0,
                    accuracyRate: 0,
                }),
            });
        });
    });
});
