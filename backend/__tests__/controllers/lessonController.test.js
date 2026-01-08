/**
 * Unit Tests for Lesson Controller
 * Tests lesson CRUD and approval workflow
 * 
 * UPDATED: Matches actual lessonController.js implementation
 */

const { createMockRequest, createMockResponse, createMockNext } = require('../mocks/req-res');
const { createMockLesson, createMockClass, createMockUser } = require('../mocks/models');

// Mock dependencies
jest.mock('../../model/Lesson');
jest.mock('../../model/Class');
jest.mock('../../model/User');
jest.mock('../../model/Assessment');
jest.mock('../../model/StudentAnswer');
jest.mock('../../utils/notificationHandler');

const LessonPlan = require('../../model/Lesson');
const Class = require('../../model/Class');
const User = require('../../model/User');
const Assessment = require('../../model/Assessment');
const StudentAnswer = require('../../model/StudentAnswer');

const lessonController = require('../../controller/lessonController');

describe('Lesson Controller', () => {
    let req, res, next;

    beforeEach(() => {
        req = createMockRequest();
        res = createMockResponse();
        next = createMockNext();
        req.user = { id: 'user123', _id: 'user123', roles: ['teacher'] };
        req.header = jest.fn().mockReturnValue(null); // No cache headers by default
        jest.clearAllMocks();
    });

    describe('saveLessonPlan', () => {
        it('should save a new lesson plan', async () => {
            req.body = {
                parameters: { classId: 'class123', specificTopic: 'Algebra' },
                plan: { learningObjective: 'Test objective' },
                date: new Date(),
            };

            const savedLesson = {
                _id: 'lesson123',
                createdBy: 'user123',
                classId: 'class123',
                parameters: req.body.parameters,
                plan: req.body.plan,
            };

            LessonPlan.create = jest.fn().mockResolvedValue(savedLesson);
            User.findByIdAndUpdate = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) });

            await lessonController.saveLessonPlan(req, res, next);

            expect(LessonPlan.create).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Lesson plan saved successfully!',
                data: savedLesson,
            });
        });

        it('should return 400 if classId is missing', async () => {
            req.body = { parameters: {}, plan: {} }; // Missing classId

            await lessonController.saveLessonPlan(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Class ID is missing in parameters.',
            });
        });
    });

    describe('getLessonPlanById', () => {
        it('should return a lesson by ID', async () => {
            req.params = { id: 'lesson123' };

            const mockLesson = {
                _id: 'lesson123',
                createdBy: { _id: { toString: () => 'user123' }, toString: () => 'user123' },
                classId: { className: 'Math 101' },
            };

            LessonPlan.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        populate: jest.fn().mockResolvedValue(mockLesson),
                    }),
                }),
            });

            await lessonController.getLessonPlanById(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockLesson,
            });
        });

        it('should return 404 if lesson not found', async () => {
            req.params = { id: 'nonexistent' };

            LessonPlan.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        populate: jest.fn().mockResolvedValue(null),
                    }),
                }),
            });

            await lessonController.getLessonPlanById(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Lesson plan not found with id of nonexistent',
            });
        });
    });

    describe('updateLessonPlan', () => {
        it('should update a lesson plan', async () => {
            req.params = { id: 'lesson123' };
            req.body = { plan: { learningObjective: 'Updated objective' } };

            const existingLesson = {
                _id: 'lesson123',
                createdBy: { toString: () => 'user123' },
                plan: {},
                save: jest.fn().mockResolvedValue(true),
            };

            LessonPlan.findById = jest.fn().mockResolvedValue(existingLesson);
            User.findByIdAndUpdate = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) });

            await lessonController.updateLessonPlan(req, res, next);

            expect(existingLesson.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: existingLesson,
            });
        });

        it('should return 404 if lesson not found', async () => {
            req.params = { id: 'nonexistent' };
            req.body = { plan: {} };

            LessonPlan.findById = jest.fn().mockResolvedValue(null);

            await lessonController.updateLessonPlan(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return 401 if user does not own lesson', async () => {
            req.params = { id: 'lesson123' };
            req.body = { plan: {} };

            const existingLesson = {
                _id: 'lesson123',
                createdBy: { toString: () => 'otheruser' },
            };

            LessonPlan.findById = jest.fn().mockResolvedValue(existingLesson);

            await lessonController.updateLessonPlan(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Not authorized to update this lesson plan',
            });
        });
    });

    describe('deleteLessonPlan', () => {
        it('should delete a lesson and related data', async () => {
            req.params = { id: 'lesson123' };

            const existingLesson = {
                _id: 'lesson123',
                createdBy: { toString: () => 'user123' },
                deleteOne: jest.fn().mockResolvedValue(true),
            };

            LessonPlan.findById = jest.fn().mockResolvedValue(existingLesson);
            Assessment.find = jest.fn().mockResolvedValue([]);
            User.findByIdAndUpdate = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) });

            await lessonController.deleteLessonPlan(req, res, next);

            expect(existingLesson.deleteOne).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'Lesson plan and all related data deleted successfully',
                })
            );
        });

        it('should cascade delete assessments and submissions', async () => {
            req.params = { id: 'lesson123' };

            const existingLesson = {
                _id: 'lesson123',
                createdBy: { toString: () => 'user123' },
                deleteOne: jest.fn().mockResolvedValue(true),
            };

            const mockAssessments = [{ _id: 'assess1' }, { _id: 'assess2' }];

            LessonPlan.findById = jest.fn().mockResolvedValue(existingLesson);
            Assessment.find = jest.fn().mockResolvedValue(mockAssessments);
            StudentAnswer.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 5 });
            Assessment.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 2 });
            User.findByIdAndUpdate = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) });

            await lessonController.deleteLessonPlan(req, res, next);

            expect(StudentAnswer.deleteMany).toHaveBeenCalled();
            expect(Assessment.deleteMany).toHaveBeenCalled();
        });

        it('should return 404 if lesson not found', async () => {
            req.params = { id: 'nonexistent' };

            LessonPlan.findById = jest.fn().mockResolvedValue(null);

            await lessonController.deleteLessonPlan(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return 401 if user does not own lesson', async () => {
            req.params = { id: 'lesson123' };

            const existingLesson = {
                _id: 'lesson123',
                createdBy: { toString: () => 'otheruser' },
            };

            LessonPlan.findById = jest.fn().mockResolvedValue(existingLesson);

            await lessonController.deleteLessonPlan(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
        });
    });

    describe('getAllUserLessonPlans', () => {
        it('should return all lessons for the user', async () => {
            const mockLessons = [
                { _id: 'lesson1', parameters: { specificTopic: 'Topic 1' } },
                { _id: 'lesson2', parameters: { specificTopic: 'Topic 2' } },
            ];

            // Mock checkIfDataModified helper return value
            User.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockReturnValue({
                        read: jest.fn().mockResolvedValue({ updatedAt: new Date() }),
                    }),
                }),
            });

            LessonPlan.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockResolvedValue(mockLessons),
                }),
            });

            await lessonController.getAllUserLessonPlans(req, res, next);

            expect(LessonPlan.find).toHaveBeenCalledWith({ createdBy: 'user123' });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                count: 2,
                data: mockLessons,
            });
        });
    });

    describe('getRecentLessonPlans', () => {
        it('should return 5 most recent lessons', async () => {
            const mockLessons = Array(5).fill(null).map((_, i) => ({ _id: `lesson${i}` }));

            User.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockReturnValue({
                        read: jest.fn().mockResolvedValue({ updatedAt: new Date() }),
                    }),
                }),
            });

            LessonPlan.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockReturnValue({
                        limit: jest.fn().mockResolvedValue(mockLessons),
                    }),
                }),
            });

            await lessonController.getRecentLessonPlans(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                count: 5,
                data: mockLessons,
            });
        });
    });

    describe('getLessonPlansByClass', () => {
        it('should return lessons filtered by class', async () => {
            req.params = { classId: 'class123' };
            const mockLessons = [{ _id: 'lesson1', classId: 'class123' }];

            LessonPlan.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockResolvedValue(mockLessons),
                }),
            });

            await lessonController.getLessonPlansByClass(req, res, next);

            expect(LessonPlan.find).toHaveBeenCalledWith({
                createdBy: 'user123',
                classId: 'class123',
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                count: 1,
                data: mockLessons,
            });
        });
    });
});
