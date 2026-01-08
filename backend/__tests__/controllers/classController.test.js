/**
 * Unit Tests for Class Controller
 * Tests class CRUD operations
 * 
 * UPDATED: Matches actual classController.js implementation
 */

const { createMockRequest, createMockResponse, createMockNext } = require('../mocks/req-res');
const { createMockClass, createMockUser } = require('../mocks/models');

// Mock dependencies
jest.mock('../../model/Class');
jest.mock('../../model/Lesson');

const Class = require('../../model/Class');
const LessonPlan = require('../../model/Lesson');

const classController = require('../../controller/classController');

describe('Class Controller', () => {
    let req, res, next;

    beforeEach(() => {
        req = createMockRequest();
        res = createMockResponse();
        next = createMockNext();
        req.user = { id: 'user123', _id: 'user123' };
        jest.clearAllMocks();
    });

    describe('getClasses', () => {
        it('should return all classes for the user', async () => {
            req.query = {};
            const mockClasses = [
                { _id: 'class1', className: 'Math 101' },
                { _id: 'class2', className: 'Science 101' },
            ];

            Class.find = jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue(mockClasses),
            });

            await classController.getClasses(req, res);

            expect(Class.find).toHaveBeenCalledWith({ createdBy: 'user123' });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                count: 2,
                data: mockClasses,
            });
        });

        it('should filter by year if provided', async () => {
            req.query = { year: '2024' };

            Class.find = jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue([]),
            });

            await classController.getClasses(req, res);

            expect(Class.find).toHaveBeenCalledWith({ createdBy: 'user123', year: '2024' });
        });

        it('should filter by subject if provided', async () => {
            req.query = { subject: 'Mathematics' };

            Class.find = jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue([]),
            });

            await classController.getClasses(req, res);

            expect(Class.find).toHaveBeenCalledWith({ createdBy: 'user123', subject: 'Mathematics' });
        });

        it('should handle errors', async () => {
            req.query = {};

            Class.find = jest.fn().mockReturnValue({
                sort: jest.fn().mockRejectedValue(new Error('DB Error')),
            });

            await classController.getClasses(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Server Error',
            });
        });
    });

    describe('getClassById', () => {
        it('should return a class by ID', async () => {
            req.params = { id: 'class123' };
            const mockClass = { _id: 'class123', className: 'Math 101' };

            Class.findById = jest.fn().mockResolvedValue(mockClass);

            await classController.getClassById(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockClass,
            });
        });

        it('should return 404 if class not found', async () => {
            req.params = { id: 'nonexistent' };

            Class.findById = jest.fn().mockResolvedValue(null);

            await classController.getClassById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Class not found',
            });
        });
    });

    describe('createClass', () => {
        it('should create a new class', async () => {
            req.body = {
                className: 'Year 10 Math',
                subject: 'Mathematics',
                grade: '10',
                year: '2024',
            };

            const savedClass = { _id: 'class123', ...req.body, createdBy: 'user123' };
            Class.create = jest.fn().mockResolvedValue(savedClass);

            await classController.createClass(req, res);

            expect(Class.create).toHaveBeenCalledWith({
                className: 'Year 10 Math',
                subject: 'Mathematics',
                grade: '10',
                year: '2024',
                createdBy: 'user123',
            });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: savedClass,
            });
        });

        it('should return 400 for duplicate class', async () => {
            req.body = { className: 'Existing Class' };

            const duplicateError = new Error('Duplicate');
            duplicateError.code = 11000;
            Class.create = jest.fn().mockRejectedValue(duplicateError);

            await classController.createClass(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Class already exists',
            });
        });

        it('should return 400 for validation errors', async () => {
            req.body = {};

            const validationError = new Error('Validation');
            validationError.name = 'ValidationError';
            validationError.errors = {
                className: { message: 'className is required' },
            };
            Class.create = jest.fn().mockRejectedValue(validationError);

            await classController.createClass(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: ['className is required'],
            });
        });
    });

    describe('updateClass', () => {
        it('should update an existing class', async () => {
            req.params = { id: 'class123' };
            req.body = { className: 'Updated Class Name' };

            const existingClass = {
                _id: 'class123',
                createdBy: { toString: () => 'user123' },
            };
            const updatedClass = { _id: 'class123', className: 'Updated Class Name' };

            Class.findById = jest.fn().mockResolvedValue(existingClass);
            Class.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedClass);

            await classController.updateClass(req, res, next);

            expect(Class.findByIdAndUpdate).toHaveBeenCalledWith(
                'class123',
                req.body,
                { new: true, runValidators: true }
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: updatedClass,
            });
        });

        it('should return 404 if class not found', async () => {
            req.params = { id: 'nonexistent' };
            req.body = { className: 'Updated' };

            Class.findById = jest.fn().mockResolvedValue(null);

            await classController.updateClass(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Class not found',
            });
        });

        it('should return 401 if user does not own the class', async () => {
            req.params = { id: 'class123' };
            req.body = { className: 'Updated' };

            const existingClass = {
                _id: 'class123',
                createdBy: { toString: () => 'otheruser' },
            };
            Class.findById = jest.fn().mockResolvedValue(existingClass);

            await classController.updateClass(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Not authorized to update this class',
            });
        });
    });

    describe('deleteClass', () => {
        it('should delete a class and its lessons', async () => {
            req.params = { id: 'class123' };

            const existingClass = {
                _id: 'class123',
                createdBy: { toString: () => 'user123' },
                deleteOne: jest.fn().mockResolvedValue(true),
            };

            Class.findById = jest.fn().mockResolvedValue(existingClass);
            LessonPlan.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 5 });

            await classController.deleteClass(req, res, next);

            expect(LessonPlan.deleteMany).toHaveBeenCalledWith({ classId: 'class123' });
            expect(existingClass.deleteOne).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: {},
            });
        });

        it('should return 404 if class not found', async () => {
            req.params = { id: 'nonexistent' };

            Class.findById = jest.fn().mockResolvedValue(null);

            await classController.deleteClass(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Class not found',
            });
        });

        it('should return 401 if user does not own the class', async () => {
            req.params = { id: 'class123' };

            const existingClass = {
                _id: 'class123',
                createdBy: { toString: () => 'otheruser' },
            };
            Class.findById = jest.fn().mockResolvedValue(existingClass);

            await classController.deleteClass(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
        });
    });

    describe('getClassesByYear', () => {
        it('should return classes filtered by year', async () => {
            req.params = { year: '2024' };
            const mockClasses = [{ _id: 'class1', year: '2024' }];

            Class.find = jest.fn().mockResolvedValue(mockClasses);

            await classController.getClassesByYear(req, res);

            expect(Class.find).toHaveBeenCalledWith({ year: '2024' });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                count: 1,
                data: mockClasses,
            });
        });
    });

    describe('getClassesBySubject', () => {
        it('should return classes filtered by subject', async () => {
            req.params = { subject: 'Mathematics' };
            const mockClasses = [{ _id: 'class1', subject: 'Mathematics' }];

            Class.find = jest.fn().mockResolvedValue(mockClasses);

            await classController.getClassesBySubject(req, res);

            expect(Class.find).toHaveBeenCalledWith({ subject: 'Mathematics' });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                count: 1,
                data: mockClasses,
            });
        });
    });

    describe('getRecentClasses', () => {
        it('should return 5 most recently updated classes', async () => {
            const mockClasses = Array(5).fill(null).map((_, i) => ({ _id: `class${i}` }));

            Class.find = jest.fn().mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue(mockClasses),
                }),
            });

            await classController.getRecentClasses(req, res, next);

            expect(Class.find).toHaveBeenCalledWith({ createdBy: 'user123' });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockClasses,
            });
        });
    });
});
