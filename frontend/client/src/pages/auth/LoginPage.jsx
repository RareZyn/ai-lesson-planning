// src/pages/auth/LoginPage.jsx
import React, { useState, useEffect } from "react";
import { Form, Input, Button, message, Modal, Select } from "antd";
import {
  UserOutlined,
  LockOutlined,
  GoogleOutlined,
  BarcodeOutlined,
  BankOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import {
  auth,
  signInWithEmailAndPassword,
  signInWithPopup,
  googleProvider,
  setPersistence,
  browserLocalPersistence,
  sendPasswordResetEmail,
} from "../../firebase";
import { authAPI } from "../../services/api";
import { useUser } from "../../context/UserContext";
import GeminiApiKeyInput from "../../components/Modal/RegisterAPIKey/GeminiApiKeyInput";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import "./LoginPage.css";

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [forgotPasswordModalVisible, setForgotPasswordModalVisible] = useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [pendingGoogleUser, setPendingGoogleUser] = useState(null);
  const [modalRegistrationMode, setModalRegistrationMode] = useState("teacher");
  const [hasNavigated, setHasNavigated] = useState(false);
  const [form] = Form.useForm();
  const [forgotPasswordForm] = Form.useForm();
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

  // Handle modal submit for Google sign-in (supports both teacher and school modes)
  const handleModalSubmit = async (values) => {
    if (!pendingGoogleUser) return;

    setModalLoading(true);
    try {
      let response;

      if (modalRegistrationMode === "school") {
        // Register new school with Google (first user = admin)
        response = await authAPI.googleRegisterSchool({
          googleId: pendingGoogleUser.uid,
          email: pendingGoogleUser.email,
          name: values.name,
          schoolName: values.schoolName,
          schoolType: values.schoolType || "KSSM",
          avatar: pendingGoogleUser.photoURL || "",
          geminiApiKey: values.geminiApiKey || "",
        });
      } else {
        // Register as teacher with token
        response = await authAPI.googleAuthWithToken({
          googleId: pendingGoogleUser.uid,
          email: pendingGoogleUser.email,
          name: values.name,
          registrationToken: values.registrationToken,
          avatar: pendingGoogleUser.photoURL || "",
          geminiApiKey: values.geminiApiKey || "",
        });
      }

      if (response.success) {
        const successMsg = modalRegistrationMode === "school"
          ? "School registered with Google! You are now the admin."
          : "Google login successful!";
        message.success(successMsg);
        navigate(location.state?.from?.pathname || "/app/", {
          replace: true,
        });
        setModalVisible(false);
        setModalRegistrationMode("teacher");
      } else {
        throw new Error(response.message || "Registration failed");
      }
    } catch (error) {
      console.error("Error completing Google registration:", error);
      message.error(error.response?.data?.message || "Failed to complete registration");
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

  const handleForgotPassword = () => {
    setForgotPasswordModalVisible(true);
  };

  const handleForgotPasswordSubmit = async (values) => {
    setResetPasswordLoading(true);
    try {
      // Send password reset email using Firebase
      await sendPasswordResetEmail(auth, values.email);

      message.success(
        `Password reset email sent to ${values.email}. Please check your inbox and spam folder.`
      );

      // Close modal and reset form
      setForgotPasswordModalVisible(false);
      forgotPasswordForm.resetFields();
    } catch (error) {
      console.error("Password reset error:", error);

      let errorMessage = "Failed to send password reset email.";

      // Handle specific Firebase error codes
      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "No account found with this email address.";
          break;
        case "auth/invalid-email":
          errorMessage = "Invalid email address format.";
          break;
        case "auth/too-many-requests":
          errorMessage = "Too many requests. Please try again later.";
          break;
        default:
          errorMessage = error.message || errorMessage;
      }

      message.error(errorMessage);
    } finally {
      setResetPasswordLoading(false);
    }
  };

  // Show loading while checking authentication
  // Show loading while checking authentication
  if (authLoading || !isReady) {
    return <LoadingSpinner fullscreen tip="Checking your session..." />;
  }

  // Don't render login form if already authenticated (prevents flash)
  // Don't render login form if already authenticated (prevents flash)
  if (isAuthenticated && !modalVisible) {
    return <LoadingSpinner fullscreen tip="Redirecting to dashboard..." />;
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

            <div className="text-center mt-4">
              <span className="text-muted">Don't have an account? </span>
              <button
                type="button"
                className="btn btn-link p-0"
                onClick={() => navigate("/register")}
                style={{ textDecoration: "none", color: "#3b82f6", fontWeight: 600 }}
              >
                Sign Up
              </button>
            </div>
          </Form.Item>
        </Form>
      </div>

      {/* Modal for Google Sign-in Additional Info */}
      <Modal
        title={modalRegistrationMode === "school" ? "Register Your School" : "Complete Your Profile"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setPendingGoogleUser(null);
          setModalRegistrationMode("teacher");
        }}
        footer={null}
        width={600}
        destroyOnClose
      >
        <p className="text-muted mb-3">
          {modalRegistrationMode === "school"
            ? "Register your school and become the admin."
            : "Complete your profile using a registration token from your school admin."}
        </p>

        {/* Toggle between teacher/school modes - Tab Style */}
        <div className="tabs-container mb-4">
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <button
                className={`nav-link ${modalRegistrationMode === "teacher" ? "active" : ""}`}
                onClick={() => setModalRegistrationMode("teacher")}
              >
                Join Existing School
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${modalRegistrationMode === "school" ? "active" : ""}`}
                onClick={() => setModalRegistrationMode("school")}
              >
                Register New School
              </button>
            </li>
          </ul>
        </div>

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

          {/* Conditional: Token OR School Name */}
          {modalRegistrationMode === "teacher" ? (
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
          ) : (
            <>
              <Form.Item
                name="schoolName"
                label="School Name"
                rules={[
                  {
                    required: true,
                    message: "Please enter your school name!",
                  },
                ]}
              >
                <Input
                  prefix={<BankOutlined className="site-form-item-icon" />}
                  placeholder="Enter School Name"
                  size="large"
                />
              </Form.Item>
              <Form.Item
                name="schoolType"
                label="School Type"
                initialValue="KSSM"
              >
                <Select size="large">
                  <Select.Option value="KSSM">KSSM (Secondary)</Select.Option>
                  <Select.Option value="KSSR">KSSR (Primary)</Select.Option>
                </Select>
              </Form.Item>
            </>
          )}

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
              {modalRegistrationMode === "school" ? "Register School" : "Complete Registration"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Forgot Password Modal */}
      <Modal
        title="Reset Your Password"
        open={forgotPasswordModalVisible}
        onCancel={() => {
          setForgotPasswordModalVisible(false);
          forgotPasswordForm.resetFields();
        }}
        footer={null}
        width={500}
        destroyOnClose
      >
        <p className="text-muted mb-4">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        <Form
          form={forgotPasswordForm}
          layout="vertical"
          onFinish={handleForgotPasswordSubmit}
        >
          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: "Please enter your email address!" },
              { type: "email", message: "Please enter a valid email address!" },
            ]}
          >
            <Input
              prefix={<UserOutlined className="site-form-item-icon" />}
              placeholder="Enter your email"
              size="large"
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <div className="d-flex justify-content-end gap-2">
              <Button
                onClick={() => {
                  setForgotPasswordModalVisible(false);
                  forgotPasswordForm.resetFields();
                }}
                disabled={resetPasswordLoading}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={resetPasswordLoading}
              >
                Send Reset Link
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LoginPage;