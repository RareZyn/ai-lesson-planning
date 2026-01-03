import axios from "axios";

const getAuthConfig = () => ({
    headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
    },
});

export const sendLessonForApproval = async (lessonId) => {
    try {
        const response = await axios.put(
            `/api/lessons/${lessonId}/send`,
            {}, // no payload needed
            getAuthConfig()
        );

        // Assuming backend returns { success: true, message: "...", lesson: {...} }
        return response.data.lesson;
    } catch (error) {
        console.error(
            "Error sending lesson for approval:",
            error.response?.data?.message || error.message
        );
        throw new Error(
            error.response?.data?.message || "Failed to send lesson for approval."
        );
    }
};

export const getPendingLessons = async () => {
    try {
        const response = await axios.get(
            "/api/lessons/pending",
            getAuthConfig()
        );
        return response.data.data;
    } catch (error) {
        console.error(
            "Error fetching pending lessons:",
            error.response?.data
        );
        throw new Error(
            error.response?.data?.message || "Could not fetch pending lessons."
        );
    }
};

export const approveLesson = async (lessonId) => {
    try {
        const response = await axios.patch(
            `/api/lessons/${lessonId}/approve`,
            {
                approvalStatus: "approved",
            },
            getAuthConfig()
        );
        return response.data.data;
    } catch (error) {
        console.error(
            "Error approving lesson:",
            error.response?.data
        );
        throw new Error(
            error.response?.data?.message || "Could not approve the lesson."
        );
    }
};

export const rejectLesson = async (lessonId, reason) => {
    try {
        const response = await axios.patch(
            `/api/lessons/${lessonId}/reject`,
            {
                approvalStatus: "rejected",
                remarks: reason,
            },
            getAuthConfig()
        );
        return response.data.data;
    } catch (error) {
        console.error(
            "Error rejecting lesson:",
            error.response?.data
        );
        throw new Error(
            error.response?.data?.message || "Could not reject the lesson."
        );
    }
};

export const getAllLessonsForApproval = async () => {
    try {
        const response = await axios.get(
            "/api/lessons/approval/all",
            getAuthConfig()
        );
        return response.data.lessons;
    } catch (error) {
        console.error(
            "Error fetching all lessons for approval:",
            error.response?.data?.message || error.message
        );
        throw new Error(
            error.response?.data?.message || "Could not fetch lessons for approval."
        );
    }
};

export const getTeachers = async (schoolId) => {
    try {
        const response = await axios.get(
            `/api/admin/teachers`,
            getAuthConfig()
        );
        return response.data.teachers;
    } catch (error) {
        console.error("Error fetching teachers: ", error.response?.data?.message || error.message);

        throw new Error(error.response?.data?.message || "Could not fetch teachers.");
    }
};

export const getInvitationCode = async () => {
    try {
        const response = await axios.post(
            `/api/admin/generate-teacher-token`,
            getAuthConfig()
        );
        return response.data.token;

    } catch (error) {
        console.error("Error fetching invitation code: ", error.response?.data?.message || error.message);
        throw new Error(error.response?.data?.message || "Could not fetch invitation code.");
    }
}

// Add these functions to your existing adminService.js

// Get authentication token from localStorage or wherever you store it
const getAuthToken = () => {
    return localStorage.getItem('authToken'); // Adjust based on your auth implementation
};

// Get all syllabuses
export const getSyllabuses = async () => {
    try {
        const response = await axios.get(
            '/api/admin/syllabuses',
            getAuthConfig()
        );
        return response.data.data;
    } catch (error) {
        console.error('Error in getSyllabuses:', error);
        throw error;
    }
};

// Get single syllabus by ID
export const getSyllabusById = async (syllabusId) => {
    try {
        const token = getAuthToken();
        const response = await fetch(`/api/admin/syllabuses/${syllabusId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch syllabus');
        }

        const result = await response.json();
        return result.data;
    } catch (error) {
        console.error('Error in getSyllabusById:', error);
        throw error;
    }
};

// Upload new syllabus
// Upload new syllabus (JSON)
export const uploadSyllabus = async ({ grade, subject, syllabusData }) => {
    try {
        const token = getAuthToken();
        const response = await fetch('/api/admin/syllabuses', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ grade, subject, syllabusData }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to upload syllabus');
        }

        return await response.json();
    } catch (error) {
        console.error('Error in uploadSyllabus:', error);
        throw error;
    }
};

// Delete syllabus
export const deleteSyllabus = async (syllabusId) => {
    try {
        const token = getAuthToken();
        const response = await fetch(`/api/admin/syllabuses/${syllabusId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete syllabus');
        }

        return await response.json();
    } catch (error) {
        console.error('Error in deleteSyllabus:', error);
        throw error;
    }
};

// Update syllabus
export const updateSyllabus = async (syllabusId, syllabusData) => {
    try {
        const token = getAuthToken();
        const formData = new FormData();

        if (syllabusData.grade) {
            formData.append('grade', syllabusData.grade);
        }
        if (syllabusData.subject) {
            formData.append('subject', syllabusData.subject);
        }
        if (syllabusData.file) {
            formData.append('file', syllabusData.file);
        }

        const response = await fetch(`/api/admin/syllabuses/${syllabusId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
                // Don't set Content-Type for FormData
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update syllabus');
        }

        return await response.json();
    } catch (error) {
        console.error('Error in updateSyllabus:', error);
        throw error;
    }
};

// Get Teacher Analytics
export const getTeacherAnalytics = async (teacherId) => {
    try {
        const response = await axios.get(
            `/api/admin/teachers/${teacherId}/analytics`,
            getAuthConfig()
        );
        return response.data.data;
    } catch (error) {
        console.error("Error fetching teacher analytics:", error.response?.data?.message || error.message);
        throw new Error(error.response?.data?.message || "Could not fetch teacher analytics.");
    }
};

// Extract Syllabus Structure using AI
// Extract Syllabus Structure using AI
// Extract Syllabus Data using AI (based on provided schema)
export const extractSyllabusData = async (file, schema) => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('schema', JSON.stringify(schema));

        const response = await axios.post(
            '/api/admin/syllabuses/extract-data',
            formData,
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                    // "Content-Type": "multipart/form-data" <-- REMOVED: Let browser set boundary
                }
            }
        );

        return { data: response.data.data };
    } catch (error) {
        console.error('Error in extractSyllabusData:', error);
        throw error;
    }
};

// Invite Teacher via Email
export const inviteTeacher = async (email) => {
    try {
        const response = await axios.post(
            `/api/admin/invite`,
            { email },
            getAuthConfig()
        );
        return response.data;
    } catch (error) {
        console.error("Error inviting teacher:", error.response?.data?.message || error.message);
        throw new Error(error.response?.data?.message || "Could not send invitation.");
    }
};

// Get Active Tokens for Pending Invites
export const getActiveTokens = async () => {
    try {
        const response = await axios.get(
            `/api/admin/tokens/active`,
            getAuthConfig()
        );
        return response.data.data;
    } catch (error) {
        console.error("Error fetching active tokens:", error.response?.data?.message || error.message);
        throw new Error(error.response?.data?.message || "Could not fetch active tokens.");
    }
};

// Delete Teacher
export const deleteTeacher = async (teacherId) => {
    try {
        const response = await axios.delete(
            `/api/admin/teachers/${teacherId}`,
            getAuthConfig()
        );
        return response.data;
    } catch (error) {
        console.error('Error deleting teacher:', error.response?.data?.message || error.message);
        throw new Error(error.response?.data?.message || 'Could not delete teacher.');
    }
};

// Toggle Teacher Status (Activate/Deactivate)
export const toggleTeacherStatus = async (teacherId) => {
    try {
        const response = await axios.put(
            `/api/admin/teachers/${teacherId}/status`,
            {},
            getAuthConfig()
        );
        return response.data;
    } catch (error) {
        console.error('Error toggling teacher status:', error.response?.data?.message || error.message);
        throw new Error(error.response?.data?.message || 'Could not toggle teacher status.');
    }
};

// Revoke a registration token
export const revokeToken = async (tokenId) => {
    try {
        const response = await axios.delete(
            `/api/admin/tokens/${tokenId}`,
            getAuthConfig()
        );
        return response.data;
    } catch (error) {
        console.error('Error revoking token:', error.response?.data?.message || error.message);
        throw new Error(error.response?.data?.message || 'Could not revoke token.');
    }
};

// Resend invitation email
export const resendInvite = async (tokenId, email) => {
    try {
        const response = await axios.post(
            `/api/admin/tokens/${tokenId}/resend`,
            { email },
            getAuthConfig()
        );
        return response.data;
    } catch (error) {
        console.error('Error resending invite:', error.response?.data?.message || error.message);
        throw new Error(error.response?.data?.message || 'Could not resend invite.');
    }
};

// Update teacher's role
export const updateTeacherRole = async (teacherId, roles) => {
    try {
        const response = await axios.put(
            `/api/admin/teachers/${teacherId}/role`,
            { roles },
            getAuthConfig()
        );
        return response.data;
    } catch (error) {
        console.error('Error updating teacher role:', error.response?.data?.message || error.message);
        throw new Error(error.response?.data?.message || 'Could not update teacher role.');
    }
};