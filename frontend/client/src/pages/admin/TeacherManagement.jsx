import React, { useEffect, useState } from "react";
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

const TeacherManagement = ({ searchTerm = "" }) => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState("");
  const [invitationCode, setInvitationCode] = useState("");

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
  const handleDeleteTeacher = async (id, name) => {
    if (!window.confirm(`Delete teacher "${name}"? This action cannot be undone.`)) return;
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const res = await authAPI.deleteTeacher(id, token);
      if (res.success) {
        setTeachers((prev) => prev.filter((t) => t._id !== id));
      } else {
        alert(res.message || "Failed to delete teacher.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting teacher.");
    } finally {
      setLoading(false);
    }
  };

  // ===========================
  // INVITE TEACHER (FAKE EXAMPLE)
  // ===========================
  const handleSendInvitation = async () => {
    if (!email) return alert("Please enter an email.");
    try {
      setLoading(true);

      // Use the already generated invitationCode
      alert(`Invitation sent to ${email}! Code: ${invitationCode}`);
      setEmail(""); // optionally reset email input
    } catch (err) {
      console.error("Error sending invite:", err);
      alert("Failed to send invitation.");
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
    alert("Invitation code copied to clipboard!");
  };

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
        <p>Loading teachers...</p>
      ) : filteredTeachers.length === 0 ? (
        <p>No teachers found.</p>
      ) : (
        <div className="listContainer">
          <div className="listHeader listItem">
            <div className="listTitle">Name</div>
            <div className="listDetail">Email</div>
            <div className="listDetail">Access</div>
            <div className="listDetail">Created At</div>
            <div className="listDetail">Last Updated</div>
            <div className="listActions">Action</div>
          </div>

          {filteredTeachers.map((teacher) => (
            <div key={teacher._id} className="listItem">
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
              <div className="listDetail">
                {new Date(teacher.createdAt).toLocaleDateString()}
              </div>
              <div className="listDetail">
                {new Date(teacher.updatedAt).toLocaleDateString()}
              </div>
              <div className="listActions">
                <button
                  onClick={() => handleDeleteTeacher(teacher._id, teacher.name)}
                  className="actionButton delete"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            </div>
          ))}
        </div>
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
