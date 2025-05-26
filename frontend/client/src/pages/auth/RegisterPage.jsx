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
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
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
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );

      // Update the user's display name
      await updateProfile(userCredential.user, {
        displayName: values.name,
      });

      // Create user document in Firestore
      const userRef = doc(db, "users", userCredential.user.uid);
      await setDoc(userRef, {
        email: values.email,
        name: values.name,
        schoolName: values.schoolName,
        createdAt: serverTimestamp(),
        roles: ["teacher"],
        lastLogin: serverTimestamp(),
      });

      message.success("Registration successful!");
      navigate("/app/", { replace: true });
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
      <div className="login-box">
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

        <Form name="register_form" className="login-form" onFinish={onFinish}>
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
