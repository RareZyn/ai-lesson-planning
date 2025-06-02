import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./Breadcrumb.css";

const Breadcrumb = ({ customBreadcrumbs = null }) => {
  const location = useLocation();

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
  };


  // If custom breadcrumbs are provided, use them
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
              {/* Remove separator from here - let CSS handle it */}
            </li>
          ))}
        </ol>
      </nav>
    );
  }

  // Don't show breadcrumb on home page
  if (location.pathname === "/app") {
    return null;
  }

  // Auto-generate breadcrumbs for other pages
  const pathnames = location.pathname.split("/").filter((x) => x);
  const appPathnames = pathnames.slice(1);
  const breadcrumbs = [];

  // Always start with Home
  breadcrumbs.push({
    label: "Home",
    link: "/app",
  });

  // Build breadcrumbs from remaining path segments
  let currentPath = "/app";
  appPathnames.forEach((pathname, index) => {
    currentPath += `/${pathname}`;

    const breadcrumbName =
      breadcrumbNameMap[currentPath] ||
      pathname.charAt(0).toUpperCase() + pathname.slice(1);

    breadcrumbs.push({
      label: breadcrumbName,
      link: index === appPathnames.length - 1 ? null : currentPath,
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
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
