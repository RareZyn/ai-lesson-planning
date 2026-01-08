/**
 * Global test setup for backend tests
 * Mocks external dependencies and sets up environment
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.ENCRYPTION_SECRET = 'test-encryption-secret-key-32chars!!';
process.env.MONGO_URI = 'mongodb://localhost:27017/test-db';

// Mock console.error to reduce noise in tests (optional)
beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => { });
});

afterAll(() => {
    jest.restoreAllMocks();
});

// Global timeout for async tests
jest.setTimeout(10000);
