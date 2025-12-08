import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Button,
    Card,
    Typography,
    Row,
    Col,
    Avatar,
    Tag,

    Statistic,
    Spin,
    Alert,

} from "antd";
import {
    ArrowLeftOutlined,
    UserOutlined,
    MailOutlined,
    CalendarOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    BookOutlined,
} from "@ant-design/icons";
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Cell,
} from "recharts";
import { getTeacherAnalytics } from "../../services/adminService";
import "./TeacherAnalyticsPage.css";


const { Title, Text } = Typography;

const TeacherAnalyticsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const result = await getTeacherAnalytics(id);
                setData(result);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading) {
        return (
            <div style={{ padding: "3rem", textAlign: "center" }}>
                <Spin size="large" tip="Loading analytics..." />
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: "2rem" }}>
                <Alert
                    message="Error"
                    description={error}
                    type="error"
                    showIcon
                    action={
                        <Button size="small" type="primary" onClick={() => navigate(-1)}>
                            Go Back
                        </Button>
                    }
                />
            </div>
        );
    }

    if (!data) return null;

    const { teacher, analytics } = data;
    const { statusDistribution, subjectDistribution, totalLessons, totalClasses, lastActivity } = analytics;

    // Colors for charts
    const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

    return (
        <div className="analytics-page">
            {/* Navigation */}
            <div className="back-nav">
                <Button
                    type="link"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate("/app/admin")}
                    style={{ paddingLeft: 0, fontSize: "1rem" }}
                >
                    Back to Teacher Management
                </Button>
            </div>

            {/* 1. Header Section: Picture Name | Email Created: Date */}
            <Card className="header-card">
                <Row gutter={[24, 24]} align="middle">
                    {/* Picture */}
                    <Col flex="120px" className="teacher-avatar-col">
                        <Avatar
                            size={100}
                            icon={<UserOutlined />}
                            src={teacher.avatar}
                            className="teacher-avatar"
                            style={{ backgroundColor: "#1890ff" }}
                        />
                    </Col>

                    {/* Details */}
                    <Col flex="auto">
                        {/* Top Row: Name | Email | Created */}
                        <div className="teacher-name-row">
                            <Title level={2} className="teacher-name">
                                {teacher.name}
                            </Title>
                            <span className="divider-pipe">|</span>
                            <div className="teacher-meta-item">
                                <MailOutlined style={{ color: "#1890ff" }} />
                                <Text type="secondary">{teacher.email}</Text>
                            </div>
                            <span className="divider-pipe">|</span>
                            <div className="teacher-meta-item">
                                <CalendarOutlined style={{ color: "#1890ff" }} />
                                <Text type="secondary">Created: {new Date(teacher.createdAt).toLocaleDateString()}</Text>
                            </div>
                        </div>

                        {/* Bottom Row: Tags (Role) (Active Status) (Subjects) */}
                        <div className="teacher-tags-row">
                            {/* Roles */}
                            {teacher.roles?.map((role) => (
                                <Tag color="geekblue" key={role} className="custom-tag">
                                    {role.replace("_", " ").toUpperCase()}
                                </Tag>
                            ))}

                            {/* Status */}
                            {teacher.isActive ? (
                                <Tag icon={<CheckCircleOutlined />} color="success" className="custom-tag">
                                    ACTIVE
                                </Tag>
                            ) : (
                                <Tag icon={<ClockCircleOutlined />} color="default" className="custom-tag">
                                    INACTIVE
                                </Tag>
                            )}

                            {/* Subjects Taught */}
                            {teacher.subjectsTaught?.map((sub) => (
                                <Tag color="purple" key={sub} className="custom-tag">
                                    {sub}
                                </Tag>
                            ))}
                        </div>
                    </Col>
                </Row>
            </Card>

            {/* 2. Display Card: Stats Row */}
            <Row gutter={[20, 20]} style={{ marginBottom: "2rem" }}>
                <Col xs={24} sm={8} className="stat-card-col">
                    <Card className="stat-card">
                        <Statistic
                            title={
                                <div className="stat-title">
                                    <ClockCircleOutlined style={{ fontSize: '1.2rem', color: '#faad14' }} />
                                    <span>Last Activity</span>
                                </div>
                            }
                            value={
                                lastActivity
                                    ? new Date(lastActivity).toLocaleDateString()
                                    : "No recent activity"
                            }
                            valueStyle={{ fontWeight: "700", color: "#262626" }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8} className="stat-card-col">
                    <Card className="stat-card">
                        <Statistic
                            title={
                                <div className="stat-title">
                                    <BookOutlined style={{ fontSize: '1.2rem', color: "#1890ff" }} />
                                    <span>Total Lessons</span>
                                </div>
                            }
                            value={totalLessons}
                            valueStyle={{ fontWeight: "700", color: "#262626" }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8} className="stat-card-col">
                    <Card className="stat-card">
                        <Statistic
                            title={
                                <div className="stat-title">
                                    <UserOutlined style={{ fontSize: '1.2rem', color: "#52c41a" }} />
                                    <span>Total Classes</span>
                                </div>
                            }
                            value={totalClasses || 0}
                            valueStyle={{ fontWeight: "700", color: "#262626" }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Charts Row */}
            <Row gutter={[24, 24]}>
                {/* Radar Chart - Lesson Status */}
                <Col xs={24} md={12}>
                    <Card title="Lesson Status Distribution" className="chart-card">
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={statusDistribution}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="status" />
                                    <PolarRadiusAxis angle={30} domain={[0, 'dataMax + 1']} />
                                    <Radar
                                        name="Lessons"
                                        dataKey="count"
                                        stroke="#8884d8"
                                        fill="#8884d8"
                                        fillOpacity={0.6}
                                    />
                                    <Tooltip />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="chart-description">
                            Draft vs. Pending vs. Approved
                        </div>
                    </Card>
                </Col>

                {/* Bar Chart - Subject Mix */}
                <Col xs={24} md={12}>
                    <Card title="Subject Focus" className="chart-card">
                        {subjectDistribution && subjectDistribution.length > 0 ? (
                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={subjectDistribution} layout="vertical" margin={{ left: 20, right: 20 }}>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="subject" type="category" width={100} tick={{ fontSize: 12 }} />
                                        <Tooltip cursor={{ fill: 'transparent' }} />
                                        <Bar dataKey="count" fill="#82ca9d" radius={[0, 4, 4, 0]}>
                                            {subjectDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div style={{ textAlign: "center", padding: "5rem 0" }}>
                                <Text type="secondary">No detailed subject data available</Text>
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default TeacherAnalyticsPage;
