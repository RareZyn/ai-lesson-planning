/**
 * Unit Tests for Community Controller
 * Tests community lesson sharing operations
 */

const { createMockRequest, createMockResponse, createMockNext } = require('../mocks/req-res');

// Mock dependencies
jest.mock('../../model/Lesson');
jest.mock('../../model/User');
jest.mock('../../model/Assessment');
jest.mock('../../model/Class');
jest.mock('mongoose', () => ({
    Types: {
        ObjectId: {
            isValid: jest.fn().mockReturnValue(true),
        },
    },
}));

const LessonPlan = require('../../model/Lesson');
const User = require('../../model/User');
const Assessment = require('../../model/Assessment');
const Class = require('../../model/Class');

const communityController = require('../../controller/communityController');

describe('Community Controller', () => {
    let req, res, next;

    beforeEach(() => {
        req = createMockRequest();
        res = createMockResponse();
        next = createMockNext();
        jest.clearAllMocks();
    });

    describe('getAllLessonPlans', () => {
        it('should return all lesson plans', async () => {
            req.query = { page: 1, limit: 10 };

            const mockLessonPlans = [
                { _id: 'lesson1', parameters: { grade: 'Form 4' } },
                { _id: 'lesson2', parameters: { grade: 'Form 5' } },
            ];

            LessonPlan.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        sort: jest.fn().mockReturnValue({
                            limit: jest.fn().mockReturnValue({
                                skip: jest.fn().mockResolvedValue(mockLessonPlans),
                            }),
                        }),
                    }),
                }),
            });
            LessonPlan.countDocuments = jest.fn().mockResolvedValue(2);

            await communityController.getAllLessonPlans(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                count: 2,
                total: 2,
                totalPages: 1,
                currentPage: 1,
                data: mockLessonPlans,
            });
        });

        it('should filter by grade', async () => {
            req.query = { page: 1, limit: 10, grade: 'Form 4' };

            LessonPlan.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        sort: jest.fn().mockReturnValue({
                            limit: jest.fn().mockReturnValue({
                                skip: jest.fn().mockResolvedValue([]),
                            }),
                        }),
                    }),
                }),
            });
            LessonPlan.countDocuments = jest.fn().mockResolvedValue(0);

            await communityController.getAllLessonPlans(req, res, next);

            expect(LessonPlan.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    'parameters.grade': 'Form 4',
                })
            );
        });
    });

    describe('getUserLessonPlans', () => {
        it('should return lesson plans for a user', async () => {
            req.query = { userId: 'user123', page: 1, limit: 10 };

            const mockLessonPlans = [{ _id: 'lesson1' }];

            User.findOne = jest.fn().mockResolvedValue({ _id: 'user123' });
            LessonPlan.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        sort: jest.fn().mockReturnValue({
                            limit: jest.fn().mockReturnValue({
                                skip: jest.fn().mockResolvedValue(mockLessonPlans),
                            }),
                        }),
                    }),
                }),
            });
            LessonPlan.countDocuments = jest.fn().mockResolvedValue(1);

            await communityController.getUserLessonPlans(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: mockLessonPlans,
                })
            );
        });

        it('should return 400 if userId not provided', async () => {
            req.query = { page: 1 };

            await communityController.getUserLessonPlans(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                })
            );
        });
    });

    describe('getUserBookmarks', () => {
        it('should return user bookmarks', async () => {
            req.query = { userId: 'user123', page: 1, limit: 10 };

            const mockUser = {
                _id: 'user123',
                bookmarks: ['lesson1', 'lesson2'],
            };

            const mockLessonPlans = [
                { _id: 'lesson1', toObject: () => ({ _id: 'lesson1' }) },
            ];

            User.findById = jest.fn().mockResolvedValue(mockUser);
            LessonPlan.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        sort: jest.fn().mockReturnValue({
                            limit: jest.fn().mockReturnValue({
                                skip: jest.fn().mockResolvedValue(mockLessonPlans),
                            }),
                        }),
                    }),
                }),
            });
            LessonPlan.countDocuments = jest.fn().mockResolvedValue(1);

            await communityController.getUserBookmarks(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return 400 if userId not provided', async () => {
            req.query = { page: 1 };

            await communityController.getUserBookmarks(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 404 if user not found', async () => {
            req.query = { userId: 'nonexistent', page: 1, limit: 10 };

            User.findById = jest.fn().mockResolvedValue(null);

            await communityController.getUserBookmarks(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return empty if no bookmarks', async () => {
            req.query = { userId: 'user123', page: 1, limit: 10 };

            const mockUser = { _id: 'user123', bookmarks: [] };
            User.findById = jest.fn().mockResolvedValue(mockUser);

            await communityController.getUserBookmarks(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    count: 0,
                    data: [],
                })
            );
        });
    });

    describe('toggleBookmark', () => {
        it('should add bookmark successfully', async () => {
            req.params = { id: 'lesson123' };
            req.body = { userId: 'user123' };

            const mockLesson = {
                _id: 'lesson123',
                isSharedToCommunity: true,
            };

            const mockUser = {
                _id: 'user123',
                bookmarks: [],
                save: jest.fn().mockResolvedValue(true),
            };

            LessonPlan.findById = jest.fn().mockResolvedValue(mockLesson);
            User.findById = jest.fn().mockResolvedValue(mockUser);

            await communityController.toggleBookmark(req, res, next);

            expect(mockUser.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        isBookmarked: true,
                    }),
                })
            );
        });

        it('should remove bookmark successfully', async () => {
            req.params = { id: 'lesson123' };
            req.body = { userId: 'user123' };

            const mockLesson = {
                _id: { toString: () => 'lesson123' },
                isSharedToCommunity: true,
            };

            const mockUser = {
                _id: 'user123',
                bookmarks: [{ toString: () => 'lesson123' }],
                save: jest.fn().mockResolvedValue(true),
            };

            LessonPlan.findById = jest.fn().mockResolvedValue(mockLesson);
            User.findById = jest.fn().mockResolvedValue(mockUser);

            await communityController.toggleBookmark(req, res, next);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        isBookmarked: false,
                    }),
                })
            );
        });

        it('should return 400 if userId not provided', async () => {
            req.params = { id: 'lesson123' };
            req.body = {};

            await communityController.toggleBookmark(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 404 if lesson not found', async () => {
            req.params = { id: 'nonexistent' };
            req.body = { userId: 'user123' };

            LessonPlan.findById = jest.fn().mockResolvedValue(null);

            await communityController.toggleBookmark(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return 400 if lesson not shared', async () => {
            req.params = { id: 'lesson123' };
            req.body = { userId: 'user123' };

            const mockLesson = {
                _id: 'lesson123',
                isSharedToCommunity: false,
            };

            LessonPlan.findById = jest.fn().mockResolvedValue(mockLesson);

            await communityController.toggleBookmark(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('shareLessonPlanToCommunity', () => {
        it('should share lesson plan successfully', async () => {
            req.params = { id: 'lesson123' };
            req.body = {
                userId: 'user123',
                title: 'Shared Lesson',
                description: 'A great lesson',
                tags: ['english', 'grammar'],
            };

            const mockLesson = {
                _id: 'lesson123',
                createdBy: { toString: () => 'user123' },
                isSharedToCommunity: false,
                parameters: { specificTopic: 'Grammar', grade: 'Form 4' },
                save: jest.fn().mockResolvedValue(true),
            };

            LessonPlan.findById = jest.fn().mockResolvedValue(mockLesson);

            await communityController.shareLessonPlanToCommunity(req, res, next);

            expect(mockLesson.isSharedToCommunity).toBe(true);
            expect(mockLesson.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return 400 if userId not provided', async () => {
            req.params = { id: 'lesson123' };
            req.body = {};

            await communityController.shareLessonPlanToCommunity(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 404 if lesson not found', async () => {
            req.params = { id: 'nonexistent' };
            req.body = { userId: 'user123' };

            LessonPlan.findById = jest.fn().mockResolvedValue(null);

            await communityController.shareLessonPlanToCommunity(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return 403 if user does not own lesson', async () => {
            req.params = { id: 'lesson123' };
            req.body = { userId: 'user123' };

            const mockLesson = {
                _id: 'lesson123',
                createdBy: { toString: () => 'otheruser' },
            };

            LessonPlan.findById = jest.fn().mockResolvedValue(mockLesson);

            await communityController.shareLessonPlanToCommunity(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
        });

        it('should return 400 if already shared', async () => {
            req.params = { id: 'lesson123' };
            req.body = { userId: 'user123' };

            const mockLesson = {
                _id: 'lesson123',
                createdBy: { toString: () => 'user123' },
                isSharedToCommunity: true,
            };

            LessonPlan.findById = jest.fn().mockResolvedValue(mockLesson);

            await communityController.shareLessonPlanToCommunity(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('unshareLessonPlanFromCommunity', () => {
        it('should unshare lesson plan successfully', async () => {
            req.params = { id: 'lesson123' };
            req.body = { userId: 'user123' };

            const mockLesson = {
                _id: 'lesson123',
                createdBy: { toString: () => 'user123' },
                isSharedToCommunity: true,
                save: jest.fn().mockResolvedValue(true),
            };

            LessonPlan.findById = jest.fn().mockResolvedValue(mockLesson);

            await communityController.unshareLessonPlanFromCommunity(req, res, next);

            expect(mockLesson.isSharedToCommunity).toBe(false);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return 403 if user does not own lesson', async () => {
            req.params = { id: 'lesson123' };
            req.body = { userId: 'user123' };

            const mockLesson = {
                _id: 'lesson123',
                createdBy: { toString: () => 'otheruser' },
            };

            LessonPlan.findById = jest.fn().mockResolvedValue(mockLesson);

            await communityController.unshareLessonPlanFromCommunity(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
        });
    });

    describe('getCommunityLessonPlans', () => {
        it('should return shared lesson plans', async () => {
            req.query = { page: 1, limit: 10 };

            const mockLessonPlans = [
                { _id: 'lesson1', isSharedToCommunity: true },
            ];

            LessonPlan.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        sort: jest.fn().mockReturnValue({
                            limit: jest.fn().mockReturnValue({
                                skip: jest.fn().mockResolvedValue(mockLessonPlans),
                            }),
                        }),
                    }),
                }),
            });
            LessonPlan.countDocuments = jest.fn().mockResolvedValue(1);

            await communityController.getCommunityLessonPlans(req, res, next);

            expect(LessonPlan.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    isSharedToCommunity: true,
                })
            );
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should filter by tags', async () => {
            req.query = { page: 1, limit: 10, tags: 'english,grammar' };

            LessonPlan.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        sort: jest.fn().mockReturnValue({
                            limit: jest.fn().mockReturnValue({
                                skip: jest.fn().mockResolvedValue([]),
                            }),
                        }),
                    }),
                }),
            });
            LessonPlan.countDocuments = jest.fn().mockResolvedValue(0);

            await communityController.getCommunityLessonPlans(req, res, next);

            expect(LessonPlan.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    'communityData.tags': { $in: ['english', 'grammar'] },
                })
            );
        });

        it('should sort by popular', async () => {
            req.query = { page: 1, limit: 10, sortBy: 'popular' };

            LessonPlan.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        sort: jest.fn().mockReturnValue({
                            limit: jest.fn().mockReturnValue({
                                skip: jest.fn().mockResolvedValue([]),
                            }),
                        }),
                    }),
                }),
            });
            LessonPlan.countDocuments = jest.fn().mockResolvedValue(0);

            await communityController.getCommunityLessonPlans(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('toggleLikeLessonPlan', () => {
        it('should like lesson plan', async () => {
            req.params = { id: 'lesson123' };
            req.body = { userId: 'user123' };

            const mockLesson = {
                _id: 'lesson123',
                isSharedToCommunity: true,
                communityData: {
                    likes: 0,
                    likedBy: [],
                },
                save: jest.fn().mockResolvedValue(true),
            };

            LessonPlan.findById = jest.fn().mockResolvedValue(mockLesson);

            await communityController.toggleLikeLessonPlan(req, res, next);

            expect(mockLesson.communityData.likes).toBe(1);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should unlike lesson plan', async () => {
            req.params = { id: 'lesson123' };
            req.body = { userId: 'user123' };

            const mockLesson = {
                _id: 'lesson123',
                isSharedToCommunity: true,
                communityData: {
                    likes: 1,
                    likedBy: [{ toString: () => 'user123' }],
                },
                save: jest.fn().mockResolvedValue(true),
            };

            LessonPlan.findById = jest.fn().mockResolvedValue(mockLesson);

            await communityController.toggleLikeLessonPlan(req, res, next);

            expect(mockLesson.communityData.likes).toBe(0);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Lesson plan unliked',
                })
            );
        });
    });

    describe('downloadLessonPlan', () => {
        it('should download lesson plan and increment count', async () => {
            req.params = { id: 'lesson123' };
            req.body = { userId: 'user123' };

            const mockLesson = {
                _id: 'lesson123',
                isSharedToCommunity: true,
                communityData: {
                    downloads: 0,
                    downloadedBy: [],
                },
                save: jest.fn().mockResolvedValue(true),
            };

            LessonPlan.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(mockLesson),
                }),
            });

            await communityController.downloadLessonPlan(req, res, next);

            expect(mockLesson.communityData.downloads).toBe(1);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return 404 if lesson not found', async () => {
            req.params = { id: 'nonexistent' };
            req.body = {};

            LessonPlan.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(null),
                }),
            });

            await communityController.downloadLessonPlan(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('getCommunityStats', () => {
        it('should return community statistics', async () => {
            LessonPlan.countDocuments = jest.fn().mockResolvedValue(100);
            LessonPlan.aggregate = jest.fn()
                .mockResolvedValueOnce([{ totalLikes: 500 }])
                .mockResolvedValueOnce([{ totalDownloads: 200 }])
                .mockResolvedValueOnce([
                    { _id: 'user1', sharedCount: 10, user: { name: 'John' } },
                ]);

            await communityController.getCommunityStats(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    totalShared: 100,
                    totalLikes: 500,
                    totalDownloads: 200,
                }),
            });
        });
    });

    describe('copyLessonToClass', () => {
        it('should copy lesson to class successfully', async () => {
            req.params = { id: 'lesson123' };
            req.body = {
                userId: 'user123',
                targetClassId: 'class123',
            };

            const mockOriginalLesson = {
                _id: 'lesson123',
                isSharedToCommunity: true,
                parameters: { grade: 'Form 4' },
                plan: { learningObjective: 'Test' },
                communityData: { downloads: 0, downloadedBy: [] },
                save: jest.fn().mockResolvedValue(true),
            };

            const mockTargetClass = {
                _id: 'class123',
                grade: 'Form 4',
                createdBy: { toString: () => 'user123' },
            };

            LessonPlan.findById = jest.fn().mockResolvedValue(mockOriginalLesson);
            Class.findById = jest.fn().mockResolvedValue(mockTargetClass);
            LessonPlan.prototype.save = jest.fn().mockResolvedValue({ _id: 'newLesson' });
            Assessment.find = jest.fn().mockResolvedValue([]);

            // Mock the LessonPlan constructor
            const mockNewLesson = {
                _id: 'newLesson',
                save: jest.fn().mockResolvedValue(true),
            };
            jest.spyOn(LessonPlan.prototype, 'save').mockResolvedValue(mockNewLesson);

            await communityController.copyLessonToClass(req, res, next);

            expect(res.status).toHaveBeenCalledWith(201);
        });

        it('should return 400 if userId not provided', async () => {
            req.params = { id: 'lesson123' };
            req.body = { targetClassId: 'class123' };

            await communityController.copyLessonToClass(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 400 if targetClassId not provided', async () => {
            req.params = { id: 'lesson123' };
            req.body = { userId: 'user123' };

            await communityController.copyLessonToClass(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 404 if original lesson not found', async () => {
            req.params = { id: 'nonexistent' };
            req.body = { userId: 'user123', targetClassId: 'class123' };

            LessonPlan.findById = jest.fn().mockResolvedValue(null);

            await communityController.copyLessonToClass(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return 400 if lesson not shared', async () => {
            req.params = { id: 'lesson123' };
            req.body = { userId: 'user123', targetClassId: 'class123' };

            const mockLesson = {
                _id: 'lesson123',
                isSharedToCommunity: false,
            };

            LessonPlan.findById = jest.fn().mockResolvedValue(mockLesson);

            await communityController.copyLessonToClass(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 403 if user does not own target class', async () => {
            req.params = { id: 'lesson123' };
            req.body = { userId: 'user123', targetClassId: 'class123' };

            const mockLesson = {
                _id: 'lesson123',
                isSharedToCommunity: true,
                parameters: { grade: 'Form 4' },
            };

            const mockClass = {
                _id: 'class123',
                grade: 'Form 4',
                createdBy: { toString: () => 'otheruser' },
            };

            LessonPlan.findById = jest.fn().mockResolvedValue(mockLesson);
            Class.findById = jest.fn().mockResolvedValue(mockClass);

            await communityController.copyLessonToClass(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
        });

        it('should return 400 if grade mismatch', async () => {
            req.params = { id: 'lesson123' };
            req.body = { userId: 'user123', targetClassId: 'class123' };

            const mockLesson = {
                _id: 'lesson123',
                isSharedToCommunity: true,
                parameters: { grade: 'Form 4' },
            };

            const mockClass = {
                _id: 'class123',
                grade: 'Form 5',
                createdBy: { toString: () => 'user123' },
            };

            LessonPlan.findById = jest.fn().mockResolvedValue(mockLesson);
            Class.findById = jest.fn().mockResolvedValue(mockClass);

            await communityController.copyLessonToClass(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('Grade mismatch'),
                })
            );
        });
    });
});
