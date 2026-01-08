import React from 'react';
import { Typography } from 'antd';
import { FolderOpenOutlined, FileTextOutlined } from '@ant-design/icons';

const { Text } = Typography;

const PlaceholderCard = ({ type = 'class' }) => {
    const isClass = type === 'class';
    const Icon = isClass ? FolderOpenOutlined : FileTextOutlined;
    const message = isClass ? "No recent classes found" : "No recent lessons found";
    const subMessage = isClass ? "Create a class to get started" : "Create a lesson to get started";

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            aspectRatio: '1 / 1',
            background: 'var(--bg-secondary, #f8fafc)',
            border: '2px dashed var(--border-color, #e2e8f0)',
            borderRadius: '12px',
            padding: '20px',
            color: 'var(--text-secondary, #64748b)',
            width: '100%',
            boxSizing: 'border-box'
        }}>
            <Icon style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.5 }} />
            <Text type="secondary" style={{ fontWeight: 500 }}>{message}</Text>
            <Text type="secondary" style={{ fontSize: '12px', opacity: 0.8 }}>{subMessage}</Text>
        </div>
    );
};

export default PlaceholderCard;