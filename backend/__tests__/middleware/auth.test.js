/**
 * Unit Tests for Auth Middleware
 * Tests protect, authorize, and checkPermission middleware
 * 
 * UPDATED: Matches actual auth.js middleware implementation exactly
 */

const { createMockRequest, createMockResponse, createMockNext } = require('../mocks/req-res');
const { createMockUser } = require('../mocks/models');

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../../model/User');
jest.mock('../../config/permissions', () => ({
    hasPermission: jest.fn((roles, permission) => {
        // Mock permission logic matching actual ROLE_PERMISSIONS structure
        // Admin has almost all permissions
        if (roles.includes('admin')) return true;
        if (roles.includes('super_admin')) return true;
        // Teacher has lesson/class/material permissions
        if (roles.includes('teacher')) {
            const teacherPerms = [
                'lesson:create', 'lesson:read', 'lesson:update', 'lesson:delete',
                'class:create', 'class:read', 'class:update', 'class:delete',
                'material:create', 'material:read', 'material:delete',
                'user:read', 'notification:read', 'notification:delete',
                'notification:mark-read', 'notification:mark-all-read',
            ];
            return teacherPerms.includes(permission);
        }
        return false;
    }),
}));

const jwt = require('jsonwebtoken');
const User = require('../../model/User');
const { hasPermission } = require('../../config/permissions');

const { protect, authorize, checkPermission, optionalAuth } = require('../../middleware/auth');

describe('Auth Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = createMockRequest();
        res = createMockResponse();
        next = createMockNext();
        jest.clearAllMocks();

        // Reset hasPermission mock implementation after clearAllMocks
        hasPermission.mockImplementation((roles, permission) => {
            if (roles.includes('admin')) return true;
            if (roles.includes('super_admin')) return true;
            if (roles.includes('teacher')) {
                const teacherPerms = [
                    'lesson:create', 'lesson:read', 'lesson:update', 'lesson:delete',
                    'class:create', 'class:read', 'class:update', 'class:delete',
                    'material:create', 'material:read', 'material:delete',
                    'user:read', 'notification:read', 'notification:delete',
                    'notification:mark-read', 'notification:mark-all-read',
                ];
                return teacherPerms.includes(permission);
            }
            return false;
        });
    });

    describe('protect', () => {
        it('should return 401 if no token is provided', async () => {
            req.headers = {};
            req.cookies = {};

            await protect(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Not authorized to access this route - No token provided',
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should authenticate with Bearer token in header', async () => {
            req.headers = { authorization: 'Bearer valid-token' };
            req.cookies = {};

            const mockUser = {
                _id: 'user123',
                name: 'Test User',
                isActive: true,
            };

            jwt.verify = jest.fn().mockReturnValue({ id: 'user123' });
            User.findById = jest.fn().mockResolvedValue(mockUser);

            await protect(req, res, next);

            expect(jwt.verify).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET);
            expect(User.findById).toHaveBeenCalledWith('user123');
            expect(req.user).toEqual(mockUser);
            expect(next).toHaveBeenCalled();
        });

        it('should authenticate with token in cookies', async () => {
            req.headers = {};
            req.cookies = { token: 'valid-cookie-token' };

            const mockUser = { _id: 'user123', isActive: true };
            jwt.verify = jest.fn().mockReturnValue({ id: 'user123' });
            User.findById = jest.fn().mockResolvedValue(mockUser);

            await protect(req, res, next);

            expect(jwt.verify).toHaveBeenCalledWith('valid-cookie-token', process.env.JWT_SECRET);
            expect(next).toHaveBeenCalled();
        });

        it('should return 401 if token is invalid', async () => {
            req.headers = { authorization: 'Bearer invalid-token' };
            req.cookies = {};

            jwt.verify = jest.fn().mockImplementation(() => {
                throw new Error('Invalid token');
            });

            await protect(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Not authorized to access this route - Invalid token',
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 if user not found', async () => {
            req.headers = { authorization: 'Bearer valid-token' };
            req.cookies = {};

            jwt.verify = jest.fn().mockReturnValue({ id: 'user123' });
            User.findById = jest.fn().mockResolvedValue(null);

            await protect(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'No user found with this token',
            });
        });

        it('should return 401 if user is inactive', async () => {
            req.headers = { authorization: 'Bearer valid-token' };
            req.cookies = {};

            const mockUser = { _id: 'user123', isActive: false };
            jwt.verify = jest.fn().mockReturnValue({ id: 'user123' });
            User.findById = jest.fn().mockResolvedValue(mockUser);

            await protect(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'User account has been deactivated',
            });
        });
    });

    describe('authorize', () => {
        it('should allow access if user has required role', () => {
            const middleware = authorize('admin', 'teacher');
            req.user = { _id: 'user123', roles: ['teacher'] };

            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('should deny access if user does not have required role', () => {
            const middleware = authorize('admin');
            req.user = { _id: 'user123', roles: ['teacher'] };

            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'User role(s) teacher are not authorized to access this route',
            });
        });

        it('should allow access if user has any of multiple allowed roles', () => {
            const middleware = authorize('admin', 'math_head', 'science_head');
            req.user = { _id: 'user123', roles: ['math_head'] };

            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('should handle user with single role (backward compatibility)', () => {
            const middleware = authorize('teacher');
            req.user = { _id: 'user123', role: 'teacher' }; // Using 'role' not 'roles'

            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('should return 401 if no user', () => {
            const middleware = authorize('admin');
            req.user = null;

            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Not authorized to access this route',
            });
        });
    });

    describe('checkPermission', () => {
        it('should allow access if user role has required permission', () => {
            const middleware = checkPermission('lesson:create');
            req.user = { _id: 'user123', roles: ['teacher'] };

            middleware(req, res, next);

            expect(hasPermission).toHaveBeenCalledWith(['teacher'], 'lesson:create');
            expect(next).toHaveBeenCalled();
        });

        it('should deny access if user role lacks required permission', () => {
            const middleware = checkPermission('user:delete'); // Not in teacher permissions
            req.user = { _id: 'user123', roles: ['teacher'] };

            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'You do not have permission to perform this action (user:delete)',
            });
        });

        it('should allow admin access to all permissions', () => {
            const middleware = checkPermission('user:delete');
            req.user = { _id: 'user123', roles: ['admin'] };

            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('should return 401 if no user', () => {
            const middleware = checkPermission('lesson:create');
            req.user = null;

            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
        });
    });

    describe('optionalAuth', () => {
        it('should continue without user if no token provided', async () => {
            req.headers = {};
            req.cookies = {};

            await optionalAuth(req, res, next);

            expect(req.user).toBeUndefined();
            expect(next).toHaveBeenCalled();
        });

        it('should attach user if valid token provided', async () => {
            req.headers = { authorization: 'Bearer valid-token' };
            req.cookies = {};

            const mockUser = { _id: 'user123', isActive: true };
            jwt.verify = jest.fn().mockReturnValue({ id: 'user123' });
            User.findById = jest.fn().mockResolvedValue(mockUser);

            await optionalAuth(req, res, next);

            expect(req.user).toEqual(mockUser);
            expect(next).toHaveBeenCalled();
        });

        it('should continue without user if token is invalid', async () => {
            req.headers = { authorization: 'Bearer invalid-token' };
            req.cookies = {};

            jwt.verify = jest.fn().mockImplementation(() => {
                throw new Error('Invalid token');
            });

            await optionalAuth(req, res, next);

            expect(req.user).toBeUndefined();
            expect(next).toHaveBeenCalled();
        });

        it('should not attach user if inactive', async () => {
            req.headers = { authorization: 'Bearer valid-token' };
            req.cookies = {};

            const mockUser = { _id: 'user123', isActive: false };
            jwt.verify = jest.fn().mockReturnValue({ id: 'user123' });
            User.findById = jest.fn().mockResolvedValue(mockUser);

            await optionalAuth(req, res, next);

            expect(req.user).toBeUndefined();
            expect(next).toHaveBeenCalled();
        });
    });
});
