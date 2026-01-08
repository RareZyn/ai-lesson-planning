/**
 * Unit Tests for Admin Controller
 * Tests teacher management, syllabus operations, and token generation
 * 
 * UPDATED: Matches actual adminController.js implementation
 */

const { createMockRequest, createMockResponse, createMockNext } = require('../mocks/req-res');
const { createMockUser } = require('../mocks/models');

// Mock dependencies
jest.mock('../../model/User');
jest.mock('../../model/RegistrationToken');
jest.mock('../../model/Syllabus');
jest.mock('../../model/AuditLog');
jest.mock('../../services/emailService');
jest.mock('../../config/firebaseAdmin', () => ({
    admin: { auth: () => ({ deleteUser: jest.fn() }) },
    firebaseApp: null,
}));

const User = require('../../model/User');
const RegistrationToken = require('../../model/RegistrationToken');
const Syllabus = require('../../model/Syllabus');
const AuditLog = require('../../model/AuditLog');
const { sendEmail } = require('../../services/emailService');

const adminController = require('../../controller/adminController');

describe('Admin Controller', () => {
    let req, res, next;

    beforeEach(() => {
        req = createMockRequest();
        res = createMockResponse();
        next = createMockNext();
        req.user = {
            id: 'admin123',
            _id: 'admin123',
            schoolId: { toString: () => 'school123' },
            roles: ['admin'],
        };
        jest.clearAllMocks();
    });

    describe('Teacher Management', () => {
        describe('getTeachersBySchool', () => {
            it('should return all teachers for the school', async () => {
                const mockTeachers = [
                    { _id: 'teacher1', name: 'Teacher 1', email: 'teacher1@test.com' },
                    { _id: 'teacher2', name: 'Teacher 2', email: 'teacher2@test.com' },
                ];

                // Match actual: User.find({ schoolId }).select(...).sort(...)
                User.find = jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        sort: jest.fn().mockResolvedValue(mockTeachers),
                    }),
                });

                await adminController.getTeachersBySchool(req, res);

                expect(User.find).toHaveBeenCalledWith({ schoolId: 'school123' });
                expect(res.status).toHaveBeenCalledWith(200);
                expect(res.json).toHaveBeenCalledWith({
                    success: true,
                    teachers: mockTeachers,
                });
            });

            it('should handle null schoolId (500 error from toString)', async () => {
                // The actual controller calls schoolId.toString() before the null check,
                // which throws an error when schoolId is null
                req.user.schoolId = null;

                await adminController.getTeachersBySchool(req, res);

                // Controller catches the error and returns 500
                expect(res.status).toHaveBeenCalledWith(500);
                expect(res.json).toHaveBeenCalledWith({
                    success: false,
                    message: 'Server error fetching teachers',
                });
            });
        });

        describe('deleteTeacher', () => {
            it('should delete a teacher', async () => {
                req.params = { id: 'teacher123' };

                const mockRequester = { schoolId: 'school123' };
                const mockTeacher = {
                    _id: 'teacher123',
                    name: 'Test Teacher',
                    email: 'teacher@test.com',
                };

                User.findById = jest.fn().mockResolvedValue(mockRequester);
                User.findOne = jest.fn().mockResolvedValue(mockTeacher);
                User.deleteOne = jest.fn().mockResolvedValue({ deletedCount: 1 });
                AuditLog.create = jest.fn().mockResolvedValue({});

                await adminController.deleteTeacher(req, res);

                expect(User.deleteOne).toHaveBeenCalledWith({ _id: 'teacher123' });
                expect(res.status).toHaveBeenCalledWith(200);
                expect(res.json).toHaveBeenCalledWith({
                    success: true,
                    message: 'Teacher deleted successfully',
                });
            });

            it('should return 404 if teacher not found', async () => {
                req.params = { id: 'nonexistent' };

                User.findById = jest.fn().mockResolvedValue({ schoolId: 'school123' });
                User.findOne = jest.fn().mockResolvedValue(null);

                await adminController.deleteTeacher(req, res);

                expect(res.status).toHaveBeenCalledWith(404);
                expect(res.json).toHaveBeenCalledWith({
                    success: false,
                    message: 'Teacher not found in your school',
                });
            });
        });
    });

    describe('Registration Token Management', () => {
        describe('generateTeacherRegistrationToken', () => {
            it('should generate a new registration token', async () => {
                req.body = { isMultiUse: false, expiryInDays: 7 };

                RegistrationToken.create = jest.fn().mockResolvedValue({
                    token: 'generated-token-123',
                    schoolId: 'school123',
                });

                await adminController.generateTeacherRegistrationToken(req, res);

                // Verify create was called with correct values
                expect(RegistrationToken.create).toHaveBeenCalled();
                const createCall = RegistrationToken.create.mock.calls[0][0];
                expect(createCall.createdBy).toBe('admin123');
                expect(createCall.isActive).toBe(true);
                expect(res.status).toHaveBeenCalledWith(201);
                expect(res.json).toHaveBeenCalledWith(
                    expect.objectContaining({
                        success: true,
                        message: 'Registration token generated successfully.',
                        token: 'generated-token-123',
                    })
                );
            });

            it('should return 400 if admin not associated with school', async () => {
                req.user.schoolId = null;
                req.body = {};

                await adminController.generateTeacherRegistrationToken(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    success: false,
                    message: 'Admin account is not associated with a school.',
                });
            });

            it('should return 400 for invalid maxUsage', async () => {
                req.body = { isMultiUse: true, maxUsage: -1 };

                await adminController.generateTeacherRegistrationToken(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    success: false,
                    message: 'maxUsage must be a positive number if isMultiUse is true.',
                });
            });
        });

        describe('getActiveTokens', () => {
            it('should return all active tokens', async () => {
                const mockTokens = [
                    { token: 'token1', createdAt: new Date() },
                    { token: 'token2', createdAt: new Date() },
                ];

                RegistrationToken.find = jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        populate: jest.fn().mockReturnValue({
                            sort: jest.fn().mockResolvedValue(mockTokens),
                        }),
                    }),
                });

                await adminController.getActiveTokens(req, res);

                expect(res.status).toHaveBeenCalledWith(200);
                expect(res.json).toHaveBeenCalledWith({
                    success: true,
                    data: mockTokens,
                });
            });

            it('should return 400 if no schoolId', async () => {
                req.user.schoolId = null;

                await adminController.getActiveTokens(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    success: false,
                    message: 'Admin account is not associated with a school.',
                });
            });
        });
    });

    describe('Syllabus Management', () => {
        describe('uploadSyllabus', () => {
            it('should upload new syllabus', async () => {
                req.body = {
                    subject: 'Mathematics',
                    grade: 'Form 4',
                    syllabusData: [{ content: 'Unit 1' }],
                };

                User.findById = jest.fn().mockResolvedValue({ schoolId: 'school123' });
                Syllabus.create = jest.fn().mockResolvedValue({
                    _id: 'syllabus123',
                    subject: 'Mathematics',
                });

                await adminController.uploadSyllabus(req, res);

                expect(Syllabus.create).toHaveBeenCalled();
                expect(res.status).toHaveBeenCalledWith(201);
                expect(res.json).toHaveBeenCalledWith(
                    expect.objectContaining({
                        success: true,
                        message: 'Syllabus uploaded successfully',
                        syllabusId: 'syllabus123',
                    })
                );
            });

            it('should return 400 if no syllabus data', async () => {
                req.body = { subject: 'Math', grade: 'Form 4' }; // Missing syllabusData

                await adminController.uploadSyllabus(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    success: false,
                    message: 'No syllabus data provided',
                });
            });

            it('should return 400 if missing subject or grade', async () => {
                req.body = { syllabusData: [{}] }; // Missing subject and grade

                await adminController.uploadSyllabus(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    success: false,
                    message: 'Subject and grade are required',
                });
            });
        });

        describe('getSyllabuses', () => {
            it('should return all syllabuses for the school', async () => {
                const mockSyllabuses = [
                    { _id: 'syl1', subject: 'Math', grade: 'Form 4', syllabus: [], createdBy: { name: 'Admin' } },
                ];

                User.findById = jest.fn().mockResolvedValue({ schoolId: 'school123' });
                Syllabus.find = jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        sort: jest.fn().mockReturnValue({
                            lean: jest.fn().mockResolvedValue(mockSyllabuses),
                        }),
                    }),
                });

                await adminController.getSyllabuses(req, res);

                expect(res.status).toHaveBeenCalledWith(200);
                expect(res.json).toHaveBeenCalledWith(
                    expect.objectContaining({
                        success: true,
                        data: expect.any(Array),
                    })
                );
            });

            it('should return 400 if user not assigned to school', async () => {
                User.findById = jest.fn().mockResolvedValue({ schoolId: null });

                await adminController.getSyllabuses(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    success: false,
                    message: 'User not assigned to a school',
                });
            });
        });

        describe('deleteSyllabus', () => {
            it('should delete a syllabus', async () => {
                req.params = { id: 'syllabus123' };

                User.findById = jest.fn().mockResolvedValue({ schoolId: 'school123' });
                Syllabus.findOneAndDelete = jest.fn().mockResolvedValue({
                    _id: 'syllabus123',
                });

                await adminController.deleteSyllabus(req, res);

                expect(Syllabus.findOneAndDelete).toHaveBeenCalledWith({
                    _id: 'syllabus123',
                    schoolId: 'school123',
                });
                expect(res.status).toHaveBeenCalledWith(200);
                expect(res.json).toHaveBeenCalledWith({
                    success: true,
                    message: 'Syllabus deleted successfully',
                    deletedId: 'syllabus123',
                });
            });

            it('should return 404 if syllabus not found', async () => {
                req.params = { id: 'nonexistent' };

                User.findById = jest.fn().mockResolvedValue({ schoolId: 'school123' });
                Syllabus.findOneAndDelete = jest.fn().mockResolvedValue(null);

                await adminController.deleteSyllabus(req, res);

                expect(res.status).toHaveBeenCalledWith(404);
                expect(res.json).toHaveBeenCalledWith({
                    success: false,
                    message: "Syllabus not found or you don't have permission to delete it",
                });
            });
        });
    });
});
