// src/pages/auth/LoginPage.jsx
import React, { useState } from "react";
import { Form, Input, Button, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useNavigate, Link } from "react-router-dom";
import { auth, signInWithEmailAndPassword } from "../../firebase";
import "bootstrap/dist/css/bootstrap.min.css";
import "./LoginPage.css";

const RegisterPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      message.success("Login successful!");
      navigate("/app");
    } catch (error) {
      message.error("Invalid email or password.");
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
      <div className="login-box">
        <div className="text-center mb-4">
          <div className="header">
            <div className="app-icon">
              <img src="./logo/LessonPlanning.png" alt="App Icon" />
            </div>
            <h2 className="mt-3">Lesson Planner</h2>
          </div>

          <p className="text-muted">
            Welcome back! Login to continue planning your lessons.
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

        <Form name="login_form" className="login-form" onFinish={onFinish}>
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
            <Button
              type="primary"
              htmlType="submit"
              className="login-form-button mb-3"
              block
              size="large"
              loading={loading}
            >
              Log In
            </Button>

            {/* ✅ This line is the fixed version */}
            <div className="text-center">
              <Link to="/forgot-password" className="text-muted">
                Forgot Password?
              </Link>
            </div>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default RegisterPage;
