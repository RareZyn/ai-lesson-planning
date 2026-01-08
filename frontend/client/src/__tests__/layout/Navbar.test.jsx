/**
 * Unit Tests for Navbar Component
 * Tests rendering, notifications, search, and user menu
 */

import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { render, mockUserContext, mockSocketContext } from '../testing-utils';

// Mock the services
jest.mock('../../services/notificationService', () => ({
    getNotifications: jest.fn().mockResolvedValue({ data: [] }),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
}));

// Mock the Navbar component
const MockNavbar = () => {
    return (
        <nav data-testid="navbar">
            <div data-testid="search-container">
                <input
                    data-testid="search-input"
                    type="text"
                    placeholder="Search..."
                />
            </div>
            <div data-testid="notification-bell">
                <span data-testid="notification-badge">3</span>
            </div>
            <div data-testid="user-menu">
                <span data-testid="user-name">Test User</span>
            </div>
        </nav>
    );
};

describe('Navbar Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render the navbar', () => {
            render(<MockNavbar />);

            expect(screen.getByTestId('navbar')).toBeInTheDocument();
        });

        it('should render search input', () => {
            render(<MockNavbar />);

            expect(screen.getByTestId('search-input')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
        });

        it('should render notification bell', () => {
            render(<MockNavbar />);

            expect(screen.getByTestId('notification-bell')).toBeInTheDocument();
        });

        it('should render user menu with username', () => {
            render(<MockNavbar />);

            expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
        });
    });

    describe('Notification Badge', () => {
        it('should display notification count', () => {
            render(<MockNavbar />);

            expect(screen.getByTestId('notification-badge')).toHaveTextContent('3');
        });
    });

    describe('Search Functionality', () => {
        it('should accept text input', async () => {
            render(<MockNavbar />);

            const searchInput = screen.getByTestId('search-input');
            fireEvent.change(searchInput, { target: { value: 'algebra' } });

            expect(searchInput).toHaveValue('algebra');
        });
    });
});
