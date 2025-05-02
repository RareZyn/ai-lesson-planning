import React, { useState } from "react";
import { Form, Input, Button, Checkbox } from "antd";
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  BankOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./RegisterPage.css";

const RegisterPage = () => {
  const [activeTab, setActiveTab] = useState("signup");
  const navigate = useNavigate();

  const handleTabChange = (tab) => {
    if (tab === "login") {
      navigate("/");
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <div className="header-container mb-4">
          <div className="app-icon">
            <img src="/logo.png" alt="App Icon" />
          </div>
          <div className="title-container">
            <h2 className="app-title">Lesson Planner</h2>
          </div>
          <div>
            <p className="text-muted description">
              Create, organize, and manage your lessons with ease, all in one
              place.
            </p>
          </div>
        </div>

        <div className="tabs-container mb-4">
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "login" ? "active" : ""}`}
                onClick={() => handleTabChange("login")}
              >
                Login
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "signup" ? "active" : ""}`}
                onClick={() => handleTabChange("signup")}
              >
                Sign Up
              </button>
            </li>
          </ul>
        </div>

        <Form
          name="register_form"
          className="register-form"
          initialValues={{ remember: true }}
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

          <Form.Item name="schoolLevel" className="school-level-checkboxes">
            <div className="d-flex">
              <div className="me-4">
                <Checkbox>Middle School</Checkbox>
              </div>
              <div>
                <Checkbox>High School</Checkbox>
              </div>
            </div>
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

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="register-form-button"
              block
              size="large"
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
