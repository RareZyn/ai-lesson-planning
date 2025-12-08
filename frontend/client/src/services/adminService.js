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
export const extractSyllabusStructure = async (file) => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post(
            '/api/admin/syllabuses/extract-structure',
            formData,
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                    // "Content-Type": "multipart/form-data" <-- REMOVED: Let browser set boundary
                }
            }
        );

        return { schema: response.data.schema, data: response.data.data };
    } catch (error) {
        console.error('Error in extractSyllabusStructure:', error);
        throw error;
    }
};