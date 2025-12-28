import React from 'react';
import { Spin } from 'antd';
import './CommonTable.css';

/**
 * CommonTable Component
 * 
 * @param {Object} props
 * @param {Array} props.columns - Array of columns { title, dataIndex, key, render, width, align }
 * @param {Array} props.dataSource - Data array
 * @param {Boolean} props.loading - Loading state
 * @param {Object|Boolean} props.pagination - Pagination config { current, pageSize, total, onChange } or false
 * @param {String|Function} props.rowKey - Unique key for rows
 * @param {Function} props.onRow - Function to get row props: (record) => ({ onClick: ... })
 * @param {Function} props.renderCard - Function to render mobile card: (record) => ReactNode. If not provided, a default card is generated.
 */
const CommonTable = ({
    columns,
    dataSource,
    loading = false,
    pagination = false,
    rowKey = 'id',
    onRow,
    renderCard,
}) => {

    const getRowKey = (record, index) => {
        if (typeof rowKey === 'function') {
            return rowKey(record);
        }
        return record[rowKey] || index;
    };

    const getValue = (record, dataIndex) => {
        if (!dataIndex) return undefined;
        if (Array.isArray(dataIndex)) {
            return dataIndex.reduce((acc, key) => acc && acc[key], record);
        }
        return record[dataIndex];
    };

    if (loading) {
        return (
            <div className="common-loading-container" style={{ padding: '40px', textAlign: 'center' }}>
                <Spin size="large" tip="Loading data..." />
            </div>
        );
    }

    if (!dataSource || dataSource.length === 0) {
        return (
            <div className="common-empty-state">
                No data available
            </div>
        );
    }

    // --- Pagination Component ---


    return (
        <>
            <div className="common-table-container">
                {/* === DESKTOP TABLE === */}
                <table className="common-table">
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.key || col.dataIndex}
                                    style={{
                                        width: col.width,
                                        textAlign: col.align || 'left'
                                    }}
                                >
                                    {col.title}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {dataSource.map((record, index) => {
                            const rowProps = onRow ? onRow(record) : {};
                            const key = getRowKey(record, index);

                            return (
                                <tr key={key} {...rowProps} style={{ cursor: rowProps.onClick ? 'pointer' : 'default' }}>
                                    {columns.map((col) => {
                                        const cellKey = col.key || col.dataIndex;
                                        const value = getValue(record, col.dataIndex);

                                        return (
                                            <td
                                                key={cellKey}
                                                style={{ textAlign: col.align || 'left' }}
                                            >
                                                {col.render ? col.render(value, record, index) : value}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* Pagination only shown here on desktop if we want it inside the container. 
            However, usually pagination is outside/at bottom.
            Let's put it at bottom of this container for desktop. */}

            </div>

            {/* === MOBILE LIST === */}
            <div className="common-mobile-list">
                {dataSource.map((record, index) => {
                    const key = getRowKey(record, index);
                    const rowProps = onRow ? onRow(record) : {};

                    if (renderCard) {
                        return (
                            <div key={key} className="common-mobile-wrapper" onClick={rowProps.onClick}>
                                {renderCard(record)}
                            </div>
                        );
                    }

                    // Default Card Render (Fallback)
                    return (
                        <div key={key} className="common-mobile-card" onClick={rowProps.onClick}>
                            {columns.map((col) => {
                                if (!col.title) return null; // Skip columns without titles (like actions sometimes)
                                const value = getValue(record, col.dataIndex);
                                return (
                                    <div className="common-card-row" key={col.key || col.dataIndex}>
                                        <span className="common-card-label">{col.title}:</span>
                                        <span className="common-card-value">
                                            {col.render ? col.render(value, record, index) : value}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}

                {/* Mobile Pagination */}

            </div>
        </>
    );
};

export default CommonTable;
