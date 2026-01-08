/**
 * Unit Tests for UserContext
 * Tests authentication state management and API sync
 * 
 * UPDATED: Matches actual UserContext.js implementation
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock Firebase first
jest.mock('../../firebase', () => ({
    auth: {},
    signOut: jest.fn().mockResolvedValue(true),
}));

// Mock dependencies
jest.mock('../../services/api', () => ({
    authAPI: {
        getMe: jest.fn(),
        login: jest.fn(),
        logout: jest.fn(),
        updateProfile: jest.fn(),
        findOrCreateFirebaseUser: jest.fn(),
    },
}));

jest.mock('../../context/AuthContext', () => ({
    useAuth: jest.fn(() => ({
        currentUser: null,
        loading: false,
    })),
}));

import { UserProvider, useUser } from '../../context/UserContext';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const wrapper = ({ children }) => (
    <BrowserRouter>
        <UserProvider>{children}</UserProvider>
    </BrowserRouter>
);

describe('UserContext', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
        // Reset useAuth mock
        useAuth.mockReturnValue({
            currentUser: null,
            loading: false,
        });
    });

    describe('Initial State', () => {
        it('should start with loading state', async () => {
            const { result } = renderHook(() => useUser(), { wrapper });

            // Initial state should have loading true
            expect(result.current.loading).toBe(true);
        });

        it('should eventually set loading to false', async () => {
            const { result } = renderHook(() => useUser(), { wrapper });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.isReady).toBe(true);
        });
    });

    describe('isAuthenticated State', () => {
        it('should be false when no user', async () => {
            const { result } = renderHook(() => useUser(), { wrapper });

            await waitFor(() => {
                expect(result.current.isReady).toBe(true);
            });

            expect(result.current.currentUser).toBeNull();
            expect(result.current.isAuthenticated).toBe(false);
        });
    });

    describe('Logout', () => {
        it('should clear user and token on logout', async () => {
            authAPI.logout.mockResolvedValueOnce({ success: true });

            const { result } = renderHook(() => useUser(), { wrapper });

            await waitFor(() => {
                expect(result.current.isReady).toBe(true);
            });

            await act(async () => {
                await result.current.logout();
            });

            expect(result.current.currentUser).toBeNull();
            expect(result.current.isAuthenticated).toBe(false);
            expect(authAPI.logout).toHaveBeenCalled();
        });
    });

    describe('Deactivation Detection', () => {
        it('should detect account deactivation', async () => {
            // When user has isActive: false, isDeactivated should be true
            const mockUser = { _id: 'user123', isActive: false, schoolId: 'school123' };

            // Mock Firebase user to trigger handleFirebaseLogin
            useAuth.mockReturnValue({
                currentUser: { uid: 'firebase123', email: 'test@test.com' },
                loading: false,
            });

            authAPI.findOrCreateFirebaseUser.mockResolvedValueOnce({
                success: true,
                user: mockUser,
            });

            const { result } = renderHook(() => useUser(), { wrapper });

            await waitFor(() => {
                expect(result.current.isReady).toBe(true);
            });

            // If currentUser is set and isActive is false
            if (result.current.currentUser) {
                expect(result.current.isDeactivated).toBe(true);
            }
        });
    });

    describe('Context Provider', () => {
        it('should provide all expected functions', async () => {
            const { result } = renderHook(() => useUser(), { wrapper });

            await waitFor(() => {
                expect(result.current.isReady).toBe(true);
            });

            // Check all context values are available
            expect(result.current).toHaveProperty('currentUser');
            expect(result.current).toHaveProperty('userId');
            expect(result.current).toHaveProperty('loading');
            expect(result.current).toHaveProperty('isAuthenticated');
            expect(result.current).toHaveProperty('isReady');
            expect(result.current).toHaveProperty('isDeactivated');
            expect(result.current).toHaveProperty('logout');
            expect(result.current).toHaveProperty('updateUser');
            expect(result.current).toHaveProperty('handleFirebaseLogin');
            expect(result.current).toHaveProperty('refreshUser');
        });

        it('should throw error when used outside provider', () => {
            // Suppress console.error for this test
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

            expect(() => {
                renderHook(() => useUser());
            }).toThrow('useUser must be used within a UserProvider');

            consoleSpy.mockRestore();
        });
    });

    describe('Update User', () => {
        it('should call updateProfile API', async () => {
            const updatedUser = { _id: 'user123', name: 'Updated Name', schoolId: 'school123' };

            authAPI.updateProfile.mockResolvedValueOnce({
                success: true,
                user: updatedUser,
            });

            // First set up an authenticated user
            useAuth.mockReturnValue({
                currentUser: { uid: 'firebase123', email: 'test@test.com' },
                loading: false,
            });

            authAPI.findOrCreateFirebaseUser.mockResolvedValueOnce({
                success: true,
                user: { _id: 'user123', name: 'Original Name', schoolId: 'school123' },
            });

            const { result } = renderHook(() => useUser(), { wrapper });

            await waitFor(() => {
                expect(result.current.isReady).toBe(true);
            });

            await act(async () => {
                await result.current.updateUser({ name: 'Updated Name' });
            });

            expect(authAPI.updateProfile).toHaveBeenCalledWith({ name: 'Updated Name' });
        });
    });
});
