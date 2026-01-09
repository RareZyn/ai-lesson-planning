/**
 * Unit Tests for Textbook Controller
 * Tests textbook topic operations
 */

const { createMockRequest, createMockResponse, createMockNext } = require('../mocks/req-res');

// Mock dependencies
jest.mock('../../model/Textbook');

const Textbook = require('../../model/Textbook');

const textbookController = require('../../controller/textbookController');

describe('Textbook Controller', () => {
    let req, res, next;

    beforeEach(() => {
        req = createMockRequest();
        res = createMockResponse();
        next = createMockNext();
        jest.clearAllMocks();
    });

    describe('uploadTopics', () => {
        it('should upload textbook topics successfully', async () => {
            req.body = {
                'Form 1': { topics: ['Topic 1', 'Topic 2'] },
                'Form 2': { topics: ['Topic 3', 'Topic 4'] },
            };

            const mockTextbook = {
                _id: 'textbook123',
                ...req.body,
            };

            Textbook.create = jest.fn().mockResolvedValue(mockTextbook);

            await textbookController.uploadTopics(req, res);

            expect(Textbook.create).toHaveBeenCalledWith(req.body);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Topics uploaded successfully',
                data: mockTextbook,
            });
        });

        it('should handle upload errors', async () => {
            req.body = {
                'Form 1': { topics: ['Topic 1'] },
            };

            Textbook.create = jest.fn().mockRejectedValue(new Error('DB Error'));

            await textbookController.uploadTopics(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Upload failed',
                error: 'DB Error',
            });
        });
    });

    describe('getTopics', () => {
        it('should return topics for a specific form', async () => {
            req.params = { form: 'form1' };

            const mockTextbook = {
                'Form 1': { topics: ['Topic 1', 'Topic 2'] },
                'Form 2': { topics: ['Topic 3', 'Topic 4'] },
            };

            Textbook.findOne = jest.fn().mockResolvedValue(mockTextbook);

            await textbookController.getTopics(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                form: 'form1',
                topics: ['Topic 1', 'Topic 2'],
            });
        });

        it('should return 404 if no textbook data found', async () => {
            req.params = { form: 'form1' };

            Textbook.findOne = jest.fn().mockResolvedValue(null);

            await textbookController.getTopics(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'No textbook data found',
            });
        });

        it('should return 404 if topics for form not found', async () => {
            req.params = { form: 'form5' };

            const mockTextbook = {
                'Form 1': { topics: ['Topic 1'] },
            };

            Textbook.findOne = jest.fn().mockResolvedValue(mockTextbook);

            await textbookController.getTopics(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Topics for form5 not found',
            });
        });

        it('should handle form2 correctly', async () => {
            req.params = { form: 'form2' };

            const mockTextbook = {
                'Form 1': { topics: ['Topic 1'] },
                'Form 2': { topics: ['Topic A', 'Topic B'] },
            };

            Textbook.findOne = jest.fn().mockResolvedValue(mockTextbook);

            await textbookController.getTopics(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                form: 'form2',
                topics: ['Topic A', 'Topic B'],
            });
        });

        it('should handle errors', async () => {
            req.params = { form: 'form1' };

            Textbook.findOne = jest.fn().mockRejectedValue(new Error('DB Error'));

            await textbookController.getTopics(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Failed to get topics',
                error: 'DB Error',
            });
        });
    });
});
