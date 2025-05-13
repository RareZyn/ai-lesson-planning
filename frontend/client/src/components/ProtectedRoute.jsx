import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ProtectedRoute.css';

const ProtectedRoute = ({ children, roles }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  const [showContent, setShowContent] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Only proceed when auth check is complete
    if (!loading) {
      if (!currentUser) {
        const timer = setInterval(() => {
          setCountdown(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
      } else if (roles && !roles.some(role => currentUser.roles?.includes(role))) {
        const timer = setInterval(() => {
          setCountdown(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
      } else {
        // Only show content when everything checks out
        setShowContent(true);
      }
    }
  }, [loading, currentUser, roles]);

  useEffect(() => {
    if (countdown === 0 && (!currentUser || (roles && !roles.some(role => currentUser.roles?.includes(role))))) {
      setShowContent(false);
    }
  }, [countdown, currentUser, roles]);

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="spinner"></div>
        <p>Verifying your session...</p>
      </div>
    );
  }

  if (!currentUser && countdown === 0) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (roles && !roles.some(role => currentUser.roles?.includes(role)) && countdown === 0) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (!currentUser) {
    return (
      <div className="auth-redirect">
        <div className="spinner"></div>
        <p>Redirecting to login in {countdown} seconds...</p>
      </div>
    );
  }

  if (roles && !roles.some(role => currentUser.roles?.includes(role))) {
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