// src/components/general/ProtectedRoute.jsx - Clean version without console logs
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useUser } from "../../context/UserContext";
import "./ProtectedRoute.css";

const ProtectedRoute = ({ children, roles }) => {
  // Get both contexts
  const { currentUser: firebaseUser, loading: authLoading } = useAuth();
  const {
    currentUser: contextUser,
    loading: userLoading,
    isAuthenticated,
    isReady,
  } = useUser();

  const location = useLocation();
  const [showContent, setShowContent] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  // Determine the overall loading state
  const isLoading = authLoading || userLoading || !isReady;

  // Use MongoDB user if available, fallback to Firebase user
  const user = contextUser || firebaseUser;

  // Check if user has valid authentication (either from Firebase or MongoDB)
  const hasValidAuth = Boolean(
    (firebaseUser && firebaseUser.uid) || // Firebase user exists
      (contextUser && (contextUser._id || contextUser.id)) || // MongoDB user exists
      isAuthenticated || // UserContext says we're authenticated
      (user && (user._id || user.id || user.uid)) // Any user object with valid ID
  );

  useEffect(() => {
    // Reset show content when loading changes
    if (isLoading) {
      setShowContent(false);
      return;
    }

    // Only proceed when all auth checks are complete
    if (!isLoading) {
      if (!hasValidAuth || !user) {
        // Not authenticated - start countdown for redirect
        const timer = setInterval(() => {
          setRedirectCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        return () => clearInterval(timer);
      } else if (
        roles &&
        user.roles &&
        !roles.some((role) => user.roles.includes(role))
      ) {
        // Authenticated but insufficient permissions
        const timer = setInterval(() => {
          setRedirectCountdown((prev) => {
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
        setRedirectCountdown(3); // Reset countdown
      }
    }
  }, [isLoading, hasValidAuth, user, isAuthenticated, roles]);

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
  if (!hasValidAuth || !user) {
    if (redirectCountdown <= 0) {
      return <Navigate to="/" state={{ from: location }} replace />;
    }
    return (
      <div className="auth-redirect">
        <div className="spinner"></div>
        <p>
          Authentication required. Redirecting to login in {redirectCountdown}{" "}
          seconds...
        </p>
      </div>
    );
  }

  // Role-based access control
  if (roles && user.roles && !roles.some((role) => user.roles.includes(role))) {
    if (redirectCountdown <= 0) {
      return <Navigate to="/unauthorized" replace />;
    }
    return (
      <div className="auth-unauthorized">
        <h2>Access Denied</h2>
        <p>You don't have permission to view this page.</p>
        <p>Required roles: {roles.join(", ")}</p>
        <p>Your roles: {user.roles?.join(", ") || "None"}</p>
        <p>Redirecting in {redirectCountdown} seconds...</p>
      </div>
    );
  }

  // Only show content when all auth checks pass
  if (showContent) {
    return children;
  } else {
    return (
      <div className="auth-loading">
        <div className="spinner"></div>
        <p>Preparing your dashboard...</p>
      </div>
    );
  }
};

export default ProtectedRoute;
