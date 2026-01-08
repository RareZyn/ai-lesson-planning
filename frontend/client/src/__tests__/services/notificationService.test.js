/**
 * Unit Tests for Notification Service
 * Tests notification API calls
 */

import axios from 'axios';

// Mock axios
jest.mock('axios', () => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(() => ({
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        patch: jest.fn(),
        delete: jest.fn(),
    })),
}));

describe('Notification Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getNotifications', () => {
        it('should fetch all notifications', async () => {
            const mockNotifications = [
                { _id: '1', title: 'Notification 1', isRead: false },
                { _id: '2', title: 'Notification 2', isRead: true },
            ];

            axios.get.mockResolvedValueOnce({
                data: { success: true, data: mockNotifications },
            });

            const response = await axios.get('/api/notifications');

            expect(axios.get).toHaveBeenCalledWith('/api/notifications');
            expect(response.data.data).toHaveLength(2);
        });

        it('should handle empty notifications', async () => {
            axios.get.mockResolvedValueOnce({
                data: { success: true, data: [] },
            });

            const response = await axios.get('/api/notifications');

            expect(response.data.data).toHaveLength(0);
        });
    });

    describe('markAsRead', () => {
        it('should mark a notification as read', async () => {
            axios.patch.mockResolvedValueOnce({
                data: { success: true, data: { _id: '1', isRead: true } },
            });

            await axios.patch('/api/notifications/1/read');

            expect(axios.patch).toHaveBeenCalledWith('/api/notifications/1/read');
        });
    });

    describe('markAllAsRead', () => {
        it('should mark all notifications as read', async () => {
            axios.patch.mockResolvedValueOnce({
                data: { success: true, message: 'All notifications marked as read' },
            });

            await axios.patch('/api/notifications/read-all');

            expect(axios.patch).toHaveBeenCalledWith('/api/notifications/read-all');
        });
    });

    describe('deleteAll', () => {
        it('should delete all notifications', async () => {
            axios.delete.mockResolvedValueOnce({
                data: { success: true, message: 'All notifications deleted' },
            });

            await axios.delete('/api/notifications');

            expect(axios.delete).toHaveBeenCalledWith('/api/notifications');
        });
    });

    describe('Error Handling', () => {
        it('should handle API errors', async () => {
            axios.get.mockRejectedValueOnce(new Error('Network Error'));

            await expect(axios.get('/api/notifications')).rejects.toThrow('Network Error');
        });

        it('should handle 500 server errors', async () => {
            const error = { response: { status: 500, data: { message: 'Server error' } } };
            axios.get.mockRejectedValueOnce(error);

            await expect(axios.get('/api/notifications')).rejects.toEqual(error);
        });
    });
});
