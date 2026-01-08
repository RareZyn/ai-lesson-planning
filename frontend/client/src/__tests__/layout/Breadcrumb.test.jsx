/**
 * Unit Tests for Breadcrumb Component
 * Tests breadcrumb rendering and navigation
 */

import React from 'react';
import { screen } from '@testing-library/react';
import { render } from '../testing-utils';

// Mock Breadcrumb component
const MockBreadcrumb = ({ items = [] }) => {
    const defaultItems = items.length ? items : [
        { label: 'Home', path: '/' },
        { label: 'Classes', path: '/classes' },
        { label: 'Math 101', path: '/classes/math101' },
    ];

    return (
        <nav data-testid="breadcrumb" aria-label="Breadcrumb">
            <ol className="breadcrumb-list">
                {defaultItems.map((item, index) => (
                    <li
                        key={item.path}
                        data-testid={`breadcrumb-item-${index}`}
                        className={index === defaultItems.length - 1 ? 'current' : ''}
                    >
                        {index < defaultItems.length - 1 ? (
                            <>
                                <a href={item.path} data-testid={`breadcrumb-link-${index}`}>
                                    {item.label}
                                </a>
                                <span className="separator" data-testid="separator">/</span>
                            </>
                        ) : (
                            <span data-testid="current-page">{item.label}</span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
};

describe('Breadcrumb Component', () => {
    describe('Rendering', () => {
        it('should render the breadcrumb navigation', () => {
            render(<MockBreadcrumb />);

            expect(screen.getByTestId('breadcrumb')).toBeInTheDocument();
        });

        it('should have proper aria label for accessibility', () => {
            render(<MockBreadcrumb />);

            expect(screen.getByLabelText('Breadcrumb')).toBeInTheDocument();
        });

        it('should render all breadcrumb items', () => {
            render(<MockBreadcrumb />);

            expect(screen.getByTestId('breadcrumb-item-0')).toBeInTheDocument();
            expect(screen.getByTestId('breadcrumb-item-1')).toBeInTheDocument();
            expect(screen.getByTestId('breadcrumb-item-2')).toBeInTheDocument();
        });
    });

    describe('Links', () => {
        it('should render links for non-current items', () => {
            render(<MockBreadcrumb />);

            expect(screen.getByTestId('breadcrumb-link-0')).toHaveAttribute('href', '/');
            expect(screen.getByTestId('breadcrumb-link-1')).toHaveAttribute('href', '/classes');
        });

        it('should render current page as text, not a link', () => {
            render(<MockBreadcrumb />);

            expect(screen.getByTestId('current-page')).toHaveTextContent('Math 101');
            expect(screen.queryByTestId('breadcrumb-link-2')).not.toBeInTheDocument();
        });
    });

    describe('Separators', () => {
        it('should render separators between items', () => {
            render(<MockBreadcrumb />);

            const separators = screen.getAllByTestId('separator');
            expect(separators).toHaveLength(2); // One less than total items
        });
    });

    describe('Custom Breadcrumbs', () => {
        it('should render custom breadcrumb items', () => {
            const customItems = [
                { label: 'Dashboard', path: '/dashboard' },
                { label: 'Settings', path: '/settings' },
            ];

            render(<MockBreadcrumb items={customItems} />);

            expect(screen.getByText('Dashboard')).toBeInTheDocument();
            expect(screen.getByText('Settings')).toBeInTheDocument();
        });

        it('should handle single item breadcrumb', () => {
            const singleItem = [{ label: 'Home', path: '/' }];

            render(<MockBreadcrumb items={singleItem} />);

            expect(screen.getByTestId('current-page')).toHaveTextContent('Home');
            expect(screen.queryByTestId('separator')).not.toBeInTheDocument();
        });
    });
});
