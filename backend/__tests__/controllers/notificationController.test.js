/**
 * Unit Tests for Notification Controller
 * Tests notification CRUD operations
 * 
 * UPDATED: Matches actual notificationController.js implementation
 */

const { createMockRequest, createMockResponse, createMockNext } = require('../mocks/req-res');
const { createMockNotification, createMockUser } = require('../mocks/models');
const { createMockIO } = require('../mocks/socket');

// Mock dependencies
jest.mock('../../model/Notification');

const Notification = require('../../model/Notification');

const notificationController = require('../../controller/notificationController');

describe('Notification Controller', () => {
    let req, res, next, mockIO;

    beforeEach(() => {
        jest.clearAllMocks();

        // Create fresh mocks after clearAllMocks
        mockIO = createMockIO();
        req = createMockRequest();
        res = createMockResponse();
        next = createMockNext();

        // Set up app.get to return mockIO AFTER creating the mock
        req.app = { get: jest.fn().mockReturnValue(mockIO) };
        req.user = { id: 'user123', _id: 'user123' };
    });

    describe('getNotifications', () => {
        it('should return all notifications for the user', async () => {
            const mockNotifications = [
                { _id: 'notif1', recipient: 'user123', message: 'Test 1' },
                { _id: 'notif2', recipient: 'user123', message: 'Test 2' },
            ];

            // Match actual implementation: find({ recipient: req.user.id })
            Notification.find = jest.fn().mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        populate: jest.fn().mockResolvedValue(mockNotifications),
                    }),
                }),
            });

            await notificationController.getNotifications(req, res);

            expect(Notification.find).toHaveBeenCalledWith({ recipient: 'user123' });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockNotifications,
            });
        });

        it('should return empty array if no notifications', async () => {
            Notification.find = jest.fn().mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        populate: jest.fn().mockResolvedValue([]),
                    }),
                }),
            });

            await notificationController.getNotifications(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: [],
            });
        });

        it('should handle errors', async () => {
            Notification.find = jest.fn().mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        populate: jest.fn().mockRejectedValue(new Error('DB Error')),
                    }),
                }),
            });

            await notificationController.getNotifications(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Server Error: Unable to fetch notifications',
            });
        });
    });

    describe('markAsRead', () => {
        it('should mark a notification as read', async () => {
            req.params.id = 'notification123';

            const mockNotification = {
                _id: 'notification123',
                recipient: { toString: () => 'user123' },
                isRead: false,
                save: jest.fn().mockResolvedValue(true),
            };

            Notification.findById = jest.fn().mockResolvedValue(mockNotification);

            await notificationController.markAsRead(req, res);

            expect(mockNotification.isRead).toBe(true);
            expect(mockNotification.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockNotification,
            });
        });

        it('should return 404 if notification not found', async () => {
            req.params.id = 'nonexistent';

            Notification.findById = jest.fn().mockResolvedValue(null);

            await notificationController.markAsRead(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Notification not found',
            });
        });

        it('should return 401 if user does not own notification', async () => {
            req.params.id = 'notification123';

            const mockNotification = {
                _id: 'notification123',
                recipient: { toString: () => 'otheruser' }, // Different user
                isRead: false,
            };

            Notification.findById = jest.fn().mockResolvedValue(mockNotification);

            await notificationController.markAsRead(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Not authorized to access this notification',
            });
        });

        it('should emit socket event on success', async () => {
            req.params.id = 'notification123';

            const mockNotification = {
                _id: 'notification123',
                recipient: { toString: () => 'user123' },
                isRead: false,
                save: jest.fn().mockResolvedValue(true),
            };

            Notification.findById = jest.fn().mockResolvedValue(mockNotification);

            await notificationController.markAsRead(req, res);

            expect(mockIO.to).toHaveBeenCalledWith('user_user123');
        });
    });

    describe('markAllAsRead', () => {
        it('should mark all notifications as read', async () => {
            Notification.updateMany = jest.fn().mockResolvedValue({ modifiedCount: 5 });

            await notificationController.markAllAsRead(req, res);

            expect(Notification.updateMany).toHaveBeenCalledWith(
                { recipient: 'user123', isRead: false },
                { isRead: true }
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'All notifications marked as read',
            });
        });

        it('should emit socket event on success', async () => {
            Notification.updateMany = jest.fn().mockResolvedValue({ modifiedCount: 5 });

            await notificationController.markAllAsRead(req, res);

            expect(mockIO.to).toHaveBeenCalledWith('user_user123');
        });
    });

    describe('deleteAll', () => {
        it('should delete all notifications for the user', async () => {
            Notification.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 10 });

            await notificationController.deleteAll(req, res);

            expect(Notification.deleteMany).toHaveBeenCalledWith({ recipient: 'user123' });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'All notifications cleared',
            });
        });
    });
});
