// frontend/client/src/services/syncApiService.js
// PHASE 6: Frontend Sync API Service
// Handles communication with backend sync endpoints

import api from "./api";

/**
 * Get updates from server since a specific timestamp
 * @param {string} since - ISO timestamp
 * @param {string[]} types - Array of types to sync (lessons, assessments, classes, students)
 * @returns {Promise<Object>} Updates data
 */
export const getUpdatesSince = async (since, types = ["lessons", "assessments", "classes", "students"]) => {
  try {
    const response = await api.get("/sync/updates", {
      params: {
        since,
        types: types.join(","),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error getting updates:", error);
    throw error;
  }
};

/**
 * Upload batch of offline changes to server
 * @param {Object} data - Object containing arrays of lessons, assessments, classes, students
 * @returns {Promise<Object>} Batch upload results
 */
export const batchUploadChanges = async (data) => {
  try {
    const response = await api.post("/sync/batch-upload", data);
    return response.data;
  } catch (error) {
    console.error("Error in batch upload:", error);
    throw error;
  }
};

/**
 * Check for conflicts before syncing
 * @param {Object} data - Object containing arrays of lessons, assessments, classes, students
 * @returns {Promise<Object>} Conflict check results
 */
export const checkConflicts = async (data) => {
  try {
    const response = await api.post("/sync/check-conflicts", data);
    return response.data;
  } catch (error) {
    console.error("Error checking conflicts:", error);
    throw error;
  }
};

/**
 * Resolve a specific conflict
 * @param {string} type - Resource type (lesson, assessment, class, student)
 * @param {string} id - Resource ID
 * @param {string} resolution - Resolution strategy (SERVER_WINS, LOCAL_WINS, MERGE)
 * @param {Object} data - Resolved data
 * @returns {Promise<Object>} Resolved resource
 */
export const resolveConflict = async (type, id, resolution, data) => {
  try {
    const response = await api.post("/sync/resolve-conflict", {
      type,
      id,
      resolution,
      data,
    });
    return response.data;
  } catch (error) {
    console.error("Error resolving conflict:", error);
    throw error;
  }
};

/**
 * Get current sync status for user
 * @returns {Promise<Object>} Sync status data
 */
export const getSyncStatus = async () => {
  try {
    const response = await api.get("/sync/status");
    return response.data;
  } catch (error) {
    console.error("Error getting sync status:", error);
    throw error;
  }
};

/**
 * Perform a full synchronization
 * @param {string} lastSyncTimestamp - Last sync timestamp (ISO string)
 * @returns {Promise<Object>} Full sync results
 */
export const performFullSync = async (lastSyncTimestamp) => {
  // This is a composite operation that:
  // 1. Gets pending local changes
  // 2. Checks for conflicts
  // 3. Uploads changes (if no conflicts)
  // 4. Downloads server updates
  // 5. Returns comprehensive results

  // Implementation will be in syncService.js which orchestrates this
  // This is just the API wrapper
  return {
    success: true,
    message: "Use syncService.sync() for full sync orchestration",
  };
};

const syncApiService = {
  getUpdatesSince,
  batchUploadChanges,
  checkConflicts,
  resolveConflict,
  getSyncStatus,
  performFullSync,
};

export default syncApiService;
