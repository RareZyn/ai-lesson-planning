// src/pages/general/UnauthorizedPage.jsx
import React from 'react';
import { Button, Result } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import './UnauthorizedPage.css';

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/app';

  return (
    <div className="unauthorized-container">
      <Result
        status="403"
        title="403 - Unauthorized"
        subTitle={
          <>
            <p>You don't have permission to access this page.</p>
            <p>Attempted to access: <strong>{from}</strong></p>
          </>
        }
        extra={
          <div className="unauthorized-actions">
            <Button 
              type="primary" 
              onClick={() => navigate('/app')}
              className="unauthorized-button"
            >
              Go to Dashboard
            </Button>
            <Button 
              onClick={() => navigate('/login', { state: { from: location.state?.from } })}
              className="unauthorized-button"
            >
              Sign in as different user
            </Button>
          </div>
        }
      />
    </div>
  );
};

export default UnauthorizedPage;