/**
 * Unit Tests for Assessment Controller
 * Tests assessment generation and CRUD operations
 */

const { createMockRequest, createMockResponse, createMockNext } = require('../mocks/req-res');

// Mock dependencies
jest.mock('../../model/Assessment');
jest.mock('../../model/Lesson');
jest.mock('../../model/User');
jest.mock('../../services/assessmentGenerator');
jest.mock('../../services/contentStructurer');
jest.mock('../../utils/activityTypeMapper');

const Assessment = require('../../model/Assessment');
const LessonPlan = require('../../model/Lesson');
const User = require('../../model/User');
const AssessmentGenerator = require('../../services/assessmentGenerator');
const { structureGeneratedContent } = require('../../services/contentStructurer');
const { validateAndMapActivityType } = require('../../utils/activityTypeMapper');

const assessmentController = require('../../controller/assessmentController');

describe('Assessment Controller', () => {
    let req, res, next;

    beforeEach(() => {
        req = createMockRequest();
        res = createMockResponse();
        next = createMockNext();
        req.user = { id: 'user123', _id: 'user123' };
        jest.clearAllMocks();

        // Default mock implementations
        validateAndMapActivityType.mockReturnValue('assessment');
        structureGeneratedContent.mockReturnValue({
            activityHTML: '<div>Activity</div>',
            rubricHTML: '<div>Rubric</div>',
            hasStudentContent: true,
            hasTeacherContent: true,
        });
    });

    describe('createStandaloneAssessment', () => {
        it('should create standalone assessment successfully', async () => {
            req.body = {
                activityType: 'assessment',
                grade: 'Form 4',
                subject: 'English',
                assessmentTitle: 'Test Assessment',
                specificTopic: 'Grammar',
            };

            const mockUser = {
                _id: 'user123',
                getGeminiApiKey: jest.fn().mockReturnValue('fake-api-key'),
            };

            User.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser),
            });

            const mockGenerator = {
                generateByType: jest.fn().mockResolvedValue({
                    activityContent: '<div>Activity</div>',
                }),
            };
            AssessmentGenerator.mockImplementation(() => mockGenerator);

            const mockAssessment = {
                _id: 'assessment123',
                title: 'Test Assessment',
                activityType: 'assessment',
                generatedContent: {},
            };
            Assessment.create = jest.fn().mockResolvedValue(mockAssessment);

            await assessmentController.createStandaloneAssessment(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                })
            );
        });

        it('should return 401 if user not authenticated', async () => {
            req.user = null;
            req.body = {
                activityType: 'assessment',
                grade: 'Form 4',
                subject: 'English',
            };

            await assessmentController.createStandaloneAssessment(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('should return 400 if required fields are missing', async () => {
            req.body = { activityType: 'assessment' }; // Missing grade, subject

            await assessmentController.createStandaloneAssessment(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Missing required fields: activityType, grade, subject',
                })
            );
        });

        it('should return 404 if user not found', async () => {
            req.body = {
                activityType: 'assessment',
                grade: 'Form 4',
                subject: 'English',
            };

            User.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(null),
            });

            await assessmentController.createStandaloneAssessment(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return 400 if no Gemini API key', async () => {
            req.body = {
                activityType: 'assessment',
                grade: 'Form 4',
                subject: 'English',
            };

            const mockUser = {
                _id: 'user123',
                getGeminiApiKey: jest.fn().mockReturnValue(null),
            };

            User.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser),
            });

            await assessmentController.createStandaloneAssessment(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining('No Gemini API key found'),
                })
            );
        });
    });

    describe('generateFromLessonPlan', () => {
        it('should generate assessment from lesson plan successfully', async () => {
            req.body = {
                lessonPlanId: 'lesson123',
                classId: 'class123',
                lesson: 'Grammar Basics',
                subject: 'English',
                grade: 'Form 4',
                activityType: 'assessment',
            };

            const mockUser = {
                _id: 'user123',
                getGeminiApiKey: jest.fn().mockReturnValue('fake-api-key'),
            };

            User.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser),
            });

            const mockGenerator = {
                generateByType: jest.fn().mockResolvedValue({
                    activityContent: '<div>Activity</div>',
                }),
            };
            AssessmentGenerator.mockImplementation(() => mockGenerator);

            const mockAssessment = {
                _id: 'assessment123',
                title: 'Grammar Basics - assessment',
                activityType: 'assessment',
            };
            Assessment.create = jest.fn().mockResolvedValue(mockAssessment);
            LessonPlan.findByIdAndUpdate = jest.fn().mockResolvedValue({});

            await assessmentController.generateFromLessonPlan(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(Assessment.create).toHaveBeenCalled();
            expect(LessonPlan.findByIdAndUpdate).toHaveBeenCalledWith(
                'lesson123',
                expect.objectContaining({
                    assessmentStatus: 'generated',
                })
            );
        });

        it('should route to standalone if isStandalone is true', async () => {
            req.body = {
                isStandalone: true,
                activityType: 'assessment',
                grade: 'Form 4',
                subject: 'English',
            };

            const mockUser = {
                _id: 'user123',
                getGeminiApiKey: jest.fn().mockReturnValue('fake-api-key'),
            };

            User.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser),
            });

            const mockGenerator = {
                generateByType: jest.fn().mockResolvedValue({
                    activityContent: '<div>Activity</div>',
                }),
            };
            AssessmentGenerator.mockImplementation(() => mockGenerator);

            Assessment.create = jest.fn().mockResolvedValue({
                _id: 'assessment123',
                generatedContent: {},
            });

            await assessmentController.generateFromLessonPlan(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
        });

        it('should return 400 if required fields missing for lesson-based', async () => {
            req.body = {
                classId: 'class123',
                activityType: 'assessment',
            }; // Missing lessonPlanId, lesson

            await assessmentController.generateFromLessonPlan(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('getAssessments', () => {
        it('should return all assessments for user', async () => {
            req.query = {};

            const mockAssessments = [
                { _id: 'assessment1', title: 'Test 1' },
                { _id: 'assessment2', title: 'Test 2' },
            ];

            Assessment.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        sort: jest.fn().mockResolvedValue(mockAssessments),
                    }),
                }),
            });

            await assessmentController.getAssessments(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                count: 2,
                data: mockAssessments,
            });
        });

        it('should filter by classId', async () => {
            req.query = { classId: 'class123' };

            Assessment.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        sort: jest.fn().mockResolvedValue([]),
                    }),
                }),
            });

            await assessmentController.getAssessments(req, res);

            expect(Assessment.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    createdBy: 'user123',
                    classId: 'class123',
                })
            );
        });

        it('should filter by activityType', async () => {
            req.query = { activityType: 'essay' };

            Assessment.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        sort: jest.fn().mockResolvedValue([]),
                    }),
                }),
            });

            await assessmentController.getAssessments(req, res);

            expect(Assessment.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    activityType: 'essay',
                })
            );
        });
    });

    describe('getAssessmentById', () => {
        it('should return assessment by ID', async () => {
            req.params = { id: 'assessment123' };

            const mockAssessment = {
                _id: 'assessment123',
                title: 'Test Assessment',
                createdBy: { toString: () => 'user123' },
            };

            Assessment.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(mockAssessment),
                }),
            });

            await assessmentController.getAssessmentById(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockAssessment,
            });
        });

        it('should return 404 if assessment not found', async () => {
            req.params = { id: 'nonexistent' };

            Assessment.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(null),
                }),
            });

            await assessmentController.getAssessmentById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('updateAssessment', () => {
        it('should update assessment successfully', async () => {
            req.params = { id: 'assessment123' };
            req.body = { title: 'Updated Title' };

            const mockAssessment = {
                _id: 'assessment123',
                title: 'Original Title',
                createdBy: { toString: () => 'user123' },
                save: jest.fn().mockResolvedValue(true),
            };

            Assessment.findById = jest.fn().mockResolvedValue(mockAssessment);

            await assessmentController.updateAssessment(req, res);

            expect(mockAssessment.title).toBe('Updated Title');
            expect(mockAssessment.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return 404 if assessment not found', async () => {
            req.params = { id: 'nonexistent' };
            req.body = { title: 'Updated Title' };

            Assessment.findById = jest.fn().mockResolvedValue(null);

            await assessmentController.updateAssessment(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return 403 if user does not own assessment', async () => {
            req.params = { id: 'assessment123' };
            req.body = { title: 'Updated Title' };

            const mockAssessment = {
                _id: 'assessment123',
                createdBy: { toString: () => 'otheruser' },
            };

            Assessment.findById = jest.fn().mockResolvedValue(mockAssessment);

            await assessmentController.updateAssessment(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
        });
    });

    describe('deleteAssessment', () => {
        it('should delete assessment successfully', async () => {
            req.params = { id: 'assessment123' };

            const mockAssessment = {
                _id: 'assessment123',
                lessonPlanId: 'lesson123',
                activityType: 'assessment',
                createdBy: { toString: () => 'user123' },
                deleteOne: jest.fn().mockResolvedValue(true),
            };

            Assessment.findById = jest.fn().mockResolvedValue(mockAssessment);
            LessonPlan.findByIdAndUpdate = jest.fn().mockResolvedValue({});

            await assessmentController.deleteAssessment(req, res);

            expect(mockAssessment.deleteOne).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Assessment deleted successfully',
                data: {},
            });
        });

        it('should return 404 if assessment not found', async () => {
            req.params = { id: 'nonexistent' };

            Assessment.findById = jest.fn().mockResolvedValue(null);

            await assessmentController.deleteAssessment(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return 403 if user does not own assessment', async () => {
            req.params = { id: 'assessment123' };

            const mockAssessment = {
                _id: 'assessment123',
                createdBy: { toString: () => 'otheruser' },
            };

            Assessment.findById = jest.fn().mockResolvedValue(mockAssessment);

            await assessmentController.deleteAssessment(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
        });
    });

    describe('regenerateAssessment', () => {
        it('should regenerate assessment content', async () => {
            req.params = { id: 'assessment123' };
            req.body = {};

            const mockAssessment = {
                _id: 'assessment123',
                activityType: 'assessment',
                lessonPlanSnapshot: { title: 'Test' },
                createdBy: { toString: () => 'user123' },
                regenerationCount: 0,
                save: jest.fn().mockResolvedValue(true),
            };

            Assessment.findById = jest.fn().mockResolvedValue(mockAssessment);

            const mockUser = {
                _id: 'user123',
                getGeminiApiKey: jest.fn().mockReturnValue('fake-api-key'),
            };

            User.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser),
            });

            const mockGenerator = {
                generateByType: jest.fn().mockResolvedValue({
                    activityContent: '<div>New Activity</div>',
                }),
            };
            AssessmentGenerator.mockImplementation(() => mockGenerator);

            await assessmentController.regenerateAssessment(req, res);

            expect(mockAssessment.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return 404 if assessment not found', async () => {
            req.params = { id: 'nonexistent' };
            req.body = {};

            Assessment.findById = jest.fn().mockResolvedValue(null);

            await assessmentController.regenerateAssessment(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('recordUsage', () => {
        it('should record assessment usage', async () => {
            req.params = { id: 'assessment123' };

            const mockAssessment = {
                _id: 'assessment123',
                createdBy: { toString: () => 'user123' },
                recordUsage: jest.fn().mockResolvedValue(true),
            };

            Assessment.findById = jest.fn().mockResolvedValue(mockAssessment);

            await assessmentController.recordUsage(req, res);

            expect(mockAssessment.recordUsage).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return 404 if assessment not found', async () => {
            req.params = { id: 'nonexistent' };

            Assessment.findById = jest.fn().mockResolvedValue(null);

            await assessmentController.recordUsage(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });
});
