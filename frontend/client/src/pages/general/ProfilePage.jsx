import React, { useState, useEffect } from "react";
import {
    Form,
    Input,
    Button,
    message,
    Card,
    Typography,
    Divider,
    Alert,
    Row,
    Col,
    Statistic,
    Avatar,
    Tag,
    Space,
    Timeline,
    Descriptions
} from "antd";
import { useUser } from "../../context/UserContext";
import { useAuth } from "../../context/AuthContext";
import {
    UserOutlined,
    KeyOutlined,
    RobotOutlined,
    EditOutlined,
    SaveOutlined,
    CloseOutlined,
    BarChartOutlined,
    BookOutlined,
    RocketOutlined
} from "@ant-design/icons";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts";
import { auth, EmailAuthProvider, linkWithCredential } from "../../firebase";
import { getTeacherAnalytics } from "../../services/adminService";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const { Title, Text } = Typography;

const ProfilePage = () => {
    const { currentUser: contextUser } = useUser();
    const { currentUser: firebaseUser } = useAuth();
    const user = contextUser || firebaseUser;

    const [form] = Form.useForm();
    const [passwordForm] = Form.useForm();

    // Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Data State
    const [hasPassword, setHasPassword] = useState(false);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);

    // Colors for charts
    const PIE_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#a0d911", "#eb2f96"];

    useEffect(() => {
        const fetchApiKey = async () => {
            try {
                const token = localStorage.getItem("authToken");
                const response = await fetch("/api/auth/gemini-key", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await response.json();

                form.setFieldsValue({
                    name: user?.name || "",
                    email: user?.email || "",
                    geminiApiKey: data.success ? data.apiKey : "",
                });
            } catch (error) {
                console.error("Failed to fetch API key:", error);
                // Fallback
                form.setFieldsValue({
                    name: user?.name || "",
                    email: user?.email || "",
                    geminiApiKey: "",
                });
            }
        };

        if (user) {
            // 1. Password Check Logic
            if (auth.currentUser) {
                const providers = auth.currentUser.providerData.map(p => p.providerId);
                setHasPassword(providers.includes('password'));
            } else {
                setHasPassword(true);
            }

            // 2. Fetch Profile Data (API Key)
            fetchApiKey();

            // 3. Fetch Analytics
            if (user._id) {
                fetchAnalytics(user._id);
            }
        }
    }, [user, form]);

    const fetchAnalytics = async (userId) => {
        try {
            setLoadingAnalytics(true);
            const data = await getTeacherAnalytics(userId);
            setAnalyticsData(data);
        } catch (error) {
            console.error("Failed to fetch analytics:", error);
            // Don't show error alert to user, just log it, as profile is primary
        } finally {
            setLoadingAnalytics(false);
        }
    };

    const handleProfileUpdate = async (values) => {
        try {
            setIsUpdatingProfile(true);
            const updateData = {
                name: values.name,
            };

            if (values.geminiApiKey && values.geminiApiKey.trim()) {
                updateData.geminiApiKey = values.geminiApiKey.trim();
            }

            const token = localStorage.getItem("authToken");
            const response = await fetch("/api/auth/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(updateData),
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || "Failed to update profile");
            }

            message.success("Profile updated successfully!");
            if (contextUser?.refresh) await contextUser.refresh();

            setIsEditing(false); // Exit edit mode
        } catch (error) {
            console.error("Update profile error:", error);
            message.error(error.message || "Failed to update profile");
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handlePasswordSubmit = async (values) => {
        try {
            setIsChangingPassword(true);
            const requestBody = { newPassword: values.newPassword };

            if (hasPassword && values.currentPassword) {
                requestBody.currentPassword = values.currentPassword;
            }

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

            if (!hasPassword) {
                const currentFirebaseUser = auth.currentUser;
                if (currentFirebaseUser) {
                    const credential = EmailAuthProvider.credential(currentFirebaseUser.email, values.newPassword);
                    await linkWithCredential(currentFirebaseUser, credential);
                    message.success("Password set and linked to account!");
                }
            } else {
                message.success(data.message || "Password updated successfully!");
            }

            passwordForm.resetFields();
            setHasPassword(true);
        } catch (error) {
            console.error("Change password error:", error);
            message.error(error.message || "Failed to change password");
        } finally {
            setIsChangingPassword(false);
        }
    };

    if (!user) return null;

    // -- Render Helpers --

    const renderAnalyticsSection = () => {
        if (loadingAnalytics) return <LoadingSpinner tip="Loading stats..." />;
        if (!analyticsData) return null;

        const { analytics } = analyticsData;
        const { totalLessons, totalClasses, activityOverTime, hotsDistribution } = analytics;

        return (
            <div style={{ marginTop: '24px' }}>
                <Divider orientation="left"><BarChartOutlined /> Performance Insights</Divider>

                {/* Stats Row */}
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12}>
                        <Card bordered={false} className="shadow-sm">
                            <Statistic
                                title="Total Lessons"
                                value={totalLessons}
                                prefix={<BookOutlined style={{ color: '#1890ff' }} />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Card bordered={false} className="shadow-sm">
                            <Statistic
                                title="Active Classes"
                                value={totalClasses}
                                prefix={<UserOutlined style={{ color: '#52c41a' }} />}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* Charts Row */}
                <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
                    {/* Trend Chart */}
                    <Col xs={24} lg={16}>
                        <Card title={<><RocketOutlined /> Activity Trends (6 Months)</>} bordered={false} className="shadow-sm">
                            <div style={{ height: 250 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={activityOverTime}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" />
                                        <YAxis allowDecimals={false} />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="lessons" stroke="#1890ff" strokeWidth={3} dot={{ r: 4 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </Col>

                    {/* HOTS Distribution or Recent Activity */}
                    <Col xs={24} lg={8}>
                        <Card title="Pedagogical Focus (HOTS)" bordered={false} className="shadow-sm">
                            <div style={{ height: 250 }}>
                                {hotsDistribution && hotsDistribution.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={hotsDistribution}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={40}
                                                outerRadius={60}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {hotsDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#999' }}>
                                        No data available
                                    </div>
                                )}
                            </div>
                        </Card>
                    </Col>
                </Row>
            </div>
        );
    };

    return (
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <Row gutter={[24, 24]}>

                {/* Left Column: Profile Info */}
                <Col xs={24} lg={8}>
                    <Card bordered={false} className="shadow-sm" style={{ textAlign: 'center' }}>
                        <Avatar
                            size={100}
                            icon={<UserOutlined />}
                            src={user.avatar}
                            style={{ backgroundColor: '#1890ff', marginBottom: '16px' }}
                        />

                        {isEditing ? (
                            <Form form={form} layout="vertical" onFinish={handleProfileUpdate}>
                                <Form.Item name="name" rules={[{ required: true }]}>
                                    <Input prefix={<UserOutlined />} placeholder="Full Name" />
                                </Form.Item>
                                <Form.Item name="geminiApiKey" label="Gemini API Key">
                                    <Input.Password prefix={<RobotOutlined />} placeholder="Update API Key" />
                                </Form.Item>
                                <Space>
                                    <Button onClick={() => setIsEditing(false)} icon={<CloseOutlined />}>Cancel</Button>
                                    <Button type="primary" htmlType="submit" loading={isUpdatingProfile} icon={<SaveOutlined />}>Save</Button>
                                </Space>
                            </Form>
                        ) : (
                            <>
                                <Title level={3} style={{ marginBottom: 0 }}>{user.name}</Title>
                                <Text type="secondary">{user.email}</Text>
                                <div style={{ marginTop: '16px' }}>
                                    {user.roles?.map(role => (
                                        <Tag color="geekblue" key={role}>{role.replace('_', ' ').toUpperCase()}</Tag>
                                    ))}
                                </div>
                                <Button
                                    type="primary"
                                    ghost
                                    icon={<EditOutlined />}
                                    style={{ marginTop: '24px', width: '100%' }}
                                    onClick={() => setIsEditing(true)}
                                >
                                    Edit Profile
                                </Button>
                            </>
                        )}
                    </Card>

                    {/* School Details Card */}
                    <Card title="School Information" bordered={false} className="shadow-sm mt-3">
                        <Descriptions column={1} size="small">
                            <Descriptions.Item label="School">{user.schoolId?.name || user.schoolName || "N/A"}</Descriptions.Item>
                            <Descriptions.Item label="Type">{user.schoolId?.schoolType || "N/A"}</Descriptions.Item>
                            <Descriptions.Item label="Address">{user.schoolId?.address || "N/A"}</Descriptions.Item>
                        </Descriptions>
                    </Card>

                    {/* Password Change Card */}
                    <Card title={hasPassword ? "Change Password" : "Set Password"} bordered={false} className="shadow-sm mt-3">
                        <Form form={passwordForm} layout="vertical" onFinish={handlePasswordSubmit}>
                            {hasPassword && (
                                <Form.Item name="currentPassword" rules={[{ required: true }]}>
                                    <Input.Password prefix={<KeyOutlined />} placeholder="Current Password" />
                                </Form.Item>
                            )}
                            <Form.Item
                                name="newPassword"
                                rules={[
                                    { required: true },
                                    { min: 6, message: "Min 6 chars" }
                                ]}
                            >
                                <Input.Password prefix={<KeyOutlined />} placeholder="New Password" />
                            </Form.Item>
                            <Form.Item
                                name="confirmPassword"
                                dependencies={['newPassword']}
                                rules={[
                                    { required: true, message: 'Please confirm your password!' },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue('newPassword') === value) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error('The two passwords that you entered do not match!'));
                                        },
                                    }),
                                ]}
                            >
                                <Input.Password prefix={<KeyOutlined />} placeholder="Confirm Password" />
                            </Form.Item>
                            <Button type="dashed" htmlType="submit" loading={isChangingPassword} block>
                                {hasPassword ? "Update Password" : "Set Password"}
                            </Button>
                        </Form>
                    </Card>
                </Col>

                {/* Right Column: Dashboard & Stats */}
                <Col xs={24} lg={16}>
                    {/* Welcome Banner */}
                    <Alert
                        message={`Welcome back, ${user.name.split(' ')[0]}!`}
                        description="Here's an overview of your teaching impact and lesson planning activity."
                        type="info"
                        showIcon
                        icon={<UserOutlined />}
                        style={{ marginBottom: '24px' }}
                    />

                    {/* Render Analytics */}
                    {renderAnalyticsSection()}

                    {/* Recent Activity Log (from Analytics Data) */}
                    {analyticsData?.analytics?.recentActivity && (
                        <Card title="Recent Activity" bordered={false} className="shadow-sm mt-4">
                            <Timeline mode="left">
                                {analyticsData.analytics.recentActivity.map((item, idx) => (
                                    <Timeline.Item
                                        key={idx}
                                        color={item.type === 'lesson_created' ? 'blue' : 'green'}
                                        label={new Date(item.date).toLocaleDateString()}
                                    >
                                        <Text strong>{item.title}</Text>
                                        <br />
                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                            {item.type === 'lesson_created' ? 'Created Lesson' : 'Uploaded Material'}
                                        </Text>
                                    </Timeline.Item>
                                ))}
                            </Timeline>
                        </Card>
                    )}
                </Col>
            </Row>
        </div>
    );
};

export default ProfilePage;
