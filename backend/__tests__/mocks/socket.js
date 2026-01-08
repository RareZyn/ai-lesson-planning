/**
 * Mock Socket.io for testing notification emissions
 */

const createMockSocket = () => ({
    emit: jest.fn(),
    on: jest.fn(),
    join: jest.fn(),
    leave: jest.fn(),
    to: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
});

const createMockIO = () => {
    const mockSocket = createMockSocket();
    return {
        to: jest.fn().mockReturnValue({
            emit: jest.fn(),
        }),
        emit: jest.fn(),
        on: jest.fn(),
        sockets: {
            emit: jest.fn(),
        },
        in: jest.fn().mockReturnValue({
            emit: jest.fn(),
        }),
        _mockSocket: mockSocket,
    };
};

module.exports = {
    createMockSocket,
    createMockIO,
};
