/**
 * Unit Tests for Student Controller
 * Tests student CRUD operations
 */

const { createMockRequest, createMockResponse, createMockNext } = require('../mocks/req-res');
const { createMockClass, createMockStudent } = require('../mocks/models');

// Mock dependencies
jest.mock('../../model/Student');
jest.mock('../../model/Class');

const Student = require('../../model/Student');
const Class = require('../../model/Class');

const studentController = require('../../controller/studentController');

describe('Student Controller', () => {
    let req, res, next;

    beforeEach(() => {
        req = createMockRequest();
        res = createMockResponse();
        next = createMockNext();
        req.user = { id: 'user123', _id: 'user123' };
        jest.clearAllMocks();
    });

    describe('addStudent', () => {
        it('should add a new student successfully', async () => {
            req.body = {
                name: 'John Doe',
                classId: 'class123',
                rollNumber: 1,
                gender: 'male',
            };

            const mockClass = {
                _id: 'class123',
                grade: 'Form 4',
                createdBy: { toString: () => 'user123' },
                addStudent: jest.fn().mockResolvedValue(true),
            };

            const mockStudent = {
                _id: 'student123',
                name: 'John Doe',
                studentId: 'STU-2025-0001',
                classId: 'class123',
                populate: jest.fn().mockResolvedValue(this),
            };

            Class.findById = jest.fn().mockResolvedValue(mockClass);
            Student.create = jest.fn().mockResolvedValue(mockStudent);
            mockStudent.populate = jest.fn().mockResolvedValue(mockStudent);

            await studentController.addStudent(req, res);

            expect(Class.findById).toHaveBeenCalledWith('class123');
            expect(Student.create).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'Student added successfully',
                })
            );
        });

        it('should return 400 if required fields are missing', async () => {
            req.body = { name: 'John Doe' }; // Missing classId

            await studentController.addStudent(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Missing required fields: name and classId',
                })
            );
        });

        it('should return 404 if class not found', async () => {
            req.body = { name: 'John Doe', classId: 'nonexistent' };

            Class.findById = jest.fn().mockResolvedValue(null);

            await studentController.addStudent(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Class not found',
                })
            );
        });

        it('should return 403 if user does not own the class', async () => {
            req.body = { name: 'John Doe', classId: 'class123' };

            const mockClass = {
                _id: 'class123',
                createdBy: { toString: () => 'otheruser' },
            };

            Class.findById = jest.fn().mockResolvedValue(mockClass);

            await studentController.addStudent(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Not authorized to add students to this class',
                })
            );
        });
    });

    describe('getStudentsByClass', () => {
        it('should return all students for a class', async () => {
            req.params = { classId: 'class123' };
            req.query = {};

            const mockClass = {
                _id: 'class123',
                createdBy: { toString: () => 'user123' },
            };

            const mockStudents = [
                { _id: 'student1', name: 'John Doe' },
                { _id: 'student2', name: 'Jane Doe' },
            ];

            Class.findById = jest.fn().mockResolvedValue(mockClass);
            Student.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockResolvedValue(mockStudents),
                }),
            });

            await studentController.getStudentsByClass(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                count: 2,
                data: mockStudents,
            });
        });

        it('should return 404 if class not found', async () => {
            req.params = { classId: 'nonexistent' };
            req.query = {};

            Class.findById = jest.fn().mockResolvedValue(null);

            await studentController.getStudentsByClass(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return 403 if user does not own the class', async () => {
            req.params = { classId: 'class123' };
            req.query = {};

            const mockClass = {
                _id: 'class123',
                createdBy: { toString: () => 'otheruser' },
            };

            Class.findById = jest.fn().mockResolvedValue(mockClass);

            await studentController.getStudentsByClass(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
        });

        it('should filter students by search query', async () => {
            req.params = { classId: 'class123' };
            req.query = { search: 'John' };

            const mockClass = {
                _id: 'class123',
                createdBy: { toString: () => 'user123' },
            };

            Class.findById = jest.fn().mockResolvedValue(mockClass);
            Student.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockResolvedValue([]),
                }),
            });

            await studentController.getStudentsByClass(req, res);

            expect(Student.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    classId: 'class123',
                    $or: expect.any(Array),
                })
            );
        });
    });

    describe('getStudentById', () => {
        it('should return a student by ID', async () => {
            req.params = { id: 'student123' };

            const mockStudent = {
                _id: 'student123',
                name: 'John Doe',
                classId: 'class123',
            };

            const mockClass = {
                _id: 'class123',
                createdBy: { toString: () => 'user123' },
            };

            Student.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(mockStudent),
                }),
            });
            Class.findById = jest.fn().mockResolvedValue(mockClass);

            await studentController.getStudentById(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockStudent,
            });
        });

        it('should return 404 if student not found', async () => {
            req.params = { id: 'nonexistent' };

            Student.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(null),
                }),
            });

            await studentController.getStudentById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('updateStudent', () => {
        it('should update student information', async () => {
            req.params = { id: 'student123' };
            req.body = { name: 'John Updated', rollNumber: 5 };

            const mockStudent = {
                _id: 'student123',
                name: 'John Doe',
                classId: 'class123',
                save: jest.fn().mockResolvedValue(true),
                populate: jest.fn().mockResolvedValue(this),
            };

            const mockClass = {
                _id: 'class123',
                createdBy: { toString: () => 'user123' },
            };

            Student.findById = jest.fn().mockResolvedValue(mockStudent);
            Class.findById = jest.fn().mockResolvedValue(mockClass);

            await studentController.updateStudent(req, res);

            expect(mockStudent.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'Student updated successfully',
                })
            );
        });

        it('should return 404 if student not found', async () => {
            req.params = { id: 'nonexistent' };
            req.body = { name: 'John Updated' };

            Student.findById = jest.fn().mockResolvedValue(null);

            await studentController.updateStudent(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return 403 if user does not own the class', async () => {
            req.params = { id: 'student123' };
            req.body = { name: 'John Updated' };

            const mockStudent = {
                _id: 'student123',
                classId: 'class123',
            };

            const mockClass = {
                _id: 'class123',
                createdBy: { toString: () => 'otheruser' },
            };

            Student.findById = jest.fn().mockResolvedValue(mockStudent);
            Class.findById = jest.fn().mockResolvedValue(mockClass);

            await studentController.updateStudent(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
        });
    });

    describe('deleteStudent', () => {
        it('should delete a student', async () => {
            req.params = { id: 'student123' };

            const mockStudent = {
                _id: 'student123',
                classId: 'class123',
                deleteOne: jest.fn().mockResolvedValue(true),
            };

            const mockClass = {
                _id: 'class123',
                createdBy: { toString: () => 'user123' },
                removeStudent: jest.fn().mockResolvedValue(true),
            };

            Student.findById = jest.fn().mockResolvedValue(mockStudent);
            Class.findById = jest.fn().mockResolvedValue(mockClass);

            await studentController.deleteStudent(req, res);

            expect(mockClass.removeStudent).toHaveBeenCalledWith('student123');
            expect(mockStudent.deleteOne).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Student deleted successfully',
                data: {},
            });
        });

        it('should return 404 if student not found', async () => {
            req.params = { id: 'nonexistent' };

            Student.findById = jest.fn().mockResolvedValue(null);

            await studentController.deleteStudent(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('searchStudents', () => {
        it('should search students across all classes', async () => {
            req.query = { query: 'John' };

            const mockClasses = [{ _id: 'class1' }, { _id: 'class2' }];
            const mockStudents = [{ _id: 'student1', name: 'John Doe' }];

            Class.find = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(mockClasses),
            });

            Student.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockReturnValue({
                        limit: jest.fn().mockResolvedValue(mockStudents),
                    }),
                }),
            });

            await studentController.searchStudents(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                count: 1,
                data: mockStudents,
            });
        });

        it('should return 400 if query is too short', async () => {
            req.query = { query: 'J' };

            await studentController.searchStudents(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Search query must be at least 2 characters',
                })
            );
        });
    });

    describe('bulkImportStudents', () => {
        it('should bulk import students successfully', async () => {
            req.body = {
                classId: 'class123',
                students: [
                    { name: 'Student 1' },
                    { name: 'Student 2' },
                ],
            };

            const mockClass = {
                _id: 'class123',
                grade: 'Form 4',
                createdBy: { toString: () => 'user123' },
                addStudent: jest.fn().mockResolvedValue(true),
            };

            Class.findById = jest.fn().mockResolvedValue(mockClass);
            Student.create = jest.fn().mockResolvedValue({ _id: 'newStudent' });

            await studentController.bulkImportStudents(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                })
            );
        });

        it('should return 400 if no students provided', async () => {
            req.body = { classId: 'class123', students: [] };

            await studentController.bulkImportStudents(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 404 if class not found', async () => {
            req.body = {
                classId: 'nonexistent',
                students: [{ name: 'Student 1' }],
            };

            Class.findById = jest.fn().mockResolvedValue(null);

            await studentController.bulkImportStudents(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('updatePerformanceStats', () => {
        it('should update student performance stats', async () => {
            req.params = { id: 'student123' };

            const mockStudent = {
                _id: 'student123',
                performanceStats: { totalAssessments: 5, averageScore: 80 },
                updatePerformanceStats: jest.fn().mockResolvedValue(true),
            };

            Student.findById = jest.fn().mockResolvedValue(mockStudent);

            await studentController.updatePerformanceStats(req, res);

            expect(mockStudent.updatePerformanceStats).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return 404 if student not found', async () => {
            req.params = { id: 'nonexistent' };

            Student.findById = jest.fn().mockResolvedValue(null);

            await studentController.updatePerformanceStats(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });
});
