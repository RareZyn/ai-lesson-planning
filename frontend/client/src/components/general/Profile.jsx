// src/components/general/Profile.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, EmailAuthProvider, linkWithCredential } from "../../firebase";
import { signOut } from "firebase/auth";
import {
  Avatar,
  Button,
  Dropdown,
  Form,
  Input,
  Modal,
  message,
} from "antd";
import {
  KeyOutlined,
  LogoutOutlined,
  SettingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import "./Profile.css";
import { useUser } from "../../context/UserContext";
import { useAuth } from "../../context/AuthContext";

const Profile = ({ avatarSize = 36 }) => {
  const navigate = useNavigate();

  // Use your context providers instead of direct Firebase auth
  const { currentUser: contextUser, logout: contextLogout } = useUser();
  const { currentUser: firebaseUser } = useAuth();

  // Use whichever user data is available
  // Use whichever user data is available
  const user = contextUser || firebaseUser;

  // Debug logging
  useEffect(() => {
  }, [contextUser, firebaseUser, user]);

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [passwordForm] = Form.useForm();

  const handlePasswordModalOpen = async () => {
    // Check if user has a password
    // If user has googleId or firebaseUid, they might not have a password
    // We'll assume Google/Firebase users don't have a password unless they've set one
    const userHasGoogleAuth = user.googleId || user.firebaseUid;

    // For simplicity, we'll check: if they have Google auth, assume no password initially
    // The backend will handle the actual validation
    setHasPassword(!userHasGoogleAuth);
    setIsPasswordModalOpen(true);
  };

  const handlePasswordModalClose = () => {
    setIsPasswordModalOpen(false);
    passwordForm.resetFields();
  };

  const handlePasswordSubmit = async (values) => {
    try {
      setIsChangingPassword(true);

      const requestBody = {
        newPassword: values.newPassword,
      };

      // Only include current password if user already has a password
      if (hasPassword && values.currentPassword) {
        requestBody.currentPassword = values.currentPassword;
      }

      // Step 1: Update password in MongoDB
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/auth/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to change password");
      }

      // Step 2: If this is a Google user setting password for the first time,
      // link email/password credential to Firebase
      if (!hasPassword) {
        try {
          // Get the current Firebase user directly from auth
          const currentFirebaseUser = auth.currentUser;

          if (!currentFirebaseUser) {
            console.error("No Firebase user found");
            message.warning(
              "Password set in database, but you're not signed in to Firebase. Please use Google sign-in."
            );
          } else {
            console.log("Linking credential for user:", currentFirebaseUser.email);
            console.log("User providers:", currentFirebaseUser.providerData);

            const credential = EmailAuthProvider.credential(
              currentFirebaseUser.email,
              values.newPassword
            );

            await linkWithCredential(currentFirebaseUser, credential);
            console.log("✅ Email/password credential linked to Firebase account successfully");
            message.success("Password set successfully! You can now login with email and password.");
          }
        } catch (firebaseError) {
          console.error("❌ Firebase credential linking error:", firebaseError);
          console.error("Error code:", firebaseError.code);
          console.error("Error message:", firebaseError.message);

          // Handle specific Firebase errors
          if (firebaseError.code === 'auth/provider-already-linked') {
            console.log("Email provider already linked");
            message.success("Password updated successfully!");
          } else if (firebaseError.code === 'auth/email-already-in-use') {
            message.warning(
              "This email is already in use. Password saved to database but couldn't link to Firebase."
            );
          } else if (firebaseError.code === 'auth/requires-recent-login') {
            message.warning(
              "For security, please sign out and sign in again before setting a password."
            );
          } else {
            message.warning(
              "Password set in database, but Firebase linking failed. Error: " + firebaseError.code
            );
          }
        }
      } else {
        message.success(data.message || "Password updated successfully!");
      }

      handlePasswordModalClose();
      setHasPassword(true); // User now has a password
    } catch (error) {
      console.error("Change password error:", error);
      message.error(error.message || "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };



  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent multiple logout attempts

    try {
      setIsLoggingOut(true);

      // Call both Firebase and context logout
      await Promise.all([
        signOut(auth), // Firebase logout
        contextLogout(), // Context logout (which also calls backend)
      ]);

      // Clear any remaining local storage
      localStorage.removeItem("authToken");

      // Navigate to login page immediately
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      // Even if there's an error, try to navigate to login
      navigate("/", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };



  // Don't render if no user or if logging out
  if (!user || isLoggingOut) return null;

  // Get user display data with fallbacks
  const displayName = user.name || user.displayName || user.email || "User";
  const photoURL = user.avatar || user.photoURL;
  const email = user.email;

  // Profile Menu Items
  const profileItems = [
    {
      key: "info",
      label: (
        <div className="profile-menu-header">
          <Avatar src={photoURL} size={40} icon={<UserOutlined />}>
            {!photoURL && displayName.charAt(0).toUpperCase()}
          </Avatar>
          <div className="profile-menu-user-info">
            <div className="profile-menu-name">{displayName}</div>
            <div className="profile-menu-email">{email}</div>
          </div>
        </div>
      ),
    },
    { type: "divider" },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Settings",
      onClick: () => navigate("/app/profile"),
    },
    {
      key: "password",
      icon: <KeyOutlined />,
      label: "Change Password",
      onClick: handlePasswordModalOpen,
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: isLoggingOut ? "Signing out..." : "Sign Out",
      onClick: handleLogout,
      disabled: isLoggingOut,
      danger: true,
    },
  ];

  return (
    <div className="profile-container" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>


      {/* Profile Dropdown */}
      <Dropdown
        menu={{ items: profileItems }}
        trigger={["click"]}
        placement="bottomRight"
      >
        <div className="profile-avatar" style={{ cursor: 'pointer' }}>
          <Avatar src={photoURL} size={avatarSize} icon={<UserOutlined />}>
            {!photoURL && displayName.charAt(0).toUpperCase()}
          </Avatar>
        </div>
      </Dropdown>

      {/* Settings Modal - Removed in favor of ProfilePage */}

      {/* Change Password Modal */}
      <Modal
        title={hasPassword ? "Change Password" : "Set Password"}
        open={isPasswordModalOpen}
        onCancel={handlePasswordModalClose}
        footer={null}
        width={500}
        className="password-modal"
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordSubmit}
          autoComplete="off"
        >
          {hasPassword && (
            <Form.Item
              label="Current Password"
              name="currentPassword"
              rules={[
                { required: true, message: "Please enter your current password" },
              ]}
            >
              <Input.Password
                placeholder="Enter your current password"
                size="large"
                autoComplete="current-password"
              />
            </Form.Item>
          )}

          {!hasPassword && (
            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: '4px' }}>
              <p style={{ margin: 0, color: '#0050b3' }}>
                You signed in with Google and don't have a password yet.
                Set a password to enable email/password login.
              </p>
            </div>
          )}

          <Form.Item
            label="New Password"
            name="newPassword"
            rules={[
              { required: true, message: "Please enter a new password" },
              { min: 6, message: "Password must be at least 6 characters long" },
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                message: "Password must contain at least one uppercase letter, one lowercase letter, and one number",
              },
            ]}
          >
            <Input.Password
              placeholder="Enter new password"
              size="large"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item
            label="Confirm New Password"
            name="confirmPassword"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "Please confirm your new password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match"));
                },
              }),
            ]}
          >
            <Input.Password
              placeholder="Confirm new password"
              size="large"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <div className="d-flex justify-content-end gap-2">
              <Button onClick={handlePasswordModalClose} disabled={isChangingPassword}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isChangingPassword}
              >
                {hasPassword ? "Change Password" : "Set Password"}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Profile;
