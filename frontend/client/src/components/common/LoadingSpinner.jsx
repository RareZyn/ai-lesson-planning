import React from "react";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

/**
 * A reusable loading spinner component using Ant Design.
 *
 * @param {Object} props
 * @param {string} [props.tip="Loading..."] - Text to display below the spinner
 * @param {boolean} [props.fullscreen=false] - Whether to show the spinner as a full-screen overlay
 * @param {string} [props.size="large"] - Size of the spinner ("small", "default", "large")
 */
const LoadingSpinner = ({ tip = "Loading...", fullscreen = false, size = "large" }) => {
    const antIcon = <LoadingOutlined style={{ fontSize: 40 }} spin />;

    if (fullscreen) {
        return (
            <div
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100vw",
                    height: "100vh",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                    zIndex: 9999,
                }}
            >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <Spin indicator={antIcon} size={size} />
                    {tip && <div style={{ marginTop: 15, fontSize: "18px", color: "#1890ff", fontWeight: "600" }}>{tip}</div>}
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "40px",
                height: "100%",
                width: "100%",
            }}
        >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Spin indicator={antIcon} size={size} />
                {tip && <div style={{ marginTop: 10, fontSize: "16px", color: "#1890ff", fontWeight: "600" }}>{tip}</div>}
            </div>
        </div>
    );
};

export default LoadingSpinner;
