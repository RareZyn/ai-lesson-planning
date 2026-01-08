import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TeacherManagement.css";
import { getTeachers, getInvitationCode, deleteTeacher, inviteTeacher, toggleTeacherStatus, revokeToken, resendInvite, updateTeacherRole } from "../../services/adminService";
import { Modal as AntModal, message, Pagination, Dropdown, Menu, Button, Input } from "antd";
import {
  ExclamationCircleOutlined,
  MoreOutlined,
  DeleteOutlined,
  UserOutlined,
  MailOutlined,
  PlusOutlined,
  CopyOutlined,
  SendOutlined,
  CloseOutlined,
  TeamOutlined,
  LockOutlined,
  UnlockOutlined,
  UserSwitchOutlined
} from "@ant-design/icons";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import CommonTable from "../../components/common/CommonTable";

const TeacherManagement = ({ searchTerm = "" }) => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState("");
  const [invitationCode, setInvitationCode] = useState("");
  const navigate = useNavigate();

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Tabs
  const [activeTab, setActiveTab] = useState("teachers");
  const [activeTokens, setActiveTokens] = useState([]);

  // Role Modal State
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState([]);

  // Resend Modal State
  const [resendModalVisible, setResendModalVisible] = useState(false);
  const [resendTokenId, setResendTokenId] = useState(null);
  const [resendEmail, setResendEmail] = useState("");

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Reset pagination on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const data = await getTeachers();
      setTeachers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch pending tokens
  const fetchActiveTokens = async () => {
    setLoading(true); // Show spinner while fetching tokens
    try {
      const { getActiveTokens } = require("../../services/adminService");
      const tokens = await getActiveTokens();
      setActiveTokens(tokens);
    } catch (error) {
      console.error("Error fetching active tokens:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial Fetch based on active tab
  useEffect(() => {
    if (activeTab === "teachers") {
      fetchTeachers();
    } else if (activeTab === "pending") {
      fetchActiveTokens();
    }
  }, [activeTab]);

  const handleDeleteTeacher = async (id, name, email) => {
    AntModal.confirm({
      title: 'Delete Teacher',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>Are you sure you want to delete this teacher?</p>
          <p className="mb-1">
            <strong>Name:</strong> {name}
          </p>
          <p className="mb-1">
            <strong>Email:</strong> {email}
          </p>
          <p className="text-danger mb-0">
            <small>This action cannot be undone.</small>
          </p>
        </div>
      ),
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setLoading(true);
          const res = await deleteTeacher(id);
          if (res.success) {
            setTeachers((prev) => prev.filter((t) => t._id !== id));
            message.success('Teacher deleted successfully');
          } else {
            message.error(res.message || "Failed to delete teacher.");
          }
        } catch (err) {
          console.error(err);
          message.error("Error deleting teacher.");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleSendEmail = async () => {
    if (!email) {
      message.error("Please enter an email address.");
      return;
    }
    setLoading(true);
    try {
      const result = await inviteTeacher(email);
      if (result.success) {
        message.success("Invitation sent successfully!");
        setEmail("");
        setInvitationCode("");
        setShowModal(false);
        fetchActiveTokens(); // Refresh list to show new token
      }
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (teacher) => {
    // Treat undefined as active (same as render logic)
    const isCurrentlyActive = teacher.isActive !== false;
    const action = isCurrentlyActive ? "deactivate" : "activate";
    AntModal.confirm({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Teacher`,
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to ${action} ${teacher.name}?`,
      okText: action.charAt(0).toUpperCase() + action.slice(1),
      okType: isCurrentlyActive ? 'danger' : 'primary',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const res = await toggleTeacherStatus(teacher._id);
          if (res.success) {
            setTeachers((prev) =>
              prev.map((t) =>
                t._id === teacher._id ? { ...t, isActive: res.isActive } : t
              )
            );
            message.success(res.message);
          }
        } catch (err) {
          console.error(err);
          message.error("Error toggling teacher status.");
        }
      },
    });
  };

  const filteredTeachers = teachers.filter((teacher) =>
    [teacher.name, teacher.email, teacher.roles?.join(", ")]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const getMagicLink = (code) => {
    return `${window.location.origin}/register?token=${code}`;
  };

  const handleCopyMagicLink = (code) => {
    const link = getMagicLink(code);
    navigator.clipboard.writeText(link);
    message.success("Magic Link copied!");
  };

  const handleRevokeToken = (tokenId) => {
    AntModal.confirm({
      title: 'Revoke Invitation',
      icon: <ExclamationCircleOutlined />,
      content: 'Are you sure you want to revoke this invitation? The link will no longer work.',
      okText: 'Revoke',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const res = await revokeToken(tokenId);
          if (res.success) {
            setActiveTokens((prev) => prev.filter((t) => t._id !== tokenId));
            message.success('Invitation revoked');
          }
        } catch (err) {
          console.error(err);
          message.error("Error revoking invitation.");
        }
      },
    });
  };

  const handleResendInvite = (tokenId) => {
    setResendTokenId(tokenId);
    setResendEmail(""); // Reset email
    setResendModalVisible(true);
  };

  const handleResendSubmit = async () => {
    if (!resendEmail) {
      message.error("Please enter an email address.");
      return;
    }
    setLoading(true);
    try {
      const res = await resendInvite(resendTokenId, resendEmail);
      if (res.success) {
        message.success('Invitation resent successfully!');
        setResendModalVisible(false);
        setResendEmail("");
        setResendTokenId(null);
      }
    } catch (err) {
      console.error(err);
      message.error(err.message || "Error resending invitation.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRoleModal = (teacher) => {
    setSelectedTeacher(teacher);
    setSelectedRoles(teacher.roles || ['teacher']);
    setRoleModalVisible(true);
  };

  const handleSaveRoles = async () => {
    if (!selectedTeacher || selectedRoles.length === 0) {
      message.error("Please select at least one role");
      return;
    }
    try {
      const res = await updateTeacherRole(selectedTeacher._id, selectedRoles);
      if (res.success) {
        setTeachers((prev) =>
          prev.map((t) =>
            t._id === selectedTeacher._id ? { ...t, roles: res.roles } : t
          )
        );
        message.success("Roles updated successfully");
        setRoleModalVisible(false);
      }
    } catch (err) {
      console.error(err);
      message.error(err.message || "Error updating roles");
    }
  };

  const availableRoles = [
    { key: 'teacher', label: 'Teacher' },
    { key: 'admin', label: 'Admin' },
    { key: 'math_head', label: 'Math Head' },
    { key: 'science_head', label: 'Science Head' },
    { key: 'english_head', label: 'English Head' },
    { key: 'history_head', label: 'History Head' },
    { key: 'geography_head', label: 'Geography Head' },
  ];

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTeachers = filteredTeachers.slice(indexOfFirstItem, indexOfLastItem);
  const currentTokens = activeTokens.slice(indexOfFirstItem, indexOfLastItem);

  // RENDER PENDING INVITES
  const renderPendingInvites = () => {
    return (
      <>
        <CommonTable
          dataSource={currentTokens}
          emptyText="No pending invitations found."
          rowKey="token"
          columns={[
            {
              title: "Token Code",
              dataIndex: "token",
              key: "token",
              render: (text) => <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#3f51b5' }}>{text}</span>
            },
            {
              title: "Created By",
              dataIndex: ["createdBy", "name"],
              key: "createdBy",
              render: (text) => text || "Admin"
            },
            {
              title: "Created At",
              dataIndex: "createdAt",
              key: "createdAt",
              render: (date) => new Date(date).toLocaleDateString()
            },
            {
              title: "Usage",
              key: "usage",
              render: (_, record) => (
                <span>
                  {record.usageCount} / <span style={{ color: '#888' }}>{record.isMultiUse ? (record.maxUsage || "∞") : "1"}</span>
                </span>
              )
            },
            {
              title: "",
              key: "action",
              // width: 60,
              render: (_, record) => {
                const menu = (
                  <Menu onClick={(e) => e.domEvent.stopPropagation()}>
                    <Menu.Item
                      key="copy"
                      icon={<CopyOutlined />}
                      onClick={(e) => {
                        e.domEvent.stopPropagation();
                        handleCopyMagicLink(record.token);
                      }}
                    >
                      Copy Link
                    </Menu.Item>
                    <Menu.Item
                      key="resend"
                      icon={<SendOutlined />}
                      onClick={(e) => {
                        e.domEvent.stopPropagation();
                        handleResendInvite(record._id);
                      }}
                    >
                      Resend Invite
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item
                      key="revoke"
                      icon={<DeleteOutlined style={{ color: "#dc3545" }} />}
                      onClick={(e) => {
                        e.domEvent.stopPropagation();
                        handleRevokeToken(record._id);
                      }}
                    >
                      Revoke Invitation
                    </Menu.Item>
                  </Menu>
                );
                return (
                  <div onClick={(e) => e.stopPropagation()}>
                    <Dropdown overlay={menu} trigger={['click']}>
                      <Button icon={<MoreOutlined />} type="text" />
                    </Dropdown>
                  </div >
                );
              }

            }
          ]}
          renderCard={(token) => (
            <div className="tm-mobileCard">
              <div className="tm-mobileCardHeader">
                <span className="tm-headerLeft">
                  Created {new Date(token.createdAt).toLocaleDateString()}
                </span>
                <div onClick={(e) => e.stopPropagation()}>
                  <Dropdown
                    overlay={
                      <Menu onClick={(e) => e.domEvent.stopPropagation()}>
                        <Menu.Item key="copy" icon={<CopyOutlined />} onClick={(e) => { e.domEvent.stopPropagation(); handleCopyMagicLink(token.token); }}>Copy Link</Menu.Item>
                        <Menu.Item key="resend" icon={<SendOutlined />} onClick={(e) => { e.domEvent.stopPropagation(); handleResendInvite(token._id); }}>Resend Invite</Menu.Item>
                        <Menu.Divider />
                        <Menu.Item key="revoke" icon={<DeleteOutlined style={{ color: "#dc3545" }} />} onClick={(e) => { e.domEvent.stopPropagation(); handleRevokeToken(token._id); }}>Revoke</Menu.Item>
                      </Menu>
                    }
                    trigger={['click']}
                  >
                    <MoreOutlined style={{ fontSize: '20px', color: '#94a3b8' }} />
                  </Dropdown>
                </div>
              </div>
              <div className="tm-mobileCardBody">
                <div className="tm-topRow">
                  <div className="tm-iconCircle">
                    <UserOutlined />
                  </div>
                  <div className="tm-textBlock">
                    <div className="tm-cardTitle" style={{ fontFamily: 'monospace' }}>
                      {token.token}
                    </div>
                    <div className="tm-cardSubtitle">
                      By: {token.createdBy?.name || "Admin"}
                    </div>
                  </div>
                </div>
                <div className="tm-detailsList">
                  <div className="tm-detailRow">
                    <span className="tm-detailLabel">Usage</span>
                    <span className="tm-detailValue">{token.usageCount} / {token.isMultiUse ? (token.maxUsage || "∞") : "1"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        />
        {
          activeTokens.length > 10 && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
              <Pagination
                current={currentPage}
                pageSize={itemsPerPage}
                total={activeTokens.length}
                onChange={handlePageChange}
                showSizeChanger={false}
              />
            </div>
          )
        }
      </>
    );
  };

  return (
    <div className="tm-container">
      {/* HEADER WITH TABS & BUTTON */}
      <div className="tm-headerRow" style={{ justifyContent: 'space-between', alignItems: 'start' }}>
        {/* TABS */}
        <div className="tm-tabBar">
          <button
            className={`tm-tabButton ${activeTab === 'teachers' ? 'tm-activeTab' : ''}`}
            onClick={() => setActiveTab('teachers')}
          >
            <TeamOutlined /> Teachers
            <span className="tm-badge">{teachers.length}</span>
          </button>
          <button
            className={`tm-tabButton ${activeTab === 'pending' ? 'tm-activeTab' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            <MailOutlined /> Pending Invites
          </button>
        </div>

        {/* INVITE BUTTON */}
        <button
          className="tm-addButton"
          onClick={async () => {
            const code = await getInvitationCode();
            setInvitationCode(code);
            setShowModal(true);
          }}
          disabled={loading}
        >
          <PlusOutlined /> Invite Teacher
        </button>
      </div>

      {loading ? (
        <LoadingSpinner tip="Loading data..." />
      ) : activeTab === 'teachers' ? (
        <>
          <CommonTable
            loading={loading}
            dataSource={currentTeachers}
            emptyText="No teachers found."
            rowKey="_id"
            columns={[
                {
                  title: "Name",
                  dataIndex: "name",
                  key: "name",
                  render: (text) => <span style={{ fontWeight: 600, color: '#2c3e50' }}><UserOutlined className="tm-listIcon" /> {text}</span>
                },
                {
                  title: "Email",
                  dataIndex: "email",
                  key: "email",
                  render: (text) => <span style={{ color: '#64748b' }}>{text}</span>
                },
                {
                  title: "Status",
                  dataIndex: "isActive",
                  key: "isActive",
                  render: (isActive) => (
                    <span style={{
                      background: isActive !== false ? '#dcfce7' : '#fee2e2',
                      color: isActive !== false ? '#166534' : '#991b1b',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>
                      {isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  )
                },
                {
                  title: "Access",
                  dataIndex: "roles",
                  key: "roles",
                  render: (roles) => (
                    <span style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
                      {roles?.length ? roles.join(", ") : "Start"}
                    </span>
                  )
                },
                {
                  title: "Joined",
                  dataIndex: "createdAt",
                  key: "createdAt",
                  render: (date) => new Date(date).toLocaleDateString()
                },
                {
                  title: "",
                  key: "action",
                  width: 60,
                  render: (_, teacher) => {
                    const menu = (
                      <Menu onClick={(e) => e.domEvent.stopPropagation()}>
                        <Menu.Item
                          key="toggle"
                          icon={teacher.isActive !== false ? <LockOutlined /> : <UnlockOutlined />}
                          onClick={(e) => {
                            e.domEvent.stopPropagation();
                            handleToggleStatus(teacher);
                          }}
                        >
                          {teacher.isActive !== false ? 'Deactivate' : 'Reactivate'}
                        </Menu.Item>
                        <Menu.Item
                          key="role"
                          icon={<UserSwitchOutlined />}
                          onClick={(e) => {
                            e.domEvent.stopPropagation();
                            handleOpenRoleModal(teacher);
                          }}
                        >
                          Change Role
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Item
                          key="delete"
                          icon={<DeleteOutlined style={{ color: "#dc3545" }} />}
                          onClick={(e) => {
                            e.domEvent.stopPropagation();
                            handleDeleteTeacher(teacher._id, teacher.name, teacher.email);
                          }}
                        >
                          Delete Teacher
                        </Menu.Item>
                      </Menu>
                    );
                    return (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Dropdown overlay={menu} trigger={['click']}>
                          <Button icon={<MoreOutlined />} type="text" />
                        </Dropdown>
                      </div>
                    );
                  }
                }
              ]}
              onRow={(record) => ({
                onClick: () => navigate(`/app/admin/teacher-analytics/${record._id}`)
              })}
              renderCard={(teacher) => {
                const menu = (
                  <Menu onClick={(e) => e.domEvent.stopPropagation()}>
                    <Menu.Item
                      key="toggle"
                      icon={teacher.isActive !== false ? <LockOutlined /> : <UnlockOutlined />}
                      onClick={(e) => {
                        e.domEvent.stopPropagation();
                        handleToggleStatus(teacher);
                      }}
                    >
                      {teacher.isActive !== false ? 'Deactivate' : 'Reactivate'}
                    </Menu.Item>
                    <Menu.Item
                      key="role"
                      icon={<UserSwitchOutlined />}
                      onClick={(e) => {
                        e.domEvent.stopPropagation();
                        handleOpenRoleModal(teacher);
                      }}
                    >
                      Change Role
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item
                      key="delete"
                      icon={<DeleteOutlined style={{ color: "#dc3545" }} />}
                      onClick={(e) => {
                        e.domEvent.stopPropagation();
                        handleDeleteTeacher(teacher._id, teacher.name, teacher.email);
                      }}
                    >
                      Delete
                    </Menu.Item>
                  </Menu>
                );

                return (
                  <div
                    className="tm-mobileCard"
                    onClick={() => navigate(`/app/admin/teacher-analytics/${teacher._id}`)}
                  >
                    <div className="tm-mobileCardHeader">
                      <span className="tm-headerLeft">
                        Joined {new Date(teacher.createdAt).toLocaleDateString()}
                      </span>
                      <div onClick={(e) => e.stopPropagation()}>
                        <Dropdown overlay={menu} trigger={['click']}>
                          <MoreOutlined style={{ fontSize: '20px', color: '#94a3b8' }} />
                        </Dropdown>
                      </div>
                    </div>

                    <div className="tm-mobileCardBody">
                      <div className="tm-topRow">
                        <div className="tm-iconCircle">
                          <UserOutlined />
                        </div>
                        <div className="tm-textBlock">
                          <div className="tm-cardTitle">
                            {teacher.name}
                          </div>
                          <div className="tm-cardSubtitle">
                            {teacher.email}
                          </div>
                        </div>
                      </div>

                      <div className="tm-detailsList">
                        <div className="tm-detailRow">
                          <span className="tm-detailLabel">Access Level</span>
                          <span className="tm-detailValue">
                            {teacher.roles?.length ? teacher.roles.join(", ") : "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            {filteredTeachers.length > itemsPerPage && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                <Pagination
                  current={currentPage}
                  pageSize={itemsPerPage}
                  total={filteredTeachers.length}
                  onChange={handlePageChange}
                  showSizeChanger={false}
                />
              </div>
            )}
          </>
      ) : (
        renderPendingInvites()
      )}

      {/* =============== ADD TEACHER MODAL =============== */}
      {showModal && (
        <div className="tm-modalOverlay">
          <div className="tm-modalBox">
            <div className="tm-modalHeader">
              <h3><SendOutlined style={{ marginRight: 10, color: '#3f51b5' }} />Invite Teacher</h3>
              <button
                className="tm-closeButton"
                onClick={() => {
                  setShowModal(false);
                  setEmail("");
                  setInvitationCode("");
                }}
              >
                <CloseOutlined />
              </button>
            </div>

            <div className="tm-modalBody">
              <label>Send Invitation via Email</label>
              <div className="tm-emailRow">
                <input
                  type="email"
                  placeholder="teacher@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button
                  className="tm-sendButton"
                  onClick={handleSendEmail}
                  disabled={loading}
                >
                  <SendOutlined /> Send
                </button>
              </div>

              {invitationCode && (
                <>
                  <div className="tm-modalSeparator">OR SHARE MANUALLY</div>
                  <div className="tm-inviteCodeSection">
                    <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: 5 }}>Invitation Code</div>
                    <div className="tm-inviteCodeDisplay" style={{ wordBreak: "break-all", whiteSpace: "pre-wrap" }}>{invitationCode}</div>

                    <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: 5, marginTop: 15 }}>Magic Link</div>
                    <div className="tm-magicLinkSection">
                      <input
                        className="tm-magicLinkInput"
                        readOnly
                        value={getMagicLink(invitationCode)}
                      />
                      <button onClick={() => handleCopyMagicLink(invitationCode)} className="tm-copyButton">
                        <CopyOutlined /> Copy
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =============== ROLE MODAL =============== */}
      <AntModal
        title={`Change Role - ${selectedTeacher?.name || ''}`}
        open={roleModalVisible}
        onCancel={() => setRoleModalVisible(false)}
        onOk={handleSaveRoles}
        okText="Save Roles"
      >
        <p style={{ marginBottom: 16, color: '#64748b' }}>Select one or more roles for this teacher:</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {availableRoles.map((role) => (
            <label key={role.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={selectedRoles.includes(role.key)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedRoles([...selectedRoles, role.key]);
                  } else {
                    setSelectedRoles(selectedRoles.filter(r => r !== role.key));
                  }
                }}
                style={{ width: 18, height: 18 }}
              />
              <span style={{ fontSize: '0.95rem' }}>{role.label}</span>
            </label>
          ))}
        </div>
      </AntModal>

      {/* =============== RESEND MODAL =============== */}
      <AntModal
        title={<span><SendOutlined style={{ marginRight: 8, color: '#1890ff' }} /> Resend Invitation</span>}
        open={resendModalVisible}
        onCancel={() => {
          if (!loading) {
            setResendModalVisible(false);
            setResendEmail("");
          }
        }}
        confirmLoading={loading}
        onOk={handleResendSubmit}
        okText="Resend"
        cancelButtonProps={{ disabled: loading }}
      >
        <p style={{ marginBottom: 16 }}>Please enter the email address to resend the invitation to:</p>
        <Input
          placeholder="Enter email address"
          value={resendEmail}
          onChange={(e) => setResendEmail(e.target.value)}
          onPressEnter={handleResendSubmit}
          prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
          autoFocus
        />
      </AntModal>
    </div>
  );
};

export default TeacherManagement;
