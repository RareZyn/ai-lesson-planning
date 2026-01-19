import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Dropdown } from "antd";
import { useBreadcrumb } from "../context/BreadcrumbContext";
import "./Breadcrumb.css";

const Breadcrumb = ({ customBreadcrumbs: propBreadcrumbs = null }) => {
  const location = useLocation();
  const { customBreadcrumbs: contextBreadcrumbs } = useBreadcrumb();

  // 1. Determine local items (Auto-generated)
  // Don't show breadcrumb on home page if auto-generating
  const isHome = location.pathname === "/app";

  // Helper for auto-generation
  const generateBreadcrumbs = () => {
    if (isHome) return [];

    const breadcrumbNameMap = {
      "/app": "Home",
      "/app/assessment": "Assessment",
      "/app/assessment/generator": "Generator",
      "/app/lesson-plans": "Lesson Plans",
      "/app/activities": "Activities Generator",
      "/app/answer-checker": "Answer Checker",
      "/app/downloads": "File Download",
      "/app/materials": "Materials",
      "/app/graph": "Graph",
      "/app/admin": "Admin Dashboard",
    };

    const nonRoutablePaths = [
      /^\/app\/admin\/lessons$/,
      /^\/app\/admin\/lessons\/[^/]+$/,
      /^\/app\/admin\/teacher-analytics$/,
      /^\/app\/admin\/syllabuses$/,
    ];

    const pathnames = location.pathname.split("/").filter((x) => x);
    const appPathnames = pathnames.slice(1); // remove empty/first if needed, based on split
    // Actually pathnames for "/app/foo" -> ["app", "foo"]

    const crumbs = [];
    // Always start with Home
    crumbs.push({
      label: "Home",
      link: "/app",
    });

    let currentPath = "/app";
    appPathnames.forEach((pathname, index) => {
      currentPath += `/${pathname}`;

      const breadcrumbName =
        breadcrumbNameMap[currentPath] ||
        pathname.charAt(0).toUpperCase() + pathname.slice(1);

      const isNonRoutable = nonRoutablePaths.some((pattern) => pattern.test(currentPath));
      const isLast = index === appPathnames.length - 1;

      crumbs.push({
        label: breadcrumbName,
        link: isLast || isNonRoutable ? null : currentPath,
      });
    });
    return crumbs;
  };

  // 2. Resolve final items
  let items = propBreadcrumbs || contextBreadcrumbs;

  if (!items) {
    if (isHome) return null;
    items = generateBreadcrumbs();
  }

  // 3. Logic: Show latest 2, collapse rest
  // If length <= 2, show all.
  // If length > 2, hidden = 0...(length-2), visible = (length-2)...end
  const MAX_VISIBLE = 2;
  let visibleItems = items;
  let hiddenItems = [];

  if (items.length > MAX_VISIBLE) {
    visibleItems = items.slice(-MAX_VISIBLE);
    hiddenItems = items.slice(0, items.length - MAX_VISIBLE);
  }

  // 4. Dropdown Menu Items
  const menuItems = hiddenItems.map((crumb, index) => ({
    key: index,
    label: crumb.link ? (
      <Link to={crumb.link} style={{ display: 'block', width: '100%' }}>
        {crumb.label}
      </Link>
    ) : (
      <span>{crumb.label}</span>
    ),
  }));

  return (
    <nav className="breadcrumb-container">
      <ol className="breadcrumb">
        {/* Render Dropdown for hidden items if any */}
        {hiddenItems.length > 0 && (
          <li className="breadcrumb-item">
            <Dropdown menu={{ items: menuItems }} trigger={['click']}>
              <span
                className="breadcrumb-ellipsis"
                role="button"
                style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
              >
                ...
              </span>
            </Dropdown>
          </li>
        )}

        {/* Render Visible Items */}
        {visibleItems.map((crumb, index) => {
          // Original logic was using index to check specific things, but here the index is within visibleItems
          // IMPORTANT: We need correct key.
          // crumb.link determines if it's a link.
          return (
            <li key={`vis-${index}`} className="breadcrumb-item">
              {crumb.link ? (
                <Link to={crumb.link} className="breadcrumb-link">
                  {crumb.label}
                </Link>
              ) : (
                <span className="breadcrumb-current">{crumb.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
