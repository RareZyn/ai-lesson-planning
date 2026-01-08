/**
 * Test Utilities for Frontend Component Testing
 * Provides custom render function with all required providers
 */

import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock Context Values
export const mockAuthContext = {
    currentUser: null,
    loading: false,
};

export const mockUserContext = {
    currentUser: {
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        roles: ['teacher'],
        schoolId: 'school123',
        isActive: true,
    },
    userId: 'user123',
    isAuthenticated: true,
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
    updateUser: jest.fn(),
    refreshUser: jest.fn(),
};

export const mockSocketContext = {
    socket: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
    },
    isConnected: true,
};

export const mockBreadcrumbContext = {
    customBreadcrumbs: null,
    setCustomBreadcrumbs: jest.fn(),
};

// Create mock providers
const MockAuthProvider = ({ children, value = mockAuthContext }) => {
    const AuthContext = React.createContext(value);
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const MockUserProvider = ({ children, value = mockUserContext }) => {
    const UserContext = React.createContext(value);
    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

const MockSocketProvider = ({ children, value = mockSocketContext }) => {
    const SocketContext = React.createContext(value);
    return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

const MockBreadcrumbProvider = ({ children, value = mockBreadcrumbContext }) => {
    const BreadcrumbContext = React.createContext(value);
    return <BreadcrumbContext.Provider value={value}>{children}</BreadcrumbContext.Provider>;
};

/**
 * Custom render function that wraps components with all necessary providers
 * @param {React.ReactElement} ui - The component to render
 * @param {Object} options - Render options
 * @param {Object} options.authValue - Custom auth context value
 * @param {Object} options.userValue - Custom user context value 
 * @param {Object} options.socketValue - Custom socket context value
 * @param {Object} options.breadcrumbValue - Custom breadcrumb context value
 * @param {string} options.route - Initial route for router
 */
const customRender = (
    ui,
    {
        authValue = mockAuthContext,
        userValue = mockUserContext,
        socketValue = mockSocketContext,
        breadcrumbValue = mockBreadcrumbContext,
        route = '/',
        ...renderOptions
    } = {}
) => {
    window.history.pushState({}, 'Test page', route);

    const AllProviders = ({ children }) => (
        <BrowserRouter>
            <MockAuthProvider value={authValue}>
                <MockUserProvider value={userValue}>
                    <MockSocketProvider value={socketValue}>
                        <MockBreadcrumbProvider value={breadcrumbValue}>
                            {children}
                        </MockBreadcrumbProvider>
                    </MockSocketProvider>
                </MockUserProvider>
            </MockAuthProvider>
        </BrowserRouter>
    );

    return render(ui, { wrapper: AllProviders, ...renderOptions });
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };

// Helper to create mock API responses
export const createMockApiResponse = (data, success = true) => ({
    data: { success, data },
    status: success ? 200 : 400,
});

// Helper to mock axios
export const mockAxios = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(() => mockAxios),
    interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() },
    },
    defaults: {
        headers: { common: {} },
    },
};

// Helper to wait for async operations
export const waitForLoadingToFinish = () =>
    new Promise(resolve => setTimeout(resolve, 0));

// Placeholder test to prevent "no tests" error (this file is a utility module)
describe('Testing Utilities', () => {
    it('exports render function', () => {
        expect(typeof customRender).toBe('function');
    });
});
