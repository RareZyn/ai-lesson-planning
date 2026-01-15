import React, { useState } from "react";
import styles from "./MultiStepPlanner.module.css";
import { Button, Input, Popover, Space } from "antd";
import { ExperimentOutlined, SendOutlined } from "@ant-design/icons";

const { TextArea } = Input;

const EditableSection = ({
  label,
  id,
  value,
  onChange,
  onEnhance,
  rows,
  isLoading
}) => {
  const [prompt, setPrompt] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleEnhanceSubmit = () => {
    if (prompt.trim()) {
      onEnhance(prompt);
      // setIsPopoverOpen(false); // Optional: keep open to show loading or close immediately
      setPrompt("");
    }
  };

  const enhanceContent = (
    // Responsive width: 300px on desktop, but max 75vw of container to prevent left overflow
    <div style={{ width: 'min(300px, 75vw)' }}>
      <div style={{ marginBottom: '8px', color: '#666', fontSize: '13px' }}>
        How should AI improve this section?
      </div>
      <Space.Compact style={{ width: '100%' }}>
        <Input
          placeholder="e.g. 'Make it more engaging'"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onPressEnter={handleEnhanceSubmit}
          disabled={isLoading}
        />
        <Button
          icon={<SendOutlined />}
          onClick={handleEnhanceSubmit}
          loading={isLoading}
          disabled={!prompt.trim()}
          className={styles.enhanceSendButton}
        />
      </Space.Compact>
    </div>
  );

  return (
    <div className={styles.formGroup} style={{ marginBottom: "24px" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <label htmlFor={id} style={{ margin: 0 }}>
          {label}
        </label>

        {/* Compact Popover Trigger */}
        <Popover
          content={enhanceContent}
          title={<span><ExperimentOutlined /> Enhance with AI</span>}
          trigger="click"
          open={isPopoverOpen}
          onOpenChange={setIsPopoverOpen}
          placement="bottomRight"
          autoAdjustOverflow={true}
          // Ensure it fits on mobile screen with some "margin" from the edge (100vw - 20px)
          overlayStyle={{ maxWidth: 'calc(100vw - 20px)' }}
          arrow={false}
        >
          <Button
            type="text"
            size="small"
            icon={<ExperimentOutlined />}
            className={styles.enhanceButton}
            style={{
              position: 'relative',
              top: 'auto',
              right: 'auto',
              width: 'auto',
              height: 'auto',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '13px'
            }}
          >
            Enhance
          </Button>
        </Popover>
      </div>

      <TextArea
        id={id}
        value={value}
        onChange={onChange}
        rows={rows}
        className={styles.textarea}
        style={{ borderRadius: '8px' }}
      />
    </div>
  );
};

export default EditableSection;