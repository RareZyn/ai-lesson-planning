import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TeacherManagement.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faUserTie,
  faEnvelope,
  faUserShield,
  faPlus,
  faCopy,
  faPaperPlane,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { getTeachers, getInvitationCode } from "../../services/adminService";
import { authAPI } from "../../services/api";
import { Modal as AntModal, message, Pagination } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
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

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Reset pagination on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // ===========================
  // FETCH TEACHERS
  // ===========================
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

  useEffect(() => {
    fetchTeachers();
  }, []);

  // ===========================
  // DELETE TEACHER
  // ===========================
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
          const token = localStorage.getItem("authToken");
          const res = await authAPI.deleteTeacher(id, token);
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

  // ===========================
  // INVITE TEACHER (FAKE EXAMPLE)
  // ===========================
  const handleSendInvitation = async () => {
    if (!email) {
      message.warning("Please enter an email.");
      return;
    }
    try {
      setLoading(true);

      // Use the already generated invitationCode
      message.success(`Invitation sent to ${email}! Code: ${invitationCode}`);
      setEmail(""); // optionally reset email input
    } catch (err) {
      console.error("Error sending invite:", err);
      message.error("Failed to send invitation.");
    } finally {
      setLoading(false);
    }
  };


  // ===========================
  // FILTER LOGIC
  // ===========================
  const filteredTeachers = teachers.filter((teacher) =>
    [teacher.name, teacher.email, teacher.roles?.join(", ")]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // ===========================
  // COPY INVITE CODE
  // ===========================
  const handleCopyCode = () => {
    navigator.clipboard.writeText(invitationCode);
    message.success("Invitation code copied to clipboard!");
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTeachers = filteredTeachers.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="teacherManagement">
      <div className="headerRow">
        <button
          className="addButton"
          onClick={async () => {
            const code = await getInvitationCode()
            setInvitationCode(code); // generate code immediately
            setShowModal(true);
          }}
          disabled={loading}
        >
          <FontAwesomeIcon icon={faPlus} /> Add Teacher
        </button>
      </div>

      {loading ? (
        <LoadingSpinner tip="Loading teachers..." />
      ) : filteredTeachers.length === 0 ? (
        <p>No teachers found.</p>
      ) : (
        <>
          <CommonTable
            loading={loading}
            dataSource={currentTeachers}
            rowKey="_id"
            columns={[
              {
                title: "Name",
                dataIndex: "name",
                key: "name",
                render: (text) => <span><FontAwesomeIcon icon={faUserTie} className="listIcon" /> {text}</span>
              },
              {
                title: "Email",
                dataIndex: "email",
                key: "email",
                render: (text) => <span><FontAwesomeIcon icon={faEnvelope} className="listIcon" /> {text}</span>
              },
              {
                title: "Access",
                dataIndex: "roles",
                key: "roles",
                render: (roles) => <span><FontAwesomeIcon icon={faUserShield} className="listIcon" /> {roles?.length ? roles.join(", ") : "—"}</span>
              },
              {
                title: "Created At",
                dataIndex: "createdAt",
                key: "createdAt",
                render: (date) => new Date(date).toLocaleDateString()
              },
              {
                title: "Last Updated",
                dataIndex: "updatedAt",
                key: "updatedAt",
                render: (date) => new Date(date).toLocaleDateString()
              },
              {
                title: "Action",
                key: "action",
                render: (_, teacher) => (
                  <div className="listActions">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteTeacher(teacher._id, teacher.name, teacher.email); }}
                      className="actionButton delete"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                )
              }
            ]}
            onRow={(record) => ({
              onClick: () => navigate(`/app/admin/teacher-analytics/${record._id}`)
            })}
            renderCard={(teacher) => (
              <div
                className="listItem" // Reuse existing styles
                onClick={() => navigate(`/app/admin/teacher-analytics/${teacher._id}`)}
                style={{ cursor: "pointer", display: 'flex', flexDirection: 'column', height: 'auto', gap: '8px' }}
              >
                <div className="listTitle">
                  <FontAwesomeIcon icon={faUserTie} className="listIcon" />{" "}
                  {teacher.name}
                </div>
                <div className="listDetail">
                  <FontAwesomeIcon icon={faEnvelope} className="listIcon" />{" "}
                  {teacher.email}
                </div>
                <div className="listDetail">
                  <FontAwesomeIcon icon={faUserShield} className="listIcon" />{" "}
                  {teacher.roles?.length ? teacher.roles.join(", ") : "—"}
                </div>
                <div className="listActions" style={{ alignSelf: 'flex-end', marginTop: '8px' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteTeacher(teacher._id, teacher.name, teacher.email); }}
                    className="actionButton delete"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            )}
          />
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
            <Pagination
              current={currentPage}
              pageSize={itemsPerPage}
              total={filteredTeachers.length}
              onChange={handlePageChange}
              showSizeChanger={false}
            />
          </div>
        </>
      )}

      {/* =============== ADD TEACHER MODAL =============== */}
      {showModal && (
        <div className="modalOverlay">
          <div className="modalBox">
            <div className="modalHeader">
              <h3>Invite New Teacher</h3>
              <button
                className="closeButton"
                onClick={() => {
                  setShowModal(false);
                  setEmail("");
                  setInvitationCode("");
                }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="modalBody">
              <label>Email address:</label>
              <div className="emailRow">
                <input
                  type="email"
                  placeholder="Enter teacher's email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button
                  className="sendButton"
                  onClick={handleSendInvitation}
                  disabled={loading}
                >
                  <FontAwesomeIcon icon={faPaperPlane} /> Send
                </button>
              </div>

              {invitationCode && (
                <>
                  <div className="modalSeparator">OR</div>
                  <div className="inviteCodeSection">
                    <p>
                      Invitation Code: <strong>{invitationCode}</strong>
                    </p>
                    <button onClick={handleCopyCode} className="copyButton">
                      <FontAwesomeIcon icon={faCopy} /> Copy Code
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherManagement;
