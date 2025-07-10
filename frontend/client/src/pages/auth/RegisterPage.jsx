// src/pages/auth/RegisterPage.jsx
import React, { useState } from "react";
import { Form, Input, Button, message } from "antd";
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  BankOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  auth,
  createUserWithEmailAndPassword,
  updateProfile,
} from "../../firebase";
import { authAPI } from "../../services/api";
import GeminiApiKeyInput from "../../components/Modal/RegisterAPIKey/GeminiApiKeyInput";
import "bootstrap/dist/css/bootstrap.min.css";
import "./LoginPage.css";

const RegisterPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

      // 3. Register user in MongoDB backend
      try {
        const response = await authAPI.register({
          name: values.name,
          email: values.email,
          password: values.password,
          schoolName: values.schoolName,
          firebaseUid: userCredential.user.uid,
          geminiApiKey: values.geminiApiKey || "",
        });

        if (response.success) {
          console.log("✅ User registered successfully");
          message.success("Registration successful!");
          navigate("/app/", { replace: true });
        } else {
          throw new Error(response.message || "Registration failed");
        }
      } catch (backendError) {
        console.error("❌ Backend registration failed:", backendError);
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
      message.error(error.message || "Registration failed!");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    if (tab === "signup") {
      navigate("/register");
    } else if (tab === "login") {
      navigate("/");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box" style={{ maxWidth: 500 }}>
        <div className="text-center mb-4">
          <div className="header">
            <div className="app-icon">
              <img src="./logo/LessonPlanning.png" alt="App Icon" />
            </div>
            <h2 className="mt-3">Lesson Planner</h2>
          </div>

          <p className="text-muted">
            Create your account to start planning your lessons.
          </p>
        </div>

        <div className="tabs-container mb-4">
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <button
                className="nav-link"
                onClick={() => handleTabChange("login")}
              >
                Login
              </button>
            </li>
            <li className="nav-item">
              <button className="nav-link active">Sign Up</button>
            </li>
          </ul>
        </div>

        <Form
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

          <Form.Item
            name="schoolName"
            rules={[
              { required: true, message: "Please input your school name!" },
            ]}
          >
            <Input
              prefix={<BankOutlined className="site-form-item-icon" />}
              placeholder="School Name"
              size="large"
            />
          </Form.Item>

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
              Sign Up
            </Button>

            <div className="text-center">
              <span className="text-muted">Already have an account? </span>
              <button
                type="button"
                className="btn btn-link p-0"
                onClick={() => navigate("/")}
                style={{ textDecoration: "none", color: "#1890ff" }}
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
