import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./Breadcrumb.css";

const Breadcrumb = ({ customBreadcrumbs = null }) => {
  const location = useLocation();

  // Define breadcrumb mappings for your routes
  const breadcrumbNameMap = {
    "/app": "Home",
    "/app/assessment": "Assessment",
    "/app/assessment/generator": "Generator",
    "/app/lesson-plans": "Lesson Plans",
    "/app/activities": "Activities Generator",
    "/app/answer-checker": "Answer Checker",
    "/app/downloads": "Downloads",
    "/app/calendar": "Calendar",
    "/app/materials": "Materials",
    "/app/graph": "Graph",
    "/app/recent-all": "Recently Opened",
    "/app/classes-all": "Recent Classes",
    "/app/lesson": "Lesson",
    "/app/class": "Class",
  };

  // If custom breadcrumbs are provided, use them instead
  if (customBreadcrumbs) {
    return (
      <nav className="breadcrumb-container">
        <ol className="breadcrumb">
          {customBreadcrumbs.map((crumb, index) => (
            <li key={index} className="breadcrumb-item">
              {crumb.link && index < customBreadcrumbs.length - 1 ? (
                <Link to={crumb.link} className="breadcrumb-link">
                  {crumb.label}
                </Link>
              ) : (
                <span className="breadcrumb-current">{crumb.label}</span>
              )}
              {index < customBreadcrumbs.length - 1 && (
                <span className="breadcrumb-separator">/</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    );
  }

  // Auto-generate breadcrumbs based on current path
  const pathnames = location.pathname.split("/").filter((x) => x);

  // Don't show breadcrumb on home page
  if (location.pathname === "/app" || pathnames.length <= 1) {
    return null;
  }

  const breadcrumbs = [];

  // Always start with Home
  breadcrumbs.push({
    label: "Home",
    link: "/app",
  });

  // Build breadcrumbs from path segments
  let currentPath = "";
  pathnames.forEach((pathname, index) => {
    currentPath += `/${pathname}`;

    const breadcrumbName =
      breadcrumbNameMap[currentPath] ||
      pathname.charAt(0).toUpperCase() + pathname.slice(1);

    breadcrumbs.push({
      label: breadcrumbName,
      link: index === pathnames.length - 1 ? null : currentPath, // Last item has no link
    });
  });

  return (
    <nav className="breadcrumb-container">
      <ol className="breadcrumb">
        {breadcrumbs.map((crumb, index) => (
          <li key={index} className="breadcrumb-item">
            {crumb.link ? (
              <Link to={crumb.link} className="breadcrumb-link">
                {crumb.label}
              </Link>
            ) : (
              <span className="breadcrumb-current">{crumb.label}</span>
            )}
            {index < breadcrumbs.length - 1 && (
              <span className="breadcrumb-separator">/</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
