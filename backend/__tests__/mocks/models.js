/**
 * Mock Mongoose models for isolated controller testing
 */

// Mock user data generator
const createMockUser = (overrides = {}) => ({
    _id: 'user123',
    name: 'Test User',
    email: 'test@example.com',
    password: '$2a$10$hashedpassword',
    roles: ['teacher'],
    schoolId: 'school123',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue(this),
    comparePassword: jest.fn().mockResolvedValue(true),
    getGeminiApiKey: jest.fn().mockReturnValue(null),
    ...overrides,
});

// Mock class data generator
const createMockClass = (overrides = {}) => ({
    _id: 'class123',
    name: 'Math 101',
    subject: 'Mathematics',
    grade: '10',
    year: '2024',
    createdBy: 'user123',
    schoolId: 'school123',
    students: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue(this),
    ...overrides,
});

// Mock lesson data generator
const createMockLesson = (overrides = {}) => ({
    _id: 'lesson123',
    topic: 'Algebra Basics',
    classId: 'class123',
    createdBy: 'user123',
    schoolId: 'school123',
    parameters: {
        grade: '10',
        proficiency: 'intermediate',
        duration: 60,
        activityType: 'lecture',
    },
    content: {
        learningObjective: 'Students will understand basic algebra',
        successCriteria: ['Solve linear equations'],
        activities: {
            preLesson: ['Review previous lesson'],
            duringLesson: ['Explain concepts', 'Practice problems'],
            postLesson: ['Assign homework'],
        },
    },
    approvalStatus: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue(this),
    ...overrides,
});

// Mock notification data generator
const createMockNotification = (overrides = {}) => ({
    _id: 'notification123',
    userId: 'user123',
    type: 'lesson_approval',
    title: 'Test Notification',
    message: 'This is a test notification',
    isRead: false,
    createdAt: new Date(),
    save: jest.fn().mockResolvedValue(this),
    ...overrides,
});

// Mock material data generator
const createMockMaterial = (overrides = {}) => ({
    _id: 'material123',
    name: 'Test Material.pdf',
    type: 'pdf',
    size: 1024,
    content: 'base64encodedcontent',
    createdBy: 'user123',
    schoolId: 'school123',
    createdAt: new Date(),
    save: jest.fn().mockResolvedValue(this),
    ...overrides,
});

// Mock school data generator
const createMockSchool = (overrides = {}) => ({
    _id: 'school123',
    name: 'Test School',
    type: 'secondary',
    createdAt: new Date(),
    save: jest.fn().mockResolvedValue(this),
    ...overrides,
});

// Mock registration token generator
const createMockRegistrationToken = (overrides = {}) => ({
    _id: 'token123',
    token: 'abc123def456',
    schoolId: 'school123',
    createdBy: 'user123',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    usageLimit: 10,
    usedCount: 0,
    isRevoked: false,
    save: jest.fn().mockResolvedValue(this),
    ...overrides,
});

module.exports = {
    createMockUser,
    createMockClass,
    createMockLesson,
    createMockNotification,
    createMockMaterial,
    createMockSchool,
    createMockRegistrationToken,
};
