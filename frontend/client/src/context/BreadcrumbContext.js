import React, { createContext, useState, useContext } from 'react';

const BreadcrumbContext = createContext();

export const BreadcrumbProvider = ({ children }) => {
    const [customBreadcrumbs, setCustomBreadcrumbs] = useState(null);

    return (
        <BreadcrumbContext.Provider value={{ customBreadcrumbs, setCustomBreadcrumbs }}>
            {children}
        </BreadcrumbContext.Provider>
    );
};

export const useBreadcrumb = () => {
    const context = useContext(BreadcrumbContext);
    if (!context) {
        throw new Error('useBreadcrumb must be used within a BreadcrumbProvider');
    }
    return context;
};
