/**
 * Unit Tests for DSKP Controller
 * Tests DSKP (Dokumen Standard Kurikulum dan Pentaksiran) operations
 */

const { createMockRequest, createMockResponse, createMockNext } = require('../mocks/req-res');

// Mock dependencies
jest.mock('../../model/DSKP');

const DSKP = require('../../model/DSKP');

const dskpController = require('../../controller/dskpController');

describe('DSKP Controller', () => {
    let req, res, next;

    beforeEach(() => {
        req = createMockRequest();
        res = createMockResponse();
        next = createMockNext();
        jest.clearAllMocks();
    });

    describe('uploadEnglishKSSM', () => {
        it('should upload English KSSM data successfully', async () => {
            req.body = {
                forms: [
                    { form: 'form1', skills: [{ name: 'Listening', code: 'L1' }] },
                    { form: 'form2', skills: [{ name: 'Speaking', code: 'S1' }] },
                ],
            };

            DSKP.findBySubject = jest.fn().mockResolvedValue(null);
            DSKP.create = jest.fn().mockResolvedValue({
                _id: 'dskp123',
                subject: 'english',
                curriculum: 'KSSM',
                forms: req.body.forms,
            });

            await dskpController.uploadEnglishKSSM(req, res);

            expect(DSKP.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    subject: 'english',
                    curriculum: 'KSSM',
                })
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'English KSSM data uploaded successfully',
                })
            );
        });

        it('should update existing English DSKP', async () => {
            req.body = {
                forms: [
                    { form: 'form1', skills: [{ name: 'Listening', code: 'L1' }] },
                ],
            };

            const existingDSKP = {
                _id: 'dskp123',
                subject: 'english',
                forms: [],
                save: jest.fn().mockResolvedValue(true),
            };

            DSKP.findBySubject = jest.fn().mockResolvedValue(existingDSKP);

            await dskpController.uploadEnglishKSSM(req, res);

            expect(existingDSKP.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
        });

        it('should return 400 if forms data is missing', async () => {
            req.body = {};

            await dskpController.uploadEnglishKSSM(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Forms data is required and must be an array',
                })
            );
        });

        it('should return 400 if forms is not an array', async () => {
            req.body = { forms: 'not an array' };

            await dskpController.uploadEnglishKSSM(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 400 for invalid form names', async () => {
            req.body = {
                forms: [{ form: 'invalid_form', skills: [] }],
            };

            await dskpController.uploadEnglishKSSM(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                })
            );
        });
    });

    describe('uploadSingleForm', () => {
        it('should upload single form data successfully', async () => {
            req.body = {
                subject: 'english',
                form: 'form1',
                skills: [{ name: 'Listening', code: 'L1' }],
            };

            DSKP.findBySubject = jest.fn().mockResolvedValue(null);
            DSKP.create = jest.fn().mockResolvedValue({
                _id: 'dskp123',
                subject: 'english',
                curriculum: 'KSSM',
                forms: [{ form: 'form1', skills: req.body.skills }],
            });

            await dskpController.uploadSingleForm(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                })
            );
        });

        it('should update existing DSKP with new form', async () => {
            req.body = {
                subject: 'english',
                form: 'form2',
                skills: [{ name: 'Speaking', code: 'S1' }],
            };

            const existingDSKP = {
                _id: 'dskp123',
                subject: 'english',
                forms: [{ form: 'form1', skills: [] }],
                addOrUpdateForm: jest.fn().mockResolvedValue(true),
                save: jest.fn().mockResolvedValue(true),
            };

            DSKP.findBySubject = jest.fn().mockResolvedValue(existingDSKP);

            await dskpController.uploadSingleForm(req, res);

            expect(existingDSKP.addOrUpdateForm).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
        });

        it('should return 400 if required fields are missing', async () => {
            req.body = { subject: 'english' }; // Missing form and skills

            await dskpController.uploadSingleForm(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Subject, form, and skills are required',
                })
            );
        });

        it('should return 400 for invalid form name', async () => {
            req.body = {
                subject: 'english',
                form: 'form10', // Invalid
                skills: [],
            };

            await dskpController.uploadSingleForm(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('getAllSubjects', () => {
        it('should return all subjects', async () => {
            const mockSubjects = [
                { subject: 'english', curriculum: 'KSSM' },
                { subject: 'mathematics', curriculum: 'KSSM' },
            ];

            DSKP.find = jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue(mockSubjects),
            });

            await dskpController.getAllSubjects(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                count: 2,
                data: mockSubjects,
            });
        });

        it('should handle empty results', async () => {
            DSKP.find = jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue([]),
            });

            await dskpController.getAllSubjects(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                count: 0,
                data: [],
            });
        });

        it('should handle errors', async () => {
            DSKP.find = jest.fn().mockReturnValue({
                sort: jest.fn().mockRejectedValue(new Error('DB Error')),
            });

            await dskpController.getAllSubjects(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getSubjectData', () => {
        it('should return subject data', async () => {
            req.params = { subject: 'english' };

            const mockDSKP = {
                _id: 'dskp123',
                subject: 'english',
                curriculum: 'KSSM',
                forms: [{ form: 'form1', skills: [] }],
            };

            DSKP.findBySubject = jest.fn().mockResolvedValue(mockDSKP);

            await dskpController.getSubjectData(req, res);

            expect(DSKP.findBySubject).toHaveBeenCalledWith('english');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockDSKP,
            });
        });

        it('should return 404 if subject not found', async () => {
            req.params = { subject: 'nonexistent' };

            DSKP.findBySubject = jest.fn().mockResolvedValue(null);

            await dskpController.getSubjectData(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: "Subject 'nonexistent' not found",
                })
            );
        });
    });

    describe('getFormData', () => {
        it('should return form data for a subject', async () => {
            req.params = { subject: 'english', form: 'form1' };

            const mockDSKP = {
                subject: 'english',
                curriculum: 'KSSM',
                forms: [{ form: 'form1', skills: [{ name: 'Listening' }] }],
            };

            DSKP.findBySubjectAndForm = jest.fn().mockResolvedValue(mockDSKP);

            await dskpController.getFormData(req, res);

            expect(DSKP.findBySubjectAndForm).toHaveBeenCalledWith('english', 'form1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    subject: 'english',
                    curriculum: 'KSSM',
                    form: mockDSKP.forms[0],
                },
            });
        });

        it('should return 404 if form not found', async () => {
            req.params = { subject: 'english', form: 'form5' };

            DSKP.findBySubjectAndForm = jest.fn().mockResolvedValue(null);

            await dskpController.getFormData(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return 404 if forms array is empty', async () => {
            req.params = { subject: 'english', form: 'form1' };

            DSKP.findBySubjectAndForm = jest.fn().mockResolvedValue({
                subject: 'english',
                forms: [],
            });

            await dskpController.getFormData(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('deleteSubject', () => {
        it('should delete a subject', async () => {
            req.params = { subject: 'english' };

            const mockDSKP = {
                _id: 'dskp123',
                subject: 'english',
            };

            DSKP.findBySubject = jest.fn().mockResolvedValue(mockDSKP);
            DSKP.deleteOne = jest.fn().mockResolvedValue({ deletedCount: 1 });

            await dskpController.deleteSubject(req, res);

            expect(DSKP.deleteOne).toHaveBeenCalledWith({ _id: 'dskp123' });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "Subject 'english' deleted successfully",
            });
        });

        it('should return 404 if subject not found', async () => {
            req.params = { subject: 'nonexistent' };

            DSKP.findBySubject = jest.fn().mockResolvedValue(null);

            await dskpController.deleteSubject(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should handle errors', async () => {
            req.params = { subject: 'english' };

            DSKP.findBySubject = jest.fn().mockRejectedValue(new Error('DB Error'));

            await dskpController.deleteSubject(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });
});
