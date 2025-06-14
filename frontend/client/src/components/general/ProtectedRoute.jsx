// src/components/general/ProtectedRoute.jsx - Fixed with better logout handling
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useUser } from "../../context/UserContext";
import "./ProtectedRoute.css";

const ProtectedRoute = ({ children, roles }) => {
  // Try to use UserContext first, fallback to AuthContext
  const {
    user: contextUser,
    loading: userLoading,
    isAuthenticated,
  } = useUser();
  const { currentUser, loading: authLoading } = useAuth();

  // Use whichever context has user data
  const user = contextUser || currentUser;
  const loading = userLoading || authLoading;

  const location = useLocation();
  const [showContent, setShowContent] = useState(false);
  const [countdown, setCountdown] = useState(3); // Reduced countdown for better UX

  useEffect(() => {
    // Only proceed when auth check is complete
    if (!loading) {
      if (!user) {
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
        // Only show content when everything checks out
        setShowContent(true);
      }
    }
  }, [loading, user, roles]);

  // Immediate redirect when not authenticated (after loading is complete)
  if (!loading && !user) {
    if (countdown <= 0) {
      return <Navigate to="/" state={{ from: location }} replace />;
    }
    return (
      <div className="auth-redirect">
        <div className="spinner"></div>
        <p>Redirecting to login in {countdown} seconds...</p>
      </div>
    );
  }

  // Role-based access control
  if (
    !loading &&
    user &&
    roles &&
    !roles.some((role) => user.roles?.includes(role))
  ) {
    if (countdown <= 0) {
      return <Navigate to="/unauthorized" replace />;
    }
    return (
      <div className="auth-unauthorized">
        <h2>Access Denied</h2>
        <p>You don't have permission to view this page.</p>
        <p>Redirecting in {countdown} seconds...</p>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="auth-loading">
        <div className="spinner"></div>
        <p>Verifying your session...</p>
      </div>
    );
  }

  return showContent ? children : null;
};

export default ProtectedRoute;
