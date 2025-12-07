// src/pages/auth/LoginPage.jsx
import React, { useState, useEffect } from "react";
import { Form, Input, Button, message, Modal } from "antd";
import {
  UserOutlined,
  LockOutlined,
  GoogleOutlined,
  BarcodeOutlined, // Changed from BankOutlined for token
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import {
  auth,
  signInWithEmailAndPassword,
  signInWithPopup,
  googleProvider,
  setPersistence,
  browserLocalPersistence,
} from "../../firebase";
import { authAPI } from "../../services/api";
import { useUser } from "../../context/UserContext";
import GeminiApiKeyInput from "../../components/Modal/RegisterAPIKey/GeminiApiKeyInput";
import "./LoginPage.css";

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [pendingGoogleUser, setPendingGoogleUser] = useState(null);
  const [hasNavigated, setHasNavigated] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading: authLoading, isReady } = useUser();

  // Redirect if already authenticated (only once when ready)
  useEffect(() => {
    // Prevent multiple navigations
    if (hasNavigated) {
      return;
    }

    if (!authLoading && isReady && isAuthenticated) {
      setHasNavigated(true);
      const from = location.state?.from?.pathname || "/app";
      // Use setTimeout to avoid React state update warnings
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 100);
    } else {
    }
  }, [isAuthenticated, authLoading, isReady, navigate, location.state?.from?.pathname, hasNavigated]);

  // Handle modal submit for Google sign-in (now includes token)
  const handleModalSubmit = async (values) => {
    if (!pendingGoogleUser) return;

    setModalLoading(true);
    try {
      // Register user in MongoDB backend via Google OAuth with registrationToken
      // IMPORTANT: The backend /auth/google endpoint will need to be updated
      // to accept 'registrationToken' and assign the schoolId based on it.
      const response = await authAPI.googleAuthWithToken({ // Renamed or update existing googleAuth
        googleId: pendingGoogleUser.uid,
        email: pendingGoogleUser.email,
        name: values.name,
        registrationToken: values.registrationToken, // Pass the token here
        avatar: pendingGoogleUser.photoURL || "",
        geminiApiKey: values.geminiApiKey || "",
      });

      if (response.success) {
        message.success("Google login successful!");
        navigate(location.state?.from?.pathname || "/app/", {
          replace: true,
        });
        setModalVisible(false);
      } else {
        throw new Error(response.message || "Registration failed");
      }
    } catch (error) {
      console.error("Error completing Google registration:", error);
      message.error("Failed to complete registration");
    } finally {
      setModalLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      // Set persistence to LOCAL for Google sign-in (always remember)
      await setPersistence(auth, browserLocalPersistence);

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user exists in MongoDB
      try {
        // Try to authenticate with MongoDB
        const response = await authAPI.findOrCreateFirebaseUser({
          firebaseUid: user.uid,
          email: user.email,
          name: user.displayName || "",
          photoURL: user.photoURL || "",
        });

        if (response.success && response.user) {
          // Check if user has required fields (schoolId)
          // The backend should return the user's role and schoolId
          if (!response.user.schoolId) { // Check for schoolId instead of schoolName
            // New user or incomplete profile - show modal to get token
            setPendingGoogleUser(user);
            form.setFieldsValue({
              name: user.displayName || "",
            });
            setModalVisible(true);
            setGoogleLoading(false);
          } else {
            // Existing user with complete profile and schoolId
            message.success("Google login successful!");
            // Don't navigate manually - let UserContext and the useEffect handle it
            setGoogleLoading(false);
          }
        } else {
          throw new Error(response.message || "Authentication failed");
        }
      } catch (error) {
        console.error("MongoDB sync error:", error);

        // If user doesn't exist in MongoDB, show registration modal to get token
        setPendingGoogleUser(user);
        form.setFieldsValue({
          name: user.displayName || "",
        });
        setModalVisible(true);
        setGoogleLoading(false);
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      let errorMessage = "Failed to sign in with Google.";
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
      }
      message.error(errorMessage);
      setGoogleLoading(false);
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // 1. Set Firebase persistence to LOCAL (always remember login)
      await setPersistence(auth, browserLocalPersistence);

      // 2. Sign in with Firebase
      await signInWithEmailAndPassword(auth, values.email, values.password);

      // 3. Login to MongoDB backend
      try {
        const response = await authAPI.login({
          email: values.email,
          password: values.password,
        });

        if (response.success) {
          message.success("Login successful!");
          // Don't navigate here - let the useEffect handle it after UserContext updates
        } else {
          throw new Error(response.message || "Login failed");
        }
      } catch (backendError) {
        console.error("❌ Backend login failed:", backendError);
        // Sign out from Firebase if backend login fails
        await auth.signOut();
        throw backendError;
      }
    } catch (error) {
      console.error("Login error:", error);
      message.error(error.message || "Login failed!");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    if (tab === "signup") {
      navigate("/register");
    }
    // No need to navigate if already on login
  };

  const handleForgotPassword = () => {
    message.info("Forgot password functionality coming soon!");
  };

  // Show loading while checking authentication
  if (authLoading || !isReady) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p>Checking your session...</p>
      </div>
    );
  }

  // Don't render login form if already authenticated (prevents flash)
  if (isAuthenticated && !modalVisible) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p>Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="text-center mb-4">
          <div className="header">
            <div className="app-icon">
              <img src="/logo/LessonPlanning.webp" alt="App Icon" />
            </div>
            <h2 className="mt-3">Lesson Planner</h2>
          </div>

          <p className="text-muted">
            Welcome back! Sign in to continue planning your lessons.
          </p>
        </div>

        <div className="tabs-container mb-4">
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <button
                className="nav-link active"
                onClick={() => handleTabChange("login")}
              >
                Login
              </button>
            </li>
            <li className="nav-item">
              <button
                className="nav-link"
                onClick={() => handleTabChange("signup")}
              >
                Sign Up
              </button>
            </li>
          </ul>
        </div>

        <Form
          name="login_form"
          className="login-form"
          onFinish={onFinish}
        >
          <Form.Item
            name="email"
            rules={[{ required: true, message: "Please input your email!" }]}
          >
            <Input
              prefix={<UserOutlined className="site-form-item-icon" />}
              placeholder="Email"
              size="large"
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password
              prefix={<LockOutlined className="site-form-item-icon" />}
              placeholder="Password"
              size="large"
            />
          </Form.Item>
          <Form.Item>
            <div className="d-flex justify-content-end align-items-center">
              <button
                type="button"
                className="login-form-forgot"
                onClick={handleForgotPassword}
                style={{
                  background: "none",
                  border: "none",
                  color: "#1890ff",
                  cursor: "pointer",
                  textDecoration: "underline",
                  padding: 0,
                }}
              >
                Forgot your password?
              </button>
            </div>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="login-form-button mb-3"
              block
              size="large"
              loading={loading}
            >
              Sign In
            </Button>
            <Button
              icon={<GoogleOutlined />}
              className="google-button"
              block
              size="large"
              onClick={handleGoogleSignIn}
              loading={googleLoading}
            >
              Sign in with Google
            </Button>
          </Form.Item>
        </Form>
      </div>

      {/* Modal for Google Sign-in Additional Info (now requires token for new teachers) */}
      <Modal
        title="Complete Your Teacher Profile"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setPendingGoogleUser(null);
        }}
        footer={null}
        width={600}
        destroyOnClose
      >
        <p className="text-muted mb-4">
          Please provide some additional information and your school's
          registration token to complete your teacher registration.
        </p>
        <Form form={form} layout="vertical" onFinish={handleModalSubmit}>
          <Form.Item
            name="name"
            label="Full Name"
            rules={[
              { required: true, message: "Please input your full name!" },
            ]}
          >
            <Input
              prefix={<UserOutlined className="site-form-item-icon" />}
              placeholder="Full Name"
              size="large"
            />
          </Form.Item>

          {/* NEW: Registration Token Input in Modal */}
          <Form.Item
            name="registrationToken"
            label="School Registration Token"
            rules={[
              {
                required: true,
                message: "Please enter the registration token from your admin!",
              },
            ]}
            tooltip="Your school administrator will provide this token."
          >
            <Input
              prefix={<BarcodeOutlined className="site-form-item-icon" />}
              placeholder="Enter Registration Token"
              size="large"
            />
          </Form.Item>

          {/* Gemini API Key Input */}
          <GeminiApiKeyInput
            required={false}
            showInstructions={true}
            formItemProps={{
              label: "Gemini API Key (Optional)",
              extra: "You can add this later in your profile settings",
            }}
          />

          <Form.Item className="mb-0">
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={modalLoading}
            >
              Complete Registration
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LoginPage;