// src/pages/auth/RegisterPage.jsx
import React, { useState } from "react";
import { Form, Input, Button, Radio, message } from "antd";
import { UserOutlined, MailOutlined, LockOutlined, BankOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  auth,
  createUserWithEmailAndPassword,
  db,
  doc,
  setDoc,
  serverTimestamp
} from '../../firebase';
import "bootstrap/dist/css/bootstrap.min.css";
import "./LoginPage.css";

const RegisterPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );

      await setDoc(doc(db, "users", userCredential.user.uid), {
        name: values.name,
        email: values.email,
        schoolType: values.schoolType,
        schoolName: values.schoolName,
        roles: ["teacher"], // Default role
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      message.success("Registration successful!");
      navigate("/app");
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    if (tab === "login") {
      navigate("/login");
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
                className={`nav-link`}
                onClick={() => handleTabChange("login")}
              >
                Login
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link active`}
                onClick={() => handleTabChange("signup")}
              >
                Sign Up
              </button>
            </li>
          </ul>
        </div>

        <Form
          name="register_form"
          className="login-form"
          onFinish={onFinish}
        >
          <Form.Item
            name="name"
            rules={[{ required: true, message: "Please input your name!" }]}
          >
            <Input
              prefix={<UserOutlined className="site-form-item-icon" />}
              placeholder="Name"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[{ required: true, message: "Please input your email!" }]}
          >
            <Input
              prefix={<MailOutlined className="site-form-item-icon" />}
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

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your password!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('The two passwords do not match!'));
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
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default RegisterPage;