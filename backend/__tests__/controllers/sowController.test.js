/**
 * Unit Tests for SOW (Scheme of Work) Controller
 * Tests SOW CRUD operations
 */

const { createMockRequest, createMockResponse, createMockNext } = require('../mocks/req-res');

// Mock dependencies
jest.mock('../../model/Sow');

const Sow = require('../../model/Sow');

const sowController = require('../../controller/sowController');

describe('SOW Controller', () => {
    let req, res, next;

    beforeEach(() => {
        req = createMockRequest();
        res = createMockResponse();
        next = createMockNext();
        jest.clearAllMocks();
    });

    describe('createSow', () => {
        it('should create a new SOW lesson successfully', async () => {
            req.body = {
                form: 'Form 4',
                lessonData: {
                    lessonNo: 1,
                    focus: 'Introduction to Algebra',
                    theme: 'Mathematics Basics',
                },
            };

            const mockUpdatedSow = {
                _id: 'sow123',
                form: 'Form 4',
                lessons: [req.body.lessonData],
            };

            Sow.findOneAndUpdate = jest.fn().mockResolvedValue(mockUpdatedSow);

            await sowController.createSow(req, res);

            expect(Sow.findOneAndUpdate).toHaveBeenCalledWith(
                { form: 'Form 4' },
                { $push: { lessons: req.body.lessonData } },
                { new: true, upsert: true, runValidators: true }
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'Lesson 1 successfully added to Form 4.',
                })
            );
        });

        it('should return 400 if form is missing', async () => {
            req.body = {
                lessonData: { lessonNo: 1, focus: 'Test' },
            };

            await sowController.createSow(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                })
            );
        });

        it('should return 400 if lessonData is missing', async () => {
            req.body = {
                form: 'Form 4',
            };

            await sowController.createSow(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 400 if lessonNo is missing', async () => {
            req.body = {
                form: 'Form 4',
                lessonData: { focus: 'Test' }, // Missing lessonNo
            };

            await sowController.createSow(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 400 if focus is missing', async () => {
            req.body = {
                form: 'Form 4',
                lessonData: { lessonNo: 1 }, // Missing focus
            };

            await sowController.createSow(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should handle errors', async () => {
            req.body = {
                form: 'Form 4',
                lessonData: { lessonNo: 1, focus: 'Test' },
            };

            Sow.findOneAndUpdate = jest.fn().mockRejectedValue(new Error('DB Error'));

            await sowController.createSow(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('createSowBatch', () => {
        it('should batch upload lessons successfully', async () => {
            req.body = {
                form: 'Form 4',
                lessons: [
                    { lessonNo: 1, focus: 'Lesson 1' },
                    { lessonNo: 2, focus: 'Lesson 2' },
                ],
            };

            const mockSowDoc = {
                _id: 'sow123',
                form: 'Form 4',
                lessons: [],
                save: jest.fn().mockResolvedValue(true),
            };

            Sow.findOne = jest.fn().mockResolvedValue(null);
            Sow.create = jest.fn().mockResolvedValue(mockSowDoc);

            await sowController.createSowBatch(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'Batch upload completed for Form 4',
                })
            );
        });

        it('should update existing lessons', async () => {
            req.body = {
                form: 'Form 4',
                lessons: [
                    { lessonNo: 1, focus: 'Updated Lesson 1' },
                ],
            };

            const mockSowDoc = {
                _id: 'sow123',
                form: 'Form 4',
                lessons: [{ lessonNo: 1, focus: 'Original Lesson 1' }],
                save: jest.fn().mockResolvedValue(true),
            };

            Sow.findOne = jest.fn().mockResolvedValue(mockSowDoc);

            await sowController.createSowBatch(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    summary: expect.objectContaining({
                        updatedLessons: 1,
                    }),
                })
            );
        });

        it('should return 400 if form is missing', async () => {
            req.body = {
                lessons: [{ lessonNo: 1, focus: 'Test' }],
            };

            await sowController.createSowBatch(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 400 if lessons is not an array', async () => {
            req.body = {
                form: 'Form 4',
                lessons: 'not an array',
            };

            await sowController.createSowBatch(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 400 if lessons array is empty', async () => {
            req.body = {
                form: 'Form 4',
                lessons: [],
            };

            await sowController.createSowBatch(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 400 if lessons have missing required fields', async () => {
            req.body = {
                form: 'Form 4',
                lessons: [
                    { lessonNo: 1 }, // Missing focus
                ],
            };

            await sowController.createSowBatch(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 400 for duplicate lesson numbers in input', async () => {
            req.body = {
                form: 'Form 4',
                lessons: [
                    { lessonNo: 1, focus: 'Lesson 1' },
                    { lessonNo: 1, focus: 'Duplicate Lesson 1' },
                ],
            };

            await sowController.createSowBatch(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: 'Duplicate lesson numbers found in the input.',
                })
            );
        });
    });

    describe('getSowByGrade', () => {
        it('should return SOW for a specific grade', async () => {
            req.params = { grade: 'Form 4' };

            const mockSow = {
                _id: 'sow123',
                form: 'Form 4',
                lessons: [
                    { lessonNo: 1, focus: 'Lesson 1' },
                    { lessonNo: 2, focus: 'Lesson 2' },
                ],
            };

            Sow.findOne = jest.fn().mockResolvedValue(mockSow);

            await sowController.getSowByGrade(req, res);

            expect(Sow.findOne).toHaveBeenCalledWith({ form: 'Form 4' });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockSow,
            });
        });

        it('should return 404 if SOW not found', async () => {
            req.params = { grade: 'Form 6' };

            Sow.findOne = jest.fn().mockResolvedValue(null);

            await sowController.getSowByGrade(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'No scheme of work found for Form 6.',
            });
        });

        it('should handle URL encoded grade parameter', async () => {
            req.params = { grade: 'Form%204' };

            const mockSow = {
                _id: 'sow123',
                form: 'Form 4',
                lessons: [],
            };

            Sow.findOne = jest.fn().mockResolvedValue(mockSow);

            await sowController.getSowByGrade(req, res);

            expect(Sow.findOne).toHaveBeenCalledWith({ form: 'Form 4' });
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should handle errors', async () => {
            req.params = { grade: 'Form 4' };

            Sow.findOne = jest.fn().mockRejectedValue(new Error('DB Error'));

            await sowController.getSowByGrade(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });
});
