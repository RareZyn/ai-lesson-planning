/**
 * Unit Tests for Analytics Controller
 * Tests performance analytics operations
 */

const { createMockRequest, createMockResponse, createMockNext } = require('../mocks/req-res');

// Mock dependencies
jest.mock('../../model/Assessment');
jest.mock('../../model/Student');
jest.mock('../../model/StudentAnswer');
jest.mock('../../model/Class');

const Assessment = require('../../model/Assessment');
const Student = require('../../model/Student');
const StudentAnswer = require('../../model/StudentAnswer');
const Class = require('../../model/Class');

const analyticsController = require('../../controller/analyticsController');

describe('Analytics Controller', () => {
    let req, res, next;

    beforeEach(() => {
        req = createMockRequest();
        res = createMockResponse();
        next = createMockNext();
        req.user = { id: 'user123' };
        jest.clearAllMocks();
    });

    describe('getClassAnalytics', () => {
        it('should return class analytics data', async () => {
            req.params = { classId: 'class123' };
            req.query = {};

            const mockAnswers = [
                {
                    _id: 'answer1',
                    studentId: { _id: 'student1', name: 'John' },
                    assessmentId: {
                        title: 'Test 1',
                        activityType: 'assessment',
                        difficulty: 'Intermediate',
                        lessonPlanSnapshot: {
                            learningStandard: { main: 'Topic A' },
                        },
                    },
                    overallStats: { percentage: 80 },
                    submittedAt: new Date(),
                },
                {
                    _id: 'answer2',
                    studentId: { _id: 'student2', name: 'Jane' },
                    assessmentId: {
                        title: 'Test 2',
                        activityType: 'assessment',
                        difficulty: 'Beginner',
                        lessonPlanSnapshot: {
                            learningStandard: { main: 'Topic B' },
                        },
                    },
                    overallStats: { percentage: 90 },
                    submittedAt: new Date(),
                },
            ];

            StudentAnswer.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        sort: jest.fn().mockResolvedValue(mockAnswers),
                    }),
                }),
            });

            await analyticsController.getClassAnalytics(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    classAverage: 85,
                    totalAssessments: 2,
                    totalStudents: 2,
                    topicMastery: expect.any(Array),
                    trendData: expect.any(Array),
                    difficultyBreakdown: expect.any(Array),
                }),
            });
        });

        it('should return empty data when no answers exist', async () => {
            req.params = { classId: 'class123' };
            req.query = {};

            StudentAnswer.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        sort: jest.fn().mockResolvedValue([]),
                    }),
                }),
            });

            await analyticsController.getClassAnalytics(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'No data available for the selected filters',
                data: expect.objectContaining({
                    classAverage: 0,
                    totalAssessments: 0,
                    totalStudents: 0,
                }),
            });
        });

        it('should filter by date range', async () => {
            req.params = { classId: 'class123' };
            req.query = {
                startDate: '2024-01-01',
                endDate: '2024-12-31',
            };

            StudentAnswer.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        sort: jest.fn().mockResolvedValue([]),
                    }),
                }),
            });

            await analyticsController.getClassAnalytics(req, res);

            expect(StudentAnswer.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    classId: 'class123',
                    processingStatus: 'completed',
                    submittedAt: expect.objectContaining({
                        $gte: expect.any(Date),
                        $lte: expect.any(Date),
                    }),
                })
            );
        });

        it('should filter by topic', async () => {
            req.params = { classId: 'class123' };
            req.query = { topic: 'Algebra' };

            const mockAnswers = [
                {
                    studentId: { _id: 'student1' },
                    assessmentId: {
                        lessonPlanSnapshot: {
                            learningStandard: { main: 'Algebra Basics' },
                        },
                    },
                    overallStats: { percentage: 75 },
                    submittedAt: new Date(),
                },
                {
                    studentId: { _id: 'student2' },
                    assessmentId: {
                        lessonPlanSnapshot: {
                            learningStandard: { main: 'Geometry' },
                        },
                    },
                    overallStats: { percentage: 85 },
                    submittedAt: new Date(),
                },
            ];

            StudentAnswer.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        sort: jest.fn().mockResolvedValue(mockAnswers),
                    }),
                }),
            });

            await analyticsController.getClassAnalytics(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            // Should only include the Algebra answer
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    totalAssessments: 1,
                }),
            });
        });

        it('should handle errors', async () => {
            req.params = { classId: 'class123' };
            req.query = {};

            StudentAnswer.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        sort: jest.fn().mockRejectedValue(new Error('DB Error')),
                    }),
                }),
            });

            await analyticsController.getClassAnalytics(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Failed to fetch class analytics',
                })
            );
        });
    });

    describe('getStudentProgress', () => {
        it('should return student progress data', async () => {
            req.params = { studentId: 'student123' };
            req.query = {};

            const mockStudent = {
                _id: 'student123',
                name: 'John Doe',
                studentId: 'STU001',
                grade: 'Form 4',
                classId: { className: '4A' },
            };

            const mockAnswers = [
                {
                    assessmentId: {
                        title: 'Test 1',
                        lessonPlanSnapshot: {
                            learningStandard: { main: 'Topic A' },
                        },
                    },
                    overallStats: { percentage: 75 },
                    submittedAt: new Date('2024-01-15'),
                },
                {
                    assessmentId: {
                        title: 'Test 2',
                        lessonPlanSnapshot: {
                            learningStandard: { main: 'Topic A' },
                        },
                    },
                    overallStats: { percentage: 85 },
                    submittedAt: new Date('2024-02-15'),
                },
            ];

            Student.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockStudent),
            });

            StudentAnswer.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockResolvedValue(mockAnswers),
                }),
            });

            await analyticsController.getStudentProgress(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    student: expect.objectContaining({
                        name: 'John Doe',
                    }),
                    averageScore: 80,
                    totalAssessments: 2,
                    progressOverTime: expect.any(Array),
                    topicPerformance: expect.any(Array),
                    strengthsAndWeaknesses: expect.objectContaining({
                        strengths: expect.any(Array),
                        weaknesses: expect.any(Array),
                    }),
                }),
            });
        });

        it('should return 404 if student not found', async () => {
            req.params = { studentId: 'nonexistent' };
            req.query = {};

            Student.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue(null),
            });

            await analyticsController.getStudentProgress(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Student not found',
            });
        });

        it('should return empty data when no assessments completed', async () => {
            req.params = { studentId: 'student123' };
            req.query = {};

            const mockStudent = {
                name: 'John Doe',
                studentId: 'STU001',
                classId: { className: '4A' },
            };

            Student.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockStudent),
            });

            StudentAnswer.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockResolvedValue([]),
                }),
            });

            await analyticsController.getStudentProgress(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'No assessment data available',
                data: expect.objectContaining({
                    averageScore: 0,
                    totalAssessments: 0,
                }),
            });
        });

        it('should handle errors', async () => {
            req.params = { studentId: 'student123' };
            req.query = {};

            Student.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockRejectedValue(new Error('DB Error')),
            });

            await analyticsController.getStudentProgress(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getFrequentlyMissedQuestions', () => {
        it('should return frequently missed questions', async () => {
            req.params = { classId: 'class123' };

            const mockAnswers = [
                {
                    assessmentId: { title: 'Test 1' },
                    answers: [
                        {
                            questionNumber: 1,
                            questionText: 'Q1',
                            grading: { aiScore: { score: 3, maxScore: 10 } },
                        },
                        {
                            questionNumber: 2,
                            questionText: 'Q2',
                            grading: { aiScore: { score: 8, maxScore: 10 } },
                        },
                    ],
                },
                {
                    assessmentId: { title: 'Test 1' },
                    answers: [
                        {
                            questionNumber: 1,
                            questionText: 'Q1',
                            grading: { aiScore: { score: 2, maxScore: 10 } },
                        },
                        {
                            questionNumber: 2,
                            questionText: 'Q2',
                            grading: { aiScore: { score: 9, maxScore: 10 } },
                        },
                    ],
                },
            ];

            StudentAnswer.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockAnswers),
            });

            await analyticsController.getFrequentlyMissedQuestions(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.any(Array),
            });
        });

        it('should return empty data when no answers exist', async () => {
            req.params = { classId: 'class123' };

            StudentAnswer.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue([]),
            });

            await analyticsController.getFrequentlyMissedQuestions(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'No data available',
                data: [],
            });
        });

        it('should handle errors', async () => {
            req.params = { classId: 'class123' };

            StudentAnswer.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockRejectedValue(new Error('DB Error')),
            });

            await analyticsController.getFrequentlyMissedQuestions(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getClassStudentsList', () => {
        it('should return list of active students', async () => {
            req.params = { classId: 'class123' };

            const mockStudents = [
                { name: 'Alice', studentId: 'STU001', performanceStats: {} },
                { name: 'Bob', studentId: 'STU002', performanceStats: {} },
            ];

            Student.find = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    sort: jest.fn().mockResolvedValue(mockStudents),
                }),
            });

            await analyticsController.getClassStudentsList(req, res);

            expect(Student.find).toHaveBeenCalledWith({
                classId: 'class123',
                status: 'active',
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockStudents,
            });
        });

        it('should handle errors', async () => {
            req.params = { classId: 'class123' };

            Student.find = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    sort: jest.fn().mockRejectedValue(new Error('DB Error')),
                }),
            });

            await analyticsController.getClassStudentsList(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getAvailableTopics', () => {
        it('should return available topics for a class', async () => {
            req.params = { classId: 'class123' };

            const mockAssessments = [
                {
                    lessonPlanSnapshot: {
                        learningStandard: { main: 'Topic A' },
                        contentStandard: { main: 'Content A' },
                    },
                },
                {
                    lessonPlanSnapshot: {
                        learningStandard: { main: 'Topic B' },
                    },
                },
            ];

            Assessment.find = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(mockAssessments),
            });

            await analyticsController.getAvailableTopics(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.arrayContaining(['Topic A', 'Topic B', 'Content A']),
            });
        });

        it('should handle errors', async () => {
            req.params = { classId: 'class123' };

            Assessment.find = jest.fn().mockReturnValue({
                select: jest.fn().mockRejectedValue(new Error('DB Error')),
            });

            await analyticsController.getAvailableTopics(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('generateReport', () => {
        it('should generate class report', async () => {
            req.body = {
                type: 'class',
                classId: 'class123',
                filters: {},
            };

            const mockClass = { _id: 'class123', className: '4A' };
            const mockStudents = [
                { _id: 'student1', name: 'John', studentId: 'STU001' },
            ];

            StudentAnswer.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue([]),
                }),
            });

            Class.findById = jest.fn().mockResolvedValue(mockClass);
            Student.find = jest.fn().mockResolvedValue(mockStudents);

            await analyticsController.generateReport(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    type: 'class',
                    generatedAt: expect.any(Date),
                }),
            });
        });

        it('should generate student report', async () => {
            req.body = {
                type: 'student',
                studentId: 'student123',
                filters: {},
            };

            const mockStudent = {
                name: 'John',
                studentId: 'STU001',
                grade: 'Form 4',
                classId: { className: '4A' },
            };

            Student.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockStudent),
            });

            StudentAnswer.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue([]),
            });

            await analyticsController.generateReport(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    type: 'student',
                    student: expect.objectContaining({
                        name: 'John',
                    }),
                }),
            });
        });

        it('should handle errors', async () => {
            req.body = {
                type: 'class',
                classId: 'class123',
            };

            StudentAnswer.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockRejectedValue(new Error('DB Error')),
                }),
            });

            await analyticsController.generateReport(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });
});
