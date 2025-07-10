// src/components/GeminiApiKeyInput.jsx
import React, { useState } from "react";
import { Form, Input, Button, Alert, Collapse, Typography } from "antd";
import {
  KeyOutlined,
  InfoCircleOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import "./GeminiApiKeyInput.css";

const { Panel } = Collapse;
const { Text, Link, Title } = Typography;

const GeminiApiKeyInput = ({
  formItemProps = {},
  inputProps = {},
  showInstructions = true,
  required = false,
}) => {
  const [showKey, setShowKey] = useState(false);

  const instructions = (
    <div className="gemini-instructions">
      <Title level={5}>Get Your API Key from Google AI Studio</Title>
      <ol className="instruction-list">
        <li>
          Go to{" "}
          <Link href="https://aistudio.google.com/" target="_blank">
            https://aistudio.google.com/
          </Link>{" "}
          and sign in with your Google account.
        </li>
        <li>
          On the page, find and click the button to{" "}
          <Text strong>"Get API key"</Text> or{" "}
          <Text strong>"Create API Key."</Text>
        </li>
        <li>
          <Text strong>Copy the API key</Text> that appears. It's a long string
          of letters and numbers. Keep it safe!
        </li>
      </ol>
      <Alert
        message="Security Note"
        description="Your API key will be encrypted and stored securely. Never share your API key with others."
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        className="mt-3"
      />
    </div>
  );

  const defaultFormItemProps = {
    name: "geminiApiKey",
    label: (
      <span>
        <KeyOutlined /> Gemini API Key
      </span>
    ),
    rules: required
      ? [
          { required: true, message: "Please input your Gemini API key!" },
          { min: 20, message: "API key seems too short" },
        ]
      : [{ min: 20, message: "API key seems too short" }],
    ...formItemProps,
  };

  return (
    <>
      <Form.Item {...defaultFormItemProps}>
        <Input.Password
          prefix={<KeyOutlined className="site-form-item-icon" />}
          placeholder="Enter your Gemini API key"
          size="large"
          visibilityToggle={{
            visible: showKey,
            onVisibleChange: setShowKey,
          }}
          {...inputProps}
        />
      </Form.Item>

      {showInstructions && (
        <Collapse
          ghost
          expandIconPosition="end"
          className="gemini-instructions-collapse"
        >
          <Panel
            header={
              <span className="instruction-header">
                <InfoCircleOutlined /> How to get your Gemini API key?
              </span>
            }
            key="1"
          >
            {instructions}
          </Panel>
        </Collapse>
      )}
    </>
  );
};

export default GeminiApiKeyInput;
