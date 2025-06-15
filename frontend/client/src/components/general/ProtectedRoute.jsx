// src/components/general/ProtectedRoute.jsx - Fixed version with better auth handling
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useUser } from "../../context/UserContext";
import "./ProtectedRoute.css";

const ProtectedRoute = ({ children, roles }) => {
  // Get both contexts
  const { currentUser, loading: authLoading } = useAuth();
  const {
    user: contextUser,
    loading: userLoading,
    isAuthenticated,
    isReady,
  } = useUser();

  const location = useLocation();
  const [showContent, setShowContent] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // Determine the overall loading state
  const isLoading = authLoading || userLoading || !isReady;

  // Use MongoDB user if available, fallback to Firebase user
  const user = contextUser || currentUser;

  useEffect(() => {
    // Only proceed when all auth checks are complete
    if (!isLoading) {
      if (!user || !isAuthenticated) {
        // Not authenticated - start countdown for redirect
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        return () => clearInterval(timer);
      } else if (roles && !roles.some((role) => user.roles?.includes(role))) {
        // Authenticated but insufficient permissions
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        return () => clearInterval(timer);
      } else {
        // All checks passed - show content
        setShowContent(true);
      }
    }
  }, [isLoading, user, isAuthenticated, roles]);

  // Show loading state while auth is being determined
  if (isLoading) {
    return (
      <div className="auth-loading">
        <div className="spinner"></div>
        <p>Verifying your session...</p>
      </div>
    );
  }

  // Redirect when not authenticated (after loading is complete)
  if (!user || !isAuthenticated) {
    if (countdown <= 0) {
      return <Navigate to="/" state={{ from: location }} replace />;
    }
    return (
      <div className="auth-redirect">
        <div className="spinner"></div>
        <p>
          Authentication required. Redirecting to login in {countdown}{" "}
          seconds...
        </p>
      </div>
    );
  }

  // Role-based access control
  if (roles && !roles.some((role) => user.roles?.includes(role))) {
    if (countdown <= 0) {
      return <Navigate to="/unauthorized" replace />;
    }
    return (
      <div className="auth-unauthorized">
        <h2>Access Denied</h2>
        <p>You don't have permission to view this page.</p>
        <p>Required roles: {roles.join(", ")}</p>
        <p>Your roles: {user.roles?.join(", ") || "None"}</p>
        <p>Redirecting in {countdown} seconds...</p>
      </div>
    );
  }

  // Only show content when all auth checks pass
  return showContent ? (
    children
  ) : (
    <div className="auth-loading">
      <div className="spinner"></div>
      <p>Loading content...</p>
    </div>
  );
};

export default ProtectedRoute;
