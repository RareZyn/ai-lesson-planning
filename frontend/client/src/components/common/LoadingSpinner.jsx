import React from "react";
import "./LoadingSpinner.css";

/**
 * A reusable loading spinner component using custom CSS animations.
 *
 * @param {Object} props
 * @param {string} [props.tip="Loading..."] - Text to display below the spinner
 * @param {boolean} [props.fullscreen=false] - Whether to show the spinner as a full-screen overlay
 * @param {string} [props.size="large"] - Size helper (mapped to CSS scale if needed, or ignored for now)
 */
const LoadingSpinner = ({ tip = "Loading...", fullscreen = false, size = "large" }) => {

    const spinnerStyle = size === "small" ? { transform: "scale(0.5)", width: "30px", height: "30px" } : {};
    const containerStyle = size === "small" ? { minHeight: "unset", width: "auto" } : { minHeight: "200px" };

    const content = (
        <div className="spinner-container" style={size === "small" ? { flexDirection: 'row', gap: '8px' } : {}}>
            <div className="modern-spinner" style={spinnerStyle}>
                <div className="dot-center"></div>
            </div>
            {tip && <div className="spinner-tip" style={size === "small" ? { marginTop: 0, fontSize: '12px' } : {}}>{tip}</div>}
        </div>
    );

    if (fullscreen) {
        return (
            <div className="spinner-overlay">
                {content}
            </div>
        );
    }

    return (
        <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            height: "100%",
            ...containerStyle
        }}>
            {content}
        </div>
    );
};

export default LoadingSpinner;
