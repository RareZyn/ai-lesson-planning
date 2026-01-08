/**
 * Unit Tests for Search Controller
 * Tests global search functionality
 * 
 * UPDATED: Matches actual searchController.js implementation
 */

const { createMockRequest, createMockResponse, createMockNext } = require('../mocks/req-res');
const { createMockUser } = require('../mocks/models');

// Mock dependencies
jest.mock('../../model/Lesson');
jest.mock('../../model/Class');
jest.mock('../../model/Material');
jest.mock('../../model/Assessment');

const Lesson = require('../../model/Lesson');
const Class = require('../../model/Class');
const Material = require('../../model/Material');
const Assessment = require('../../model/Assessment');

const searchController = require('../../controller/searchController');

describe('Search Controller', () => {
    let req, res, next;

    beforeEach(() => {
        req = createMockRequest();
        res = createMockResponse();
        next = createMockNext();
        req.user = { id: 'user123', _id: 'user123' };
        jest.clearAllMocks();
    });

    describe('globalSearch', () => {
        it('should return 400 if query is empty', async () => {
            req.query = { q: '' };

            await searchController.globalSearch(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Search query is required',
            });
        });

        it('should return 400 if query is missing', async () => {
            req.query = {};

            await searchController.globalSearch(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Search query is required',
            });
        });

        it('should return 400 if query is only whitespace', async () => {
            req.query = { q: '   ' };

            await searchController.globalSearch(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should search across lessons, classes, materials, and assessments', async () => {
            req.query = { q: 'math' };

            // Mock Lessons
            const mockLessons = [{
                _id: 'lesson1',
                communityData: { title: 'Math Lesson' },
                parameters: { specificTopic: 'Algebra', grade: '10' },
                classId: { subject: 'Mathematics' },
            }];

            // Mock Classes
            const mockClasses = [{
                _id: 'class1',
                className: 'Math 101',
                subject: 'Mathematics',
                grade: '10',
            }];

            // Mock Materials
            const mockMaterials = [{
                _id: 'mat1',
                name: 'Math Guide.pdf',
                type: 'pdf',
            }];

            // Mock Assessments
            const mockAssessments = [{
                _id: 'assess1',
                title: 'Math Quiz',
                description: 'Basic math quiz',
                lessonPlanId: null,
            }];

            // Setup mock chains - actual uses .limit().select().populate()
            Lesson.find = jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        populate: jest.fn().mockResolvedValue(mockLessons),
                    }),
                }),
            });

            Class.find = jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                    select: jest.fn().mockResolvedValue(mockClasses),
                }),
            });

            Material.find = jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                    select: jest.fn().mockResolvedValue(mockMaterials),
                }),
            });

            Assessment.find = jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        populate: jest.fn().mockResolvedValue(mockAssessments),
                    }),
                }),
            });

            await searchController.globalSearch(req, res);

            expect(Lesson.find).toHaveBeenCalled();
            expect(Class.find).toHaveBeenCalled();
            expect(Material.find).toHaveBeenCalled();
            expect(Assessment.find).toHaveBeenCalled();

            // Controller returns combined results with res.json (no status call)
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    count: 4,
                    data: expect.arrayContaining([
                        expect.objectContaining({ type: 'lesson' }),
                        expect.objectContaining({ type: 'class' }),
                        expect.objectContaining({ type: 'material' }),
                        expect.objectContaining({ type: 'assessment' }),
                    ]),
                })
            );
        });

        it('should return empty results when no matches found', async () => {
            req.query = { q: 'nonexistent' };

            Lesson.find = jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        populate: jest.fn().mockResolvedValue([]),
                    }),
                }),
            });

            Class.find = jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                    select: jest.fn().mockResolvedValue([]),
                }),
            });

            Material.find = jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                    select: jest.fn().mockResolvedValue([]),
                }),
            });

            Assessment.find = jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        populate: jest.fn().mockResolvedValue([]),
                    }),
                }),
            });

            await searchController.globalSearch(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                count: 0,
                data: [],
            });
        });

        it('should handle errors', async () => {
            req.query = { q: 'test' };

            Lesson.find = jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        populate: jest.fn().mockRejectedValue(new Error('DB Error')),
                    }),
                }),
            });

            await searchController.globalSearch(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Error performing search',
                })
            );
        });
    });
});
