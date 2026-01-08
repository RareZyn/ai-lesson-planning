/**
 * Unit Tests for Material Controller
 * Tests material upload and management
 * 
 * UPDATED: Matches actual materialController.js implementation
 */

const { createMockRequest, createMockResponse, createMockNext } = require('../mocks/req-res');
const { createMockUser } = require('../mocks/models');

// Mock dependencies
jest.mock('../../model/Material');

const Material = require('../../model/Material');

const materialController = require('../../controller/materialController');

describe('Material Controller', () => {
    let req, res, next;

    beforeEach(() => {
        req = createMockRequest();
        res = createMockResponse();
        next = createMockNext();
        req.user = { id: 'user123', _id: 'user123' };
        jest.clearAllMocks();
    });

    describe('uploadMaterial', () => {
        it('should upload a new material from req.body', async () => {
            req.body = {
                name: 'test-document.pdf',
                type: 'pdf',
                size: 1024,
                fileData: 'base64encodedcontent',
            };

            const savedMaterial = {
                _id: 'material123',
                user: 'user123',
                name: 'test-document.pdf',
                type: 'pdf',
                size: 1024,
                status: 'ready',
            };

            Material.create = jest.fn().mockResolvedValue(savedMaterial);

            await materialController.uploadMaterial(req, res);

            expect(Material.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    user: 'user123',
                    name: 'test-document.pdf',
                    type: 'pdf',
                })
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: savedMaterial,
                message: 'Material uploaded successfully',
            });
        });

        it('should return 400 if no file data provided (and not a link)', async () => {
            req.body = { name: 'test.pdf', type: 'pdf' }; // Missing fileData

            await materialController.uploadMaterial(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'No file data provided.',
            });
        });

        it('should allow link type without fileData', async () => {
            req.body = {
                name: 'External Link',
                type: 'link',
                size: 0,
                fileData: 'https://example.com',
            };

            const savedMaterial = { _id: 'material123', type: 'link' };
            Material.create = jest.fn().mockResolvedValue(savedMaterial);

            await materialController.uploadMaterial(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
        });

        it('should return 400 if file is too large', async () => {
            req.body = {
                name: 'largefile.pdf',
                type: 'pdf',
                size: 20 * 1024 * 1024,
                fileData: 'x'.repeat(16 * 1024 * 1024), // Over 15MB limit
            };

            await materialController.uploadMaterial(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'File too large. Limit is 10MB.',
            });
        });
    });

    describe('getMaterials', () => {
        it('should return all materials for the user', async () => {
            const mockMaterials = [
                { _id: 'mat1', name: 'File 1', user: 'user123' },
                { _id: 'mat2', name: 'File 2', user: 'user123' },
            ];

            // Match: Material.find({ user: req.user.id }).sort({ uploadDate: -1 })
            Material.find = jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue(mockMaterials),
            });

            await materialController.getMaterials(req, res);

            expect(Material.find).toHaveBeenCalledWith({ user: 'user123' });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockMaterials,
            });
        });

        it('should handle errors', async () => {
            Material.find = jest.fn().mockReturnValue({
                sort: jest.fn().mockRejectedValue(new Error('DB Error')),
            });

            await materialController.getMaterials(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Failed to fetch materials',
            });
        });
    });

    describe('getMaterial', () => {
        it('should return a material by ID with content', async () => {
            req.params = { id: 'material123' };
            const mockMaterial = {
                _id: 'material123',
                name: 'Test Material',
                user: { toString: () => 'user123' },
                originalFileUrl: 'base64content',
            };

            // Match: Material.findById().select('+originalFileUrl')
            Material.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(mockMaterial),
            });

            await materialController.getMaterial(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockMaterial,
            });
        });

        it('should return 404 if material not found', async () => {
            req.params = { id: 'nonexistent' };

            Material.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(null),
            });

            await materialController.getMaterial(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Material not found',
            });
        });

        it('should return 401 if user does not own material', async () => {
            req.params = { id: 'material123' };
            const mockMaterial = {
                _id: 'material123',
                user: { toString: () => 'otheruser' },
            };

            Material.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(mockMaterial),
            });

            await materialController.getMaterial(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Unauthorized',
            });
        });
    });

    describe('updateMaterial', () => {
        it('should update material name', async () => {
            req.params = { id: 'material123' };
            req.body = { name: 'Renamed Document.pdf' };

            const existingMaterial = {
                _id: 'material123',
                name: 'Original.pdf',
                user: { toString: () => 'user123' },
                save: jest.fn().mockResolvedValue(true),
            };

            Material.findById = jest.fn().mockResolvedValue(existingMaterial);

            await materialController.updateMaterial(req, res);

            expect(existingMaterial.name).toBe('Renamed Document.pdf');
            expect(existingMaterial.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: existingMaterial,
                message: 'Material updated successfully',
            });
        });

        it('should return 404 if material not found', async () => {
            req.params = { id: 'nonexistent' };
            req.body = { name: 'New Name' };

            Material.findById = jest.fn().mockResolvedValue(null);

            await materialController.updateMaterial(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Material not found',
            });
        });

        it('should return 401 if user does not own material', async () => {
            req.params = { id: 'material123' };
            req.body = { name: 'New Name' };

            const existingMaterial = {
                _id: 'material123',
                user: { toString: () => 'otheruser' },
            };

            Material.findById = jest.fn().mockResolvedValue(existingMaterial);

            await materialController.updateMaterial(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Unauthorized',
            });
        });
    });

    describe('deleteMaterial', () => {
        it('should delete a material', async () => {
            req.params = { id: 'material123' };

            const existingMaterial = {
                _id: 'material123',
                user: { toString: () => 'user123' },
                deleteOne: jest.fn().mockResolvedValue(true),
            };

            Material.findById = jest.fn().mockResolvedValue(existingMaterial);

            await materialController.deleteMaterial(req, res);

            expect(existingMaterial.deleteOne).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Material deleted',
            });
        });

        it('should return 404 if material not found', async () => {
            req.params = { id: 'nonexistent' };

            Material.findById = jest.fn().mockResolvedValue(null);

            await materialController.deleteMaterial(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Material not found',
            });
        });

        it('should return 401 if user does not own material', async () => {
            req.params = { id: 'material123' };

            const existingMaterial = {
                _id: 'material123',
                user: { toString: () => 'otheruser' },
            };

            Material.findById = jest.fn().mockResolvedValue(existingMaterial);

            await materialController.deleteMaterial(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Unauthorized',
            });
        });
    });
});
