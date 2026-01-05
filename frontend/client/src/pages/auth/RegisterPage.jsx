// src/pages/auth/RegisterPage.jsx
import React, { useState, useEffect } from "react";
import { Form, Input, Button, message, Select } from "antd";
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  BarcodeOutlined,
  BankOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  auth,
  createUserWithEmailAndPassword,
  updateProfile,
} from "../../firebase";
import { authAPI } from "../../services/api";
import { useUser } from "../../context/UserContext";
import GeminiApiKeyInput from "../../components/Modal/RegisterAPIKey/GeminiApiKeyInput";
import "bootstrap/dist/css/bootstrap.min.css";
import "./LoginPage.css";

const RegisterPage = () => {
  const [loading, setLoading] = useState(false);
  const [registrationMode, setRegistrationMode] = useState("teacher"); // "teacher" or "school"
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useUser();

  const [form] = Form.useForm();

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/app", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Prefill token from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      form.setFieldsValue({ registrationToken: token });
      setRegistrationMode("teacher");
      message.info("Registration token applied from link!");
    }
  }, [form]);

  const onFinish = async (values) => {
    if (values.password !== values.confirmPassword) {
      message.error("Passwords do not match!");
      return;
    }

    setLoading(true);
    try {
      // 1. Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );

      // 2. Update Firebase user profile
      await updateProfile(userCredential.user, {
        displayName: values.name,
      });

      // 3. Register in MongoDB based on mode
      try {
        let response;

        if (registrationMode === "school") {
          // Register new school (first user = admin)
          response = await authAPI.registerSchool({
            name: values.name,
            email: values.email,
            password: values.password,
            schoolName: values.schoolName,
            schoolType: values.schoolType || "KSSM",
            firebaseUid: userCredential.user.uid,
            geminiApiKey: values.geminiApiKey || "",
          });
        } else {
          // Register as teacher with token
          response = await authAPI.registerTeacherWithToken({
            name: values.name,
            email: values.email,
            password: values.password,
            registrationToken: values.registrationToken,
            firebaseUid: userCredential.user.uid,
            geminiApiKey: values.geminiApiKey || "",
          });
        }

        if (response.success) {
          const successMsg = registrationMode === "school"
            ? "School registered! You are now the admin."
            : "Registration successful! Welcome to your school.";
          message.success(successMsg);
          navigate("/app/", { replace: true });
        } else {
          throw new Error(response.message || "Registration failed");
        }
      } catch (backendError) {
        console.error("Backend registration failed:", backendError);
        // Delete Firebase user if MongoDB registration fails
        try {
          await userCredential.user.delete();
        } catch (deleteError) {
          console.error("Failed to cleanup Firebase user:", deleteError);
        }
        throw backendError;
      }
    } catch (error) {
      console.error("Registration error:", error);
      message.error(error.response?.data?.message || error.message || "Registration failed!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box" style={{ maxWidth: 520 }}>
        <div className="text-center mb-4">
          <div className="header">
            <div className="app-icon">
              <img src="/logo/LessonPlanning.webp" alt="App Icon" />
            </div>
            <h2 className="mt-3">Lesson Planner</h2>
          </div>

          <p className="text-muted">
            {registrationMode === "school"
              ? "Register your school and become the admin."
              : "Create your teacher account using a token from your school admin."}
          </p>
        </div>

        {/* Registration Mode Toggle - Tab Style */}
        <div className="tabs-container mb-4">
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <button
                className={`nav-link ${registrationMode === "teacher" ? "active" : ""}`}
                onClick={() => setRegistrationMode("teacher")}
              >
                Join Existing School
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${registrationMode === "school" ? "active" : ""}`}
                onClick={() => setRegistrationMode("school")}
              >
                Register New School
              </button>
            </li>
          </ul>
        </div>

        <Form
          form={form}
          name="register_form"
          className="login-form"
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            name="name"
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

          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Please input your email!" },
              { type: "email", message: "Please enter a valid email!" },
            ]}
          >
            <Input
              prefix={<MailOutlined className="site-form-item-icon" />}
              placeholder="Email"
              size="large"
            />
          </Form.Item>

          {/* Conditional: Token OR School Name */}
          {registrationMode === "teacher" ? (
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

          <Form.Item
            name="password"
            rules={[
              { required: true, message: "Please input your password!" },
              { min: 6, message: "Password must be at least 6 characters!" },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="site-form-item-icon" />}
              placeholder="Password"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            rules={[
              { required: true, message: "Please confirm your password!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match!"));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="site-form-item-icon" />}
              placeholder="Confirm Password"
              size="large"
            />
          </Form.Item>

          {/* Gemini API Key Input */}
          <GeminiApiKeyInput required={false} showInstructions={true} />

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="login-form-button mb-3"
              block
              size="large"
              loading={loading}
            >
              {registrationMode === "school" ? "Register School" : "Sign Up"}
            </Button>

            <div className="text-center">
              <span className="text-muted">Already have an account? </span>
              <button
                type="button"
                className="btn btn-link p-0"
                onClick={() => navigate("/")}
                style={{ textDecoration: "none", color: "#3b82f6", fontWeight: 600 }}
              >
                Sign In
              </button>
            </div>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default RegisterPage;