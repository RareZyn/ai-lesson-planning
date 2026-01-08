/**
 * Mock Express request and response objects for controller testing
 */

const createMockRequest = (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    user: undefined,
    cookies: {},
    app: {
        get: jest.fn().mockReturnValue(null), // for io
    },
    ...overrides,
});

const createMockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.cookie = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);
    res.set = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn().mockReturnValue(res);
    return res;
};

const createMockNext = () => jest.fn();

module.exports = {
    createMockRequest,
    createMockResponse,
    createMockNext,
};
