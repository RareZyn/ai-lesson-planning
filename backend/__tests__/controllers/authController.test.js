/**
 * Unit Tests for Auth Controller
 * Tests authentication, login, registration, and token management
 * 
 * UPDATED: Matches actual authController.js implementation
 */

const { createMockRequest, createMockResponse, createMockNext } = require('../mocks/req-res');
const { createMockUser, createMockSchool, createMockRegistrationToken } = require('../mocks/models');

// Mock dependencies before requiring controller
jest.mock('../../model/User');
jest.mock('../../model/School');
jest.mock('../../model/RegistrationToken');
jest.mock('jsonwebtoken');
jest.mock('express-validator', () => ({
    validationResult: jest.fn(() => ({
        isEmpty: () => true,
        array: () => [],
    })),
}));

const User = require('../../model/User');
const School = require('../../model/School');
const RegistrationToken = require('../../model/RegistrationToken');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Import controller after mocks are set up
const authController = require('../../controller/authController');

describe('Auth Controller', () => {
    let req, res, next;

    beforeEach(() => {
        req = createMockRequest();
        res = createMockResponse();
        next = createMockNext();
        jest.clearAllMocks();

        // Reset validationResult mock
        validationResult.mockReturnValue({
            isEmpty: () => true,
            array: () => [],
        });
    });

    describe('login', () => {
        it('should return 400 for validation errors', async () => {
            validationResult.mockReturnValue({
                isEmpty: () => false,
                array: () => [{ msg: 'Email required' }],
            });
            req.body = { password: 'password123' };

            await authController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Validation failed',
                })
            );
        });

        it('should return 401 if user not found', async () => {
            req.body = { email: 'notfound@example.com', password: 'password123' };

            // Match actual: User.findByEmail().select('+password').populate('schoolId')
            User.findByEmail = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(null),
                }),
            });

            await authController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid credentials',
            });
        });

        it('should return 401 if account is deactivated', async () => {
            req.body = { email: 'test@example.com', password: 'password123' };

            const mockUser = {
                _id: 'user123',
                email: 'test@example.com',
                password: 'hashedpassword',
                isActive: false,
            };

            User.findByEmail = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(mockUser),
                }),
            });

            await authController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Account has been deactivated',
            });
        });

        it('should return 401 if no password (Google user)', async () => {
            req.body = { email: 'test@example.com', password: 'password123' };

            const mockUser = {
                _id: 'user123',
                email: 'test@example.com',
                password: null, // Google user without password
                isActive: true,
            };

            User.findByEmail = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(mockUser),
                }),
            });

            await authController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Please use Google sign-in for this account',
            });
        });

        it('should return 401 if password is incorrect', async () => {
            req.body = { email: 'test@example.com', password: 'wrongpassword' };

            const mockUser = {
                _id: 'user123',
                email: 'test@example.com',
                password: 'hashedpassword',
                isActive: true,
                comparePassword: jest.fn().mockResolvedValue(false),
            };

            User.findByEmail = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(mockUser),
                }),
            });

            await authController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid credentials',
            });
        });

        it('should return 200 with token on successful login', async () => {
            req.body = { email: 'test@example.com', password: 'password123' };

            const mockUser = {
                _id: 'user123',
                email: 'test@example.com',
                password: 'hashedpassword',
                isActive: true,
                role: 'teacher',
                schoolId: 'school123',
                geminiApiKey: null,
                lastLogin: null,
                comparePassword: jest.fn().mockResolvedValue(true),
                save: jest.fn().mockResolvedValue(true),
                toJSON: jest.fn().mockReturnValue({
                    _id: 'user123',
                    email: 'test@example.com',
                    name: 'Test User',
                }),
            };

            User.findByEmail = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(mockUser),
                }),
            });

            jwt.sign = jest.fn().mockReturnValue('mock-jwt-token');

            await authController.login(req, res);

            expect(mockUser.save).toHaveBeenCalled(); // Updates lastLogin
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.cookie).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'Login successful',
                    token: 'mock-jwt-token',
                })
            );
        });
    });

    describe('getMe', () => {
        it('should return user profile when authenticated', async () => {
            req.user = { id: 'user123' };

            const mockUser = {
                _id: 'user123',
                name: 'Test User',
                email: 'test@example.com',
                role: 'teacher',
                schoolId: { _id: 'school123', name: 'Test School' },
                geminiApiKey: null,
                toJSON: jest.fn().mockReturnValue({
                    _id: 'user123',
                    name: 'Test User',
                    email: 'test@example.com',
                }),
            };

            User.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(mockUser),
                }),
            });

            await authController.getMe(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    user: expect.any(Object),
                })
            );
        });

        it('should return 404 if user not found', async () => {
            req.user = { id: 'nonexistent' };

            User.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(null),
                }),
            });

            await authController.getMe(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'User not found',
            });
        });
    });

    describe('logout', () => {
        it('should clear cookie and return success', () => {
            authController.logout(req, res);

            expect(res.cookie).toHaveBeenCalledWith(
                'token',
                'none',
                expect.any(Object)
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Logged out successfully',
            });
        });
    });

    describe('registerSchool', () => {
        it('should return 400 if required fields are missing', async () => {
            req.body = { name: 'Test User' }; // missing email, schoolName

            await authController.registerSchool(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'School name, email, and name are required.',
            });
        });

        it('should return 400 if school already exists', async () => {
            req.body = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                schoolName: 'Existing School',
            };

            School.findOne = jest.fn().mockResolvedValue({ _id: 'school123' });

            await authController.registerSchool(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'A school with this name already exists. Use an invitation code to join.',
            });
        });

        it('should return 400 if user already exists', async () => {
            req.body = {
                name: 'Test User',
                email: 'existing@example.com',
                password: 'password123',
                schoolName: 'New School',
            };

            School.findOne = jest.fn().mockResolvedValue(null);
            User.findByEmail = jest.fn().mockResolvedValue({ _id: 'user123' });

            await authController.registerSchool(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'User already exists with this email.',
            });
        });

        it('should create school and admin user successfully', async () => {
            req.body = {
                name: 'New Admin',
                email: 'newadmin@example.com',
                password: 'password123',
                schoolName: 'New School',
            };

            School.findOne = jest.fn().mockResolvedValue(null);
            User.findByEmail = jest.fn().mockResolvedValue(null);

            const mockSchool = { _id: 'school123', name: 'New School' };
            const mockUser = {
                _id: 'user123',
                name: 'New Admin',
                email: 'newadmin@example.com',
                role: 'admin',
                schoolId: 'school123',
                toJSON: () => ({ _id: 'user123', name: 'New Admin' }),
            };

            School.create = jest.fn().mockResolvedValue(mockSchool);
            User.create = jest.fn().mockResolvedValue(mockUser);
            jwt.sign = jest.fn().mockReturnValue('mock-jwt-token');

            await authController.registerSchool(req, res);

            expect(School.create).toHaveBeenCalled();
            expect(User.create).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'School registered successfully! You are now the admin.',
                })
            );
        });
    });

    describe('changePassword', () => {
        it('should return 400 if new password is missing', async () => {
            req.user = { id: 'user123' };
            req.body = { currentPassword: 'old123' };

            await authController.changePassword(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'New password is required',
            });
        });

        it('should allow setting initial password for Google users', async () => {
            req.user = { id: 'user123' };
            req.body = { newPassword: 'newpassword123' };

            const mockUser = {
                _id: 'user123',
                password: null, // No password (Google user)
                save: jest.fn().mockResolvedValue(true),
            };

            User.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser),
            });

            await authController.changePassword(req, res);

            expect(mockUser.password).toBe('newpassword123');
            expect(mockUser.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Password set successfully. You can now login with email and password.',
            });
        });

        it('should require current password for existing password users', async () => {
            req.user = { id: 'user123' };
            req.body = { newPassword: 'newpassword123' }; // Missing currentPassword

            const mockUser = {
                _id: 'user123',
                password: 'existingpassword',
            };

            User.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser),
            });

            await authController.changePassword(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Current password is required',
            });
        });
    });
});
