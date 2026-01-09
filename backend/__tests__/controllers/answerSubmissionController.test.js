/**
 * Unit Tests for Answer Submission Controller
 * Tests student answer submission operations
 */

const { createMockRequest, createMockResponse, createMockNext } = require('../mocks/req-res');

// Mock dependencies
jest.mock('../../model/StudentAnswer');
jest.mock('../../model/Assessment');
jest.mock('../../model/Student');
jest.mock('../../model/Lesson');

const StudentAnswer = require('../../model/StudentAnswer');
const Assessment = require('../../model/Assessment');
const Student = require('../../model/Student');

const answerSubmissionController = require('../../controller/answerSubmissionController');

describe('Answer Submission Controller', () => {
    let req, res, next;

    beforeEach(() => {
        req = createMockRequest();
        res = createMockResponse();
        next = createMockNext();
        req.user = { id: 'user123' };
        jest.clearAllMocks();
    });

    describe('submitAnswer', () => {
        it('should submit answer successfully', async () => {
            req.body = {
                assessmentId: 'assessment123',
                classId: 'class123',
                studentId: 'student123',
                answers: [
                    { questionNumber: 1, originalImage: 'base64data' },
                ],
            };

            Assessment.findById = jest.fn().mockResolvedValue({ _id: 'assessment123' });
            Student.findById = jest.fn().mockResolvedValue({ _id: 'student123' });
            StudentAnswer.findOne = jest.fn().mockResolvedValue(null);

            const mockCreatedAnswer = {
                _id: 'answer123',
                ...req.body,
                populate: jest.fn().mockResolvedValue(this),
            };
            StudentAnswer.create = jest.fn().mockResolvedValue(mockCreatedAnswer);
            mockCreatedAnswer.populate = jest.fn().mockResolvedValue(mockCreatedAnswer);

            await answerSubmissionController.submitAnswer(req, res);

            expect(StudentAnswer.create).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'Answer submitted successfully',
                })
            );
        });

        it('should return 400 if required fields are missing', async () => {
            req.body = { assessmentId: 'assessment123' };

            await answerSubmissionController.submitAnswer(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Missing required fields: assessmentId, classId, studentId',
                })
            );
        });

        it('should return 400 if no answers or files provided', async () => {
            req.body = {
                assessmentId: 'assessment123',
                classId: 'class123',
                studentId: 'student123',
                answers: [],
            };

            await answerSubmissionController.submitAnswer(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'At least one answer or file is required',
                })
            );
        });

        it('should return 404 if assessment not found', async () => {
            req.body = {
                assessmentId: 'nonexistent',
                classId: 'class123',
                studentId: 'student123',
                answers: [{ questionNumber: 1, originalImage: 'data' }],
            };

            Assessment.findById = jest.fn().mockResolvedValue(null);

            await answerSubmissionController.submitAnswer(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Assessment not found',
                })
            );
        });

        it('should return 404 if student not found', async () => {
            req.body = {
                assessmentId: 'assessment123',
                classId: 'class123',
                studentId: 'nonexistent',
                answers: [{ questionNumber: 1, originalImage: 'data' }],
            };

            Assessment.findById = jest.fn().mockResolvedValue({ _id: 'assessment123' });
            Student.findById = jest.fn().mockResolvedValue(null);

            await answerSubmissionController.submitAnswer(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Student not found',
                })
            );
        });

        it('should return 400 if duplicate submission exists', async () => {
            req.body = {
                assessmentId: 'assessment123',
                classId: 'class123',
                studentId: 'student123',
                answers: [{ questionNumber: 1, originalImage: 'data' }],
            };

            Assessment.findById = jest.fn().mockResolvedValue({ _id: 'assessment123' });
            Student.findById = jest.fn().mockResolvedValue({ _id: 'student123' });
            StudentAnswer.findOne = jest.fn().mockResolvedValue({
                _id: 'existingAnswer',
            });

            await answerSubmissionController.submitAnswer(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Student has already submitted answers for this assessment',
                })
            );
        });

        it('should handle bulk upload mode', async () => {
            req.body = {
                assessmentId: 'assessment123',
                classId: 'class123',
                studentId: 'student123',
                submissionMethod: 'upload_bulk',
                files: [
                    { fileIndex: 1, fileName: 'file1.pdf', fileType: 'application/pdf', fileData: 'data' },
                ],
            };

            Assessment.findById = jest.fn().mockResolvedValue({ _id: 'assessment123' });
            Student.findById = jest.fn().mockResolvedValue({ _id: 'student123' });
            StudentAnswer.findOne = jest.fn().mockResolvedValue(null);

            const mockCreatedAnswer = {
                _id: 'answer123',
                populate: jest.fn().mockResolvedValue(this),
            };
            StudentAnswer.create = jest.fn().mockResolvedValue(mockCreatedAnswer);
            mockCreatedAnswer.populate = jest.fn().mockResolvedValue(mockCreatedAnswer);

            await answerSubmissionController.submitAnswer(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
        });
    });

    describe('batchSubmitAnswers', () => {
        it('should batch submit answers successfully', async () => {
            req.body = {
                submissions: [
                    {
                        assessmentId: 'assessment123',
                        lessonPlanId: 'lesson123',
                        classId: 'class123',
                        studentId: 'student1',
                        answers: [{ questionNumber: 1, originalImage: 'data' }],
                    },
                ],
            };

            StudentAnswer.findOne = jest.fn().mockResolvedValue(null);
            StudentAnswer.create = jest.fn().mockResolvedValue({
                _id: 'answer123',
                populate: jest.fn().mockResolvedValue(this),
            });

            await answerSubmissionController.batchSubmitAnswers(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                })
            );
        });

        it('should return 400 if submissions array is missing', async () => {
            req.body = {};

            await answerSubmissionController.batchSubmitAnswers(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Submissions array is required',
                })
            );
        });

        it('should handle duplicate submissions in batch', async () => {
            req.body = {
                submissions: [
                    {
                        assessmentId: 'assessment123',
                        lessonPlanId: 'lesson123',
                        classId: 'class123',
                        studentId: 'student1',
                        answers: [{ questionNumber: 1 }],
                    },
                ],
            };

            StudentAnswer.findOne = jest.fn().mockResolvedValue({
                _id: 'existingAnswer',
            });

            await answerSubmissionController.batchSubmitAnswers(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        duplicates: expect.any(Array),
                    }),
                })
            );
        });
    });

    describe('getSubmissionById', () => {
        it('should return submission by ID', async () => {
            req.params = { id: 'answer123' };

            const mockSubmission = {
                _id: 'answer123',
                studentId: { name: 'John' },
                assessmentId: { title: 'Test 1' },
            };

            StudentAnswer.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        populate: jest.fn().mockReturnValue({
                            populate: jest.fn().mockResolvedValue(mockSubmission),
                        }),
                    }),
                }),
            });

            await answerSubmissionController.getSubmissionById(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockSubmission,
            });
        });

        it('should return 404 if submission not found', async () => {
            req.params = { id: 'nonexistent' };

            StudentAnswer.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        populate: jest.fn().mockReturnValue({
                            populate: jest.fn().mockResolvedValue(null),
                        }),
                    }),
                }),
            });

            await answerSubmissionController.getSubmissionById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('getSubmissionsByAssessment', () => {
        it('should return submissions for an assessment', async () => {
            req.params = { assessmentId: 'assessment123' };
            req.query = {};

            const mockSubmissions = [
                { _id: 'answer1', studentId: { name: 'John' } },
                { _id: 'answer2', studentId: { name: 'Jane' } },
            ];

            StudentAnswer.find = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        populate: jest.fn().mockReturnValue({
                            sort: jest.fn().mockResolvedValue(mockSubmissions),
                        }),
                    }),
                }),
            });

            await answerSubmissionController.getSubmissionsByAssessment(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                count: 2,
                data: mockSubmissions,
            });
        });

        it('should filter by status', async () => {
            req.params = { assessmentId: 'assessment123' };
            req.query = { status: 'completed' };

            StudentAnswer.find = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        populate: jest.fn().mockReturnValue({
                            sort: jest.fn().mockResolvedValue([]),
                        }),
                    }),
                }),
            });

            await answerSubmissionController.getSubmissionsByAssessment(req, res);

            expect(StudentAnswer.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    assessmentId: 'assessment123',
                    processingStatus: 'completed',
                })
            );
        });
    });

    describe('getSubmissionsByClass', () => {
        it('should return submissions for a class', async () => {
            req.params = { classId: 'class123' };
            req.query = {};

            const mockSubmissions = [{ _id: 'answer1' }];

            StudentAnswer.find = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        populate: jest.fn().mockReturnValue({
                            populate: jest.fn().mockReturnValue({
                                sort: jest.fn().mockResolvedValue(mockSubmissions),
                            }),
                        }),
                    }),
                }),
            });

            await answerSubmissionController.getSubmissionsByClass(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                count: 1,
                data: mockSubmissions,
            });
        });

        it('should handle "all" classId', async () => {
            req.params = { classId: 'all' };
            req.query = {};

            StudentAnswer.find = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        populate: jest.fn().mockReturnValue({
                            populate: jest.fn().mockReturnValue({
                                sort: jest.fn().mockResolvedValue([]),
                            }),
                        }),
                    }),
                }),
            });

            await answerSubmissionController.getSubmissionsByClass(req, res);

            expect(StudentAnswer.find).toHaveBeenCalledWith({});
        });
    });

    describe('getAssessmentStats', () => {
        it('should return assessment statistics', async () => {
            req.params = { assessmentId: 'assessment123' };
            req.query = {};

            const mockAssessment = {
                _id: 'assessment123',
                title: 'Test 1',
                activityType: 'assessment',
                classId: { className: '4A', grade: 'Form 4' },
                submissionStats: {
                    totalStudentsInClass: 30,
                    totalSubmissions: 25,
                    submissionRate: 83.3,
                    overallAverage: 75,
                    lastUpdated: new Date(),
                },
            };

            Assessment.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockAssessment),
            });

            await answerSubmissionController.getAssessmentStats(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        assessment: expect.any(Object),
                        statistics: expect.any(Object),
                    }),
                })
            );
        });

        it('should return 404 if assessment not found', async () => {
            req.params = { assessmentId: 'nonexistent' };
            req.query = {};

            Assessment.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue(null),
            });

            await answerSubmissionController.getAssessmentStats(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('deleteSubmission', () => {
        it('should delete a submission', async () => {
            req.params = { id: 'answer123' };

            const mockSubmission = {
                _id: 'answer123',
                assessmentId: 'assessment123',
                deleteOne: jest.fn().mockResolvedValue(true),
            };

            StudentAnswer.findById = jest.fn().mockResolvedValue(mockSubmission);

            await answerSubmissionController.deleteSubmission(req, res);

            expect(mockSubmission.deleteOne).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Submission deleted successfully',
                data: {},
            });
        });

        it('should return 404 if submission not found', async () => {
            req.params = { id: 'nonexistent' };

            StudentAnswer.findById = jest.fn().mockResolvedValue(null);

            await answerSubmissionController.deleteSubmission(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('refreshAllStats', () => {
        it('should refresh all assessment stats', async () => {
            req.query = { userId: 'user123' };

            const mockAssessments = [
                { _id: 'assessment1', title: 'Test 1' },
                { _id: 'assessment2', title: 'Test 2' },
            ];

            Assessment.find = jest.fn().mockResolvedValue(mockAssessments);
            Assessment.updateSubmissionStats = jest.fn().mockResolvedValue(true);

            await answerSubmissionController.refreshAllStats(req, res);

            expect(Assessment.updateSubmissionStats).toHaveBeenCalledTimes(2);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'Stats refresh completed',
                })
            );
        });
    });
});
