// src/components/general/ProtectedRoute.jsx - Updated to work with both contexts
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
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Only proceed when auth check is complete
    if (!loading) {
      if (!user) {
        const timer = setInterval(() => {
          setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
      } else if (roles && !roles.some((role) => user.roles?.includes(role))) {
        const timer = setInterval(() => {
          setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
      } else {
        // Only show content when everything checks out
        setShowContent(true);
      }
    }
  }, [loading, user, roles]);

  useEffect(() => {
    if (
      countdown === 0 &&
      (!user || (roles && !roles.some((role) => user.roles?.includes(role))))
    ) {
      setShowContent(false);
    }
  }, [countdown, user, roles]);

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="spinner"></div>
        <p>Verifying your session...</p>
      </div>
    );
  }

  if (!user && countdown === 0) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (
    roles &&
    !roles.some((role) => user.roles?.includes(role)) &&
    countdown === 0
  ) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (!user) {
    return (
      <div className="auth-redirect">
        <div className="spinner"></div>
        <p>Redirecting to login in {countdown} seconds...</p>
      </div>
    );
  }

  if (roles && !roles.some((role) => user.roles?.includes(role))) {
    return (
      <div className="auth-unauthorized">
        <h2>Access Denied</h2>
        <p>You don't have permission to view this page.</p>
        <p>Redirecting in {countdown} seconds...</p>
      </div>
    );
  }

  return showContent ? children : null;
};

export default ProtectedRoute;
