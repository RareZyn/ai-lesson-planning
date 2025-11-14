// src/pages/auth/AuthPage.jsx
import React, { useState } from "react";
import { Form, Input, Button, Checkbox, message } from "antd";
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  GoogleOutlined,
  BarcodeOutlined,
} from "@ant-design/icons";
import "./AuthPage.css";

const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = (values) => {
    message.success(`Welcome back, ${values.email}`);
  };

  const handleRegister = (values) => {
    message.success(`Account created for ${values.email}`);
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
  };

  return (
    <div className={`auth-container ${isSignUp ? "right-panel-active" : ""}`}>
      {/* --- LEFT PANEL (Login) --- */}
      <div className="auth-form-container sign-in-container">
        <Form
          name="login_form"
          className="auth-form"
          onFinish={handleLogin}
          layout="vertical"
        >
          <h1>Welcome Back</h1>
          <p>Please sign in to continue</p>

          <Form.Item
            name="email"
            rules={[{ required: true, message: "Please input your email!" }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Email"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
              size="large"
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={loading}
          >
            Sign In
          </Button>

          <div className="separator">or</div>

          <Button
            icon={<GoogleOutlined />}
            block
            size="large"
            className="google-btn"
          >
            Sign in with Google
          </Button>

          <p className="switch-text">
            Don’t have an account?{" "}
            <button onClick={toggleAuthMode} className="switch-btn">
              Sign Up
            </button>
          </p>
        </Form>
      </div>

      {/* --- RIGHT PANEL (Sign Up) --- */}
      <div className="auth-form-container sign-up-container">
        <Form
          name="register_form"
          className="auth-form"
          onFinish={handleRegister}
          layout="vertical"
        >
          <h1>Create Account</h1>
          <p>Join your school workspace</p>

          <Form.Item
            name="name"
            rules={[{ required: true, message: "Please input your full name!" }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Full Name" size="large" />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Please input your email!" },
              { type: "email", message: "Enter a valid email!" },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" size="large" />
          </Form.Item>

          <Form.Item
            name="registrationToken"
            rules={[
              { required: true, message: "Enter registration token from admin!" },
            ]}
          >
            <Input
              prefix={<BarcodeOutlined />}
              placeholder="School Registration Token"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
              size="large"
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={loading}
          >
            Sign Up
          </Button>

          <p className="switch-text">
            Already have an account?{" "}
            <button onClick={toggleAuthMode} className="switch-btn">
              Sign In
            </button>
          </p>
        </Form>
      </div>

      {/* --- RIGHT SIDE DESIGN PANEL --- */}
      <div className="auth-overlay">
        <div className="overlay-panel overlay-left">
          <h1>Welcome Back!</h1>
          <p>To keep connected, please sign in with your account</p>
          <button className="ghost-btn" onClick={toggleAuthMode}>
            Sign In
          </button>
        </div>
        <div className="overlay-panel overlay-right">
          <h1>Hello, Teacher!</h1>
          <p>Enter your details and start planning smarter lessons</p>
          <button className="ghost-btn" onClick={toggleAuthMode}>
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
