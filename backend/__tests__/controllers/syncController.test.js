/**
 * Unit Tests for Sync Controller
 * Tests offline synchronization operations
 */

const { createMockRequest, createMockResponse, createMockNext } = require('../mocks/req-res');

// Mock dependencies
jest.mock('../../model/Lesson');
jest.mock('../../model/Assessment');
jest.mock('../../model/Class');
jest.mock('../../model/Student');

const LessonPlan = require('../../model/Lesson');
const Assessment = require('../../model/Assessment');
const Class = require('../../model/Class');
const Student = require('../../model/Student');

const syncController = require('../../controller/syncController');

describe('Sync Controller', () => {
    let req, res, next;

    beforeEach(() => {
        req = createMockRequest();
        res = createMockResponse();
        next = createMockNext();
        req.user = { id: 'user123' };
        jest.clearAllMocks();
    });

    describe('getUpdatesSince', () => {
        it('should return updates since timestamp', async () => {
            const sinceDate = new Date('2024-01-01').toISOString();
            req.query = { since: sinceDate, types: 'lessons,assessments,classes,students' };

            const mockLessons = [{ _id: 'lesson1', version: 2, updatedAt: new Date() }];
            const mockAssessments = [{ _id: 'assessment1', version: 1, updatedAt: new Date() }];
            const mockClasses = [{ _id: 'class1', version: 1, updatedAt: new Date() }];
            const mockStudents = [{ _id: 'student1', version: 1, updatedAt: new Date() }];

            LessonPlan.find = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    sort: jest.fn().mockReturnValue({
                        lean: jest.fn().mockResolvedValue(mockLessons),
                    }),
                }),
            });

            Assessment.find = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    sort: jest.fn().mockReturnValue({
                        lean: jest.fn().mockResolvedValue(mockAssessments),
                    }),
                }),
            });

            Class.find = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    sort: jest.fn().mockReturnValue({
                        lean: jest.fn().mockResolvedValue(mockClasses),
                    }),
                }),
            });

            // For students, first get user classes
            Class.find.mockImplementation((filter) => {
                if (filter.createdBy === 'user123' && !filter.updatedAt) {
                    // Query for user's class IDs
                    return {
                        select: jest.fn().mockResolvedValue([{ _id: 'class1' }]),
                    };
                }
                // Regular class query with updatedAt filter
                return {
                    select: jest.fn().mockReturnValue({
                        sort: jest.fn().mockReturnValue({
                            lean: jest.fn().mockResolvedValue(mockClasses),
                        }),
                    }),
                };
            });

            Student.find = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    sort: jest.fn().mockReturnValue({
                        lean: jest.fn().mockResolvedValue(mockStudents),
                    }),
                }),
            });

            await syncController.getUpdatesSince(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'Updates retrieved successfully',
                    since: sinceDate,
                    counts: expect.any(Object),
                })
            );
        });

        it('should return 400 if since parameter missing', async () => {
            req.query = {};

            await syncController.getUpdatesSince(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Missing required parameter: since (timestamp)',
                })
            );
        });

        it('should return 400 if invalid timestamp format', async () => {
            req.query = { since: 'invalid-date' };

            await syncController.getUpdatesSince(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Invalid timestamp format',
                })
            );
        });

        it('should only fetch requested types', async () => {
            req.query = { since: new Date().toISOString(), types: 'lessons' };

            const mockLessons = [{ _id: 'lesson1' }];

            LessonPlan.find = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    sort: jest.fn().mockReturnValue({
                        lean: jest.fn().mockResolvedValue(mockLessons),
                    }),
                }),
            });

            await syncController.getUpdatesSince(req, res);

            expect(LessonPlan.find).toHaveBeenCalled();
            expect(Assessment.find).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('batchUpload', () => {
        it('should process batch upload successfully', async () => {
            req.body = {
                lessons: [],
                assessments: [],
                classes: [],
                students: [],
            };

            await syncController.batchUpload(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'Batch upload completed',
                    results: expect.objectContaining({
                        successful: 0,
                        conflicts: 0,
                        errors: 0,
                    }),
                })
            );
        });

        it('should handle offline-created lessons', async () => {
            req.body = {
                lessons: [
                    {
                        _id: 'temp-123',
                        offlineCreated: true,
                        parameters: { grade: 'Form 4' },
                    },
                ],
                assessments: [],
                classes: [],
                students: [],
            };

            const mockSavedLesson = {
                _id: 'new-lesson-id',
                version: 1,
                save: jest.fn().mockResolvedValue(true),
            };

            LessonPlan.mockImplementation(() => mockSavedLesson);

            await syncController.batchUpload(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should detect version conflicts', async () => {
            req.body = {
                lessons: [
                    {
                        _id: 'existing-lesson',
                        version: 1,
                        parameters: { grade: 'Form 4' },
                    },
                ],
                assessments: [],
                classes: [],
                students: [],
            };

            // Server has newer version
            LessonPlan.findOne = jest.fn().mockResolvedValue({
                _id: 'existing-lesson',
                version: 2, // Server version is higher
                createdBy: 'user123',
                toObject: jest.fn().mockReturnValue({ _id: 'existing-lesson', version: 2 }),
            });

            await syncController.batchUpload(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        conflicts: expect.arrayContaining([
                            expect.objectContaining({
                                type: 'lesson',
                            }),
                        ]),
                    }),
                })
            );
        });
    });

    describe('checkConflicts', () => {
        it('should return no conflicts when versions match', async () => {
            req.body = {
                lessons: [{ _id: 'lesson1', version: 1, updatedAt: new Date() }],
                assessments: [],
                classes: [],
                students: [],
            };

            LessonPlan.findOne = jest.fn().mockResolvedValue({
                _id: 'lesson1',
                version: 1,
                updatedAt: new Date(),
            });

            await syncController.checkConflicts(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    hasConflicts: false,
                    conflicts: [],
                })
            );
        });

        it('should detect lesson conflicts', async () => {
            req.body = {
                lessons: [{ _id: 'lesson1', version: 1, updatedAt: new Date() }],
                assessments: [],
                classes: [],
                students: [],
            };

            LessonPlan.findOne = jest.fn().mockResolvedValue({
                _id: 'lesson1',
                version: 2, // Different version
                updatedAt: new Date(),
            });

            await syncController.checkConflicts(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    hasConflicts: true,
                    conflicts: expect.arrayContaining([
                        expect.objectContaining({
                            type: 'lesson',
                            id: 'lesson1',
                        }),
                    ]),
                })
            );
        });

        it('should detect assessment conflicts', async () => {
            req.body = {
                lessons: [],
                assessments: [{ _id: 'assessment1', version: 1, updatedAt: new Date() }],
                classes: [],
                students: [],
            };

            Assessment.findOne = jest.fn().mockResolvedValue({
                _id: 'assessment1',
                version: 3,
                updatedAt: new Date(),
            });

            await syncController.checkConflicts(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    hasConflicts: true,
                    conflicts: expect.arrayContaining([
                        expect.objectContaining({
                            type: 'assessment',
                        }),
                    ]),
                })
            );
        });

        it('should detect class conflicts', async () => {
            req.body = {
                lessons: [],
                assessments: [],
                classes: [{ _id: 'class1', version: 1, updatedAt: new Date() }],
                students: [],
            };

            Class.findOne = jest.fn().mockResolvedValue({
                _id: 'class1',
                version: 2,
                updatedAt: new Date(),
            });

            await syncController.checkConflicts(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    hasConflicts: true,
                    conflicts: expect.arrayContaining([
                        expect.objectContaining({
                            type: 'class',
                        }),
                    ]),
                })
            );
        });

        it('should detect student conflicts', async () => {
            req.body = {
                lessons: [],
                assessments: [],
                classes: [],
                students: [{ _id: 'student1', version: 1, updatedAt: new Date() }],
            };

            Student.findById = jest.fn().mockResolvedValue({
                _id: 'student1',
                version: 5,
                updatedAt: new Date(),
            });

            await syncController.checkConflicts(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    hasConflicts: true,
                    conflicts: expect.arrayContaining([
                        expect.objectContaining({
                            type: 'student',
                        }),
                    ]),
                })
            );
        });

        it('should skip items that do not exist on server', async () => {
            req.body = {
                lessons: [{ _id: 'new-lesson', version: 1 }],
                assessments: [],
                classes: [],
                students: [],
            };

            LessonPlan.findOne = jest.fn().mockResolvedValue(null);

            await syncController.checkConflicts(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    hasConflicts: false,
                    conflicts: [],
                })
            );
        });
    });

    describe('resolveConflict', () => {
        it('should resolve lesson conflict', async () => {
            req.body = {
                type: 'lesson',
                id: 'lesson123',
                resolution: 'useLocal',
                data: { parameters: { grade: 'Form 5' } },
            };

            const mockLesson = {
                _id: 'lesson123',
                syncStatus: 'conflict',
                conflictData: { some: 'data' },
                save: jest.fn().mockResolvedValue(true),
            };

            LessonPlan.findOne = jest.fn().mockResolvedValue(mockLesson);

            await syncController.resolveConflict(req, res);

            expect(mockLesson.save).toHaveBeenCalled();
            expect(mockLesson.syncStatus).toBe('synced');
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should resolve assessment conflict', async () => {
            req.body = {
                type: 'assessment',
                id: 'assessment123',
                resolution: 'useLocal',
                data: { title: 'Updated Assessment' },
            };

            const mockAssessment = {
                _id: 'assessment123',
                syncStatus: 'conflict',
                save: jest.fn().mockResolvedValue(true),
            };

            Assessment.findOne = jest.fn().mockResolvedValue(mockAssessment);

            await syncController.resolveConflict(req, res);

            expect(mockAssessment.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should resolve class conflict', async () => {
            req.body = {
                type: 'class',
                id: 'class123',
                resolution: 'useLocal',
                data: { className: 'Updated Class' },
            };

            const mockClass = {
                _id: 'class123',
                syncStatus: 'conflict',
                save: jest.fn().mockResolvedValue(true),
            };

            Class.findOne = jest.fn().mockResolvedValue(mockClass);

            await syncController.resolveConflict(req, res);

            expect(mockClass.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should resolve student conflict', async () => {
            req.body = {
                type: 'student',
                id: 'student123',
                resolution: 'useLocal',
                data: { name: 'Updated Student' },
            };

            const mockStudent = {
                _id: 'student123',
                syncStatus: 'conflict',
                save: jest.fn().mockResolvedValue(true),
            };

            Student.findById = jest.fn().mockResolvedValue(mockStudent);

            await syncController.resolveConflict(req, res);

            expect(mockStudent.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return 400 if required fields missing', async () => {
            req.body = { type: 'lesson' }; // Missing id, resolution, data

            await syncController.resolveConflict(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Missing required fields: type, id, resolution, data',
                })
            );
        });

        it('should return 400 for invalid type', async () => {
            req.body = {
                type: 'invalid',
                id: '123',
                resolution: 'useLocal',
                data: {},
            };

            await syncController.resolveConflict(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Invalid type: invalid',
                })
            );
        });

        it('should return 500 if lesson not found during resolution', async () => {
            req.body = {
                type: 'lesson',
                id: 'nonexistent',
                resolution: 'useLocal',
                data: {},
            };

            LessonPlan.findOne = jest.fn().mockResolvedValue(null);

            await syncController.resolveConflict(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getSyncStatus', () => {
        it('should return sync status for user', async () => {
            LessonPlan.countDocuments = jest.fn().mockResolvedValue(2);
            Assessment.countDocuments = jest.fn().mockResolvedValue(1);
            Class.countDocuments = jest.fn().mockResolvedValue(0);
            Student.countDocuments = jest.fn().mockResolvedValue(3);

            await syncController.getSyncStatus(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'Sync status retrieved',
                    data: {
                        pendingSync: {
                            lessons: 2,
                            assessments: 1,
                            classes: 0,
                            students: 3,
                            total: 6,
                        },
                    },
                })
            );
        });

        it('should filter by pending and conflict status', async () => {
            LessonPlan.countDocuments = jest.fn().mockResolvedValue(0);
            Assessment.countDocuments = jest.fn().mockResolvedValue(0);
            Class.countDocuments = jest.fn().mockResolvedValue(0);
            Student.countDocuments = jest.fn().mockResolvedValue(0);

            await syncController.getSyncStatus(req, res);

            expect(LessonPlan.countDocuments).toHaveBeenCalledWith(
                expect.objectContaining({
                    createdBy: 'user123',
                    syncStatus: { $in: ['pending', 'conflict'] },
                })
            );
        });

        it('should return zero totals when nothing pending', async () => {
            LessonPlan.countDocuments = jest.fn().mockResolvedValue(0);
            Assessment.countDocuments = jest.fn().mockResolvedValue(0);
            Class.countDocuments = jest.fn().mockResolvedValue(0);
            Student.countDocuments = jest.fn().mockResolvedValue(0);

            await syncController.getSyncStatus(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: {
                        pendingSync: {
                            lessons: 0,
                            assessments: 0,
                            classes: 0,
                            students: 0,
                            total: 0,
                        },
                    },
                })
            );
        });
    });
});
