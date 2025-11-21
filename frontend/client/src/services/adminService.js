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
    console.log(response.data.token);
    return response.data.token;

  } catch (error) {
    console.error("Error fetching invitation code: ", error.response?.data?.message || error.message);
    throw new Error(error.response?.data?.message || "Could not fetch invitation code.");
  }
}