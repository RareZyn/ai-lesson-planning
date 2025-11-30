/**
 * Rubric Offline Service
 * Specialized CRUD operations for rubrics in IndexedDB
 * Rubrics are often part of assessments but stored separately for quick access
 */

import {
  addItem,
  updateItem,
  getItem,
  getAllItems,
  deleteItem,
  getByIndex,
  countItems,
  addBatch,
  STORES
} from '../indexedDB';

const STORE_NAME = STORES.RUBRICS;

/**
 * Save a rubric for offline access
 * @param {object} rubric - Rubric data
 */
export async function saveRubricOffline(rubric) {
  try {
    // Check if rubric already exists
    const existing = await getItem(STORE_NAME, rubric._id);

    if (existing) {
      // Update existing rubric
      return await updateItem(STORE_NAME, {
        ...rubric,
        lastModified: new Date().toISOString()
      });
    } else {
      // Add new rubric
      return await addItem(STORE_NAME, rubric);
    }
  } catch (error) {
    console.error('[RubricOffline] Error saving rubric:', error);
    throw error;
  }
}

/**
 * Get a rubric from offline storage
 * @param {string} rubricId - Rubric ID
 */
export async function getRubricOffline(rubricId) {
  try {
    return await getItem(STORE_NAME, rubricId);
  } catch (error) {
    console.error('[RubricOffline] Error getting rubric:', error);
    throw error;
  }
}

/**
 * Get all offline rubrics
 */
export async function getAllRubricsOffline() {
  try {
    return await getAllItems(STORE_NAME);
  } catch (error) {
    console.error('[RubricOffline] Error getting all rubrics:', error);
    throw error;
  }
}

/**
 * Get rubrics by assessment ID
 * @param {string} assessmentId - Assessment ID
 */
export async function getRubricsByAssessment(assessmentId) {
  try {
    return await getByIndex(STORE_NAME, 'assessmentId', assessmentId);
  } catch (error) {
    console.error('[RubricOffline] Error getting rubrics by assessment:', error);
    throw error;
  }
}

/**
 * Delete a rubric from offline storage
 * @param {string} rubricId - Rubric ID
 */
export async function deleteRubricOffline(rubricId) {
  try {
    return await deleteItem(STORE_NAME, rubricId);
  } catch (error) {
    console.error('[RubricOffline] Error deleting rubric:', error);
    throw error;
  }
}

/**
 * Update rubric offline
 * @param {string} rubricId - Rubric ID
 * @param {object} updates - Fields to update
 */
export async function updateRubricOffline(rubricId, updates) {
  try {
    const existing = await getItem(STORE_NAME, rubricId);
    if (!existing) {
      throw new Error('Rubric not found in offline storage');
    }

    return await updateItem(STORE_NAME, {
      ...existing,
      ...updates,
      lastModified: new Date().toISOString()
    });
  } catch (error) {
    console.error('[RubricOffline] Error updating rubric:', error);
    throw error;
  }
}

/**
 * Batch save multiple rubrics
 * @param {array} rubrics - Array of rubrics
 */
export async function saveRubricsBatch(rubrics) {
  try {
    return await addBatch(STORE_NAME, rubrics);
  } catch (error) {
    console.error('[RubricOffline] Error batch saving rubrics:', error);
    throw error;
  }
}

/**
 * Check if a rubric is available offline
 * @param {string} rubricId - Rubric ID
 */
export async function isRubricOffline(rubricId) {
  try {
    const rubric = await getItem(STORE_NAME, rubricId);
    return !!rubric;
  } catch (error) {
    console.error('[RubricOffline] Error checking rubric offline status:', error);
    return false;
  }
}

/**
 * Get count of offline rubrics
 */
export async function getOfflineRubricCount() {
  try {
    return await countItems(STORE_NAME);
  } catch (error) {
    console.error('[RubricOffline] Error counting rubrics:', error);
    throw error;
  }
}

/**
 * Search rubrics offline (simple text search)
 * @param {string} query - Search query
 */
export async function searchRubricsOffline(query) {
  try {
    const allRubrics = await getAllItems(STORE_NAME);
    const lowerQuery = query.toLowerCase();

    return allRubrics.filter(rubric => {
      return (
        rubric.title?.toLowerCase().includes(lowerQuery) ||
        rubric.description?.toLowerCase().includes(lowerQuery) ||
        JSON.stringify(rubric.criteria).toLowerCase().includes(lowerQuery)
      );
    });
  } catch (error) {
    console.error('[RubricOffline] Error searching rubrics:', error);
    throw error;
  }
}

/**
 * Delete rubrics by assessment ID
 * Useful when an assessment is deleted
 * @param {string} assessmentId - Assessment ID
 */
export async function deleteRubricsByAssessment(assessmentId) {
  try {
    const rubrics = await getRubricsByAssessment(assessmentId);
    const deletePromises = rubrics.map(rubric => deleteItem(STORE_NAME, rubric._id));
    await Promise.all(deletePromises);
    return rubrics.length;
  } catch (error) {
    console.error('[RubricOffline] Error deleting rubrics by assessment:', error);
    throw error;
  }
}

export default {
  saveRubricOffline,
  getRubricOffline,
  getAllRubricsOffline,
  getRubricsByAssessment,
  deleteRubricOffline,
  updateRubricOffline,
  saveRubricsBatch,
  isRubricOffline,
  getOfflineRubricCount,
  searchRubricsOffline,
  deleteRubricsByAssessment
};
