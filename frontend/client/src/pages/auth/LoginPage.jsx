// src/pages/auth/LoginPage.jsx
import React, { useState } from "react";
import { Form, Input, Button, Checkbox, message } from "antd";
import { UserOutlined, LockOutlined, GoogleOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { auth, signInWithEmailAndPassword, signInWithPopup, googleProvider } from '../../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from '../../firebase';
import "bootstrap/dist/css/bootstrap.min.css";
import "./LoginPage.css";

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);

      // Ensure user document exists
      const userRef = doc(db, "users", result.user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        await setDoc(userRef, {
          email: result.user.email,
          name: result.user.displayName || '',
          createdAt: serverTimestamp(),
          roles: ['teacher'],
          lastLogin: serverTimestamp()
        });
      }

      message.success("Google login successful!");
      navigate(location.state?.from?.pathname || "/app/home", { replace: true });
    } catch (error) {
      console.error("Google sign-in error:", error);
      message.error(error.message || "Failed to sign in with Google");
    } finally {
      setGoogleLoading(false);
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      message.success("Login successful!");
      navigate(location.state?.from?.pathname || "/app/home", { replace: true });
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };


  const handleTabChange = (tab) => {
    if (tab === "signup") {
      navigate("/register");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="text-center mb-4">
          <div className="header">
            <div className="app-icon">
              <img src="./logo/logo.png" alt="App Icon" />
            </div>
            <h2 className="mt-3">Lesson Planner</h2>
          </div>

          <p className="text-muted">
            Create, organize, and manage your lessons with ease, all in one
            place.
          </p>
        </div>

        <div className="tabs-container mb-4">
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <button
                className={`nav-link active`}
                onClick={() => handleTabChange("login")}
              >
                Login
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link`}
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
          initialValues={{ remember: true }}
          onFinish={onFinish}
        >
          <Form.Item
            name="email"
            rules={[{ required: true, message: "Please input your email!" }]}
          >
            <Input
              prefix={<UserOutlined className="site-form-item-icon" />}
              placeholder="email"
              size="large"
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password
              prefix={<LockOutlined className="site-form-item-icon" />}
              placeholder="password"
              size="large"
            />
          </Form.Item>
          <Form.Item>
            <div className="d-flex justify-content-between align-items-center">
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>Remember me</Checkbox>
              </Form.Item>
              <a className="login-form-forgot" href="#">
                Forgot your password
              </a>
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
    </div>
  );
};

export default LoginPage;