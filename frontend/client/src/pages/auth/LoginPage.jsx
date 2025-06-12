// src/pages/auth/LoginPage.jsx
import React, { useState } from "react";
import { Form, Input, Button, Checkbox, message, Modal } from "antd";
import {
  UserOutlined,
  LockOutlined,
  GoogleOutlined,
  BankOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import {
  auth,
  signInWithEmailAndPassword,
  signInWithPopup,
  googleProvider,
} from "../../firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import { authAPI } from "../../services/api";
import "./LoginPage.css";

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [pendingGoogleUser, setPendingGoogleUser] = useState(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();

  const handleModalSubmit = async (values) => {
    if (!pendingGoogleUser) return;

    setModalLoading(true);
    try {
      // 1. Create user document in Firestore
      const userRef = doc(db, "users", pendingGoogleUser.uid);
      await setDoc(userRef, {
        email: pendingGoogleUser.email,
        name: values.name,
        schoolName: values.schoolName,
        createdAt: serverTimestamp(),
        roles: ["teacher"],
        lastLogin: serverTimestamp(),
      });

      // 2. Register user in MongoDB backend via Google OAuth
      try {
        await authAPI.googleAuth({
          googleId: pendingGoogleUser.uid,
          email: pendingGoogleUser.email,
          name: values.name,
          schoolName: values.schoolName,
          avatar: pendingGoogleUser.photoURL || "",
        });
        console.log("✅ Google user registered in MongoDB backend");
      } catch (backendError) {
        console.error("⚠️ Backend Google auth failed:", backendError);
        message.warning("Account created but some features may be limited");
      }

      message.success("Google login successful!");
      navigate(location.state?.from?.pathname || "/app/", {
        replace: true,
      });
      setModalVisible(false);
    } catch (error) {
      console.error("Error creating user document:", error);
      message.error("Failed to complete registration");
    } finally {
      setModalLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user document exists in Firestore
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        // New user - show modal to collect additional info. This flow works correctly.
        setPendingGoogleUser(user);
        form.setFieldsValue({
          name: user.displayName || "",
        });
        setModalVisible(true);
      } else {
        // --- THIS IS THE CORRECTED LOGIC ---
        // Existing Firestore user - ensure backend is synced.
        
        // Get the data from the Firestore document
        const firestoreData = userDoc.data();

        // Call the backend with ALL necessary data, including schoolName from Firestore.
        await authAPI.googleAuth({
          googleId: user.uid,
          email: user.email,
          name: user.displayName || firestoreData.name, // Prefer live display name, fallback to stored name
          schoolName: firestoreData.schoolName, // **THE FIX IS HERE**
          avatar: user.photoURL || "",
        });

        console.log("✅ Existing Google user synced with MongoDB backend");
        
        message.success("Google login successful!");
        navigate(location.state?.from?.pathname || "/app/", {
          replace: true,
        });
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      let errorMessage = "Failed to sign in with Google.";
      if(error.response) {
        // Use the specific error message from the backend if available
        errorMessage = error.response.data.message || errorMessage;
      }
      message.error(errorMessage);
    } finally {
      setGoogleLoading(false);
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // 1. Sign in with Firebase
      await signInWithEmailAndPassword(auth, values.email, values.password);

      // 2. Try to login to backend as well
      try {
        await authAPI.login({
          email: values.email,
          password: values.password,
        });
        console.log("✅ User logged in to MongoDB backend");
      } catch (backendError) {
        console.error("⚠️ Backend login failed:", backendError);
        // Don't prevent Firebase login if backend fails
        message.warning("Logged in but some features may be limited");
      }

      message.success("Login successful!");
      navigate(location.state?.from?.pathname || "/app/", {
        replace: true,
      });
    } catch (error) {
      message.error(error.message);
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
          initialValues={{ remember: true }}
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
            <div className="d-flex justify-content-between align-items-center">
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>Remember me</Checkbox>
              </Form.Item>
              <a
                className="login-form-forgot"
                href="#"
                onClick={(e) => {
                  e.preventDefault(); /* Add forgot password logic */
                }}
              >
                Forgot your password?
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

      {/* Modal for Google Sign-in Additional Info */}
      <Modal
        title="Complete Your Profile"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setPendingGoogleUser(null);
        }}
        footer={null}
        destroyOnClose
      >
        <p className="text-muted mb-4">
          Please provide some additional information to complete your
          registration.
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

          <Form.Item
            name="schoolName"
            label="School Name"
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
