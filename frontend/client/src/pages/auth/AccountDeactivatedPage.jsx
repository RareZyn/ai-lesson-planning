import React from "react";
import { Button, Result } from "antd";
import { StopOutlined, LogoutOutlined, MailOutlined } from "@ant-design/icons";
import { auth, signOut } from "../../firebase";
import { useNavigate } from "react-router-dom";
import "./AccountDeactivatedPage.css";

const AccountDeactivatedPage = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            localStorage.removeItem("authToken");
            navigate("/login");
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    return (
        <div className="deactivated-container">
            <div className="deactivated-card">
                <div className="deactivated-icon">
                    <StopOutlined />
                </div>
                <h1>Account Deactivated</h1>
                <p className="deactivated-message">
                    Your account has been <strong>deactivated</strong> by an administrator in your organization.
                </p>
                <p className="deactivated-submessage">
                    If you believe this is a mistake, please contact your school administrator to restore access.
                </p>

                <div className="deactivated-actions">
                    <Button
                        type="primary"
                        icon={<MailOutlined />}
                        size="large"
                        onClick={() => window.location.href = "mailto:admin@school.edu?subject=Account Reactivation Request"}
                    >
                        Contact Admin
                    </Button>
                    <Button
                        icon={<LogoutOutlined />}
                        size="large"
                        onClick={handleLogout}
                    >
                        Sign Out
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AccountDeactivatedPage;
