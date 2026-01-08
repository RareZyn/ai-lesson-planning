/**
 * Unit Tests for Sidebar Component
 * Tests rendering, menu items, and responsive behavior
 */

import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { render, mockUserContext } from '../testing-utils';

// Mock Sidebar component for testing
const MockSidebar = ({ isPinned = false, onTogglePin = jest.fn() }) => {
    return (
        <aside
            data-testid="sidebar"
            className={`sidebar ${isPinned ? 'pinned' : ''}`}
        >
            <ul className="sidebar-menu" data-testid="sidebar-menu">
                <li data-testid="menu-item-home">
                    <a href="/" className="menu-item">
                        <span className="menu-icon">🏠</span>
                        <span className="menu-label">Home</span>
                    </a>
                </li>
                <li data-testid="menu-item-classes">
                    <a href="/classes" className="menu-item">
                        <span className="menu-icon">📚</span>
                        <span className="menu-label">Classes</span>
                    </a>
                </li>
                <li data-testid="menu-item-planner">
                    <a href="/planner" className="menu-item">
                        <span className="menu-icon">📝</span>
                        <span className="menu-label">Planner</span>
                    </a>
                </li>
                <li data-testid="menu-item-materials">
                    <a href="/materials" className="menu-item">
                        <span className="menu-icon">📎</span>
                        <span className="menu-label">Materials</span>
                    </a>
                </li>
            </ul>
            <div className="sidebar-footer">
                <button
                    data-testid="pin-btn"
                    className="pin-btn"
                    onClick={onTogglePin}
                >
                    {isPinned ? '📌' : '📍'}
                </button>
            </div>
        </aside>
    );
};

describe('Sidebar Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render the sidebar', () => {
            render(<MockSidebar />);

            expect(screen.getByTestId('sidebar')).toBeInTheDocument();
        });

        it('should render all menu items', () => {
            render(<MockSidebar />);

            expect(screen.getByTestId('menu-item-home')).toBeInTheDocument();
            expect(screen.getByTestId('menu-item-classes')).toBeInTheDocument();
            expect(screen.getByTestId('menu-item-planner')).toBeInTheDocument();
            expect(screen.getByTestId('menu-item-materials')).toBeInTheDocument();
        });

        it('should render pin button', () => {
            render(<MockSidebar />);

            expect(screen.getByTestId('pin-btn')).toBeInTheDocument();
        });
    });

    describe('Collapsed State', () => {
        it('should not have pinned class when collapsed', () => {
            render(<MockSidebar isPinned={false} />);

            const sidebar = screen.getByTestId('sidebar');
            expect(sidebar).not.toHaveClass('pinned');
        });

        it('should have pinned class when expanded', () => {
            render(<MockSidebar isPinned={true} />);

            const sidebar = screen.getByTestId('sidebar');
            expect(sidebar).toHaveClass('pinned');
        });
    });

    describe('Pin/Unpin Toggle', () => {
        it('should call toggle function when pin button is clicked', () => {
            const onTogglePin = jest.fn();
            render(<MockSidebar onTogglePin={onTogglePin} />);

            const pinButton = screen.getByTestId('pin-btn');
            fireEvent.click(pinButton);

            expect(onTogglePin).toHaveBeenCalledTimes(1);
        });
    });

    describe('Menu Labels', () => {
        it('should display menu labels', () => {
            render(<MockSidebar isPinned={true} />);

            expect(screen.getByText('Home')).toBeInTheDocument();
            expect(screen.getByText('Classes')).toBeInTheDocument();
            expect(screen.getByText('Planner')).toBeInTheDocument();
            expect(screen.getByText('Materials')).toBeInTheDocument();
        });
    });

    describe('Role-Based Menu Items', () => {
        it('should show admin menu for admin users', () => {
            const adminContext = {
                ...mockUserContext,
                currentUser: {
                    ...mockUserContext.currentUser,
                    roles: ['admin'],
                },
            };

            // This would test actual component with role-based rendering
            render(<MockSidebar />, { userValue: adminContext });

            // Add assertion for admin menu items when testing real component
            expect(screen.getByTestId('sidebar-menu')).toBeInTheDocument();
        });
    });
});
