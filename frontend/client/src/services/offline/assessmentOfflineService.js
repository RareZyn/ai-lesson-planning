/**
 * Assessment Offline Service
 * Specialized CRUD operations for assessments in IndexedDB
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

const STORE_NAME = STORES.ASSESSMENTS;

/**
 * Save an assessment for offline access
 * @param {object} assessment - Assessment data from API
 */
export async function saveAssessmentOffline(assessment) {
  try {
    // Check if assessment already exists
    const existing = await getItem(STORE_NAME, assessment._id);

    if (existing) {
      // Update existing assessment
      return await updateItem(STORE_NAME, {
        ...assessment,
        lastModified: new Date().toISOString()
      });
    } else {
      // Add new assessment
      return await addItem(STORE_NAME, assessment);
    }
  } catch (error) {
    console.error('[AssessmentOffline] Error saving assessment:', error);
    throw error;
  }
}

/**
 * Get an assessment from offline storage
 * @param {string} assessmentId - Assessment ID
 */
export async function getAssessmentOffline(assessmentId) {
  try {
    return await getItem(STORE_NAME, assessmentId);
  } catch (error) {
    console.error('[AssessmentOffline] Error getting assessment:', error);
    throw error;
  }
}

/**
 * Get all offline assessments
 */
export async function getAllAssessmentsOffline() {
  try {
    return await getAllItems(STORE_NAME);
  } catch (error) {
    console.error('[AssessmentOffline] Error getting all assessments:', error);
    throw error;
  }
}

/**
 * Get assessments by lesson plan ID
 * @param {string} lessonPlanId - Lesson plan ID
 */
export async function getAssessmentsByLesson(lessonPlanId) {
  try {
    return await getByIndex(STORE_NAME, 'lessonPlanId', lessonPlanId);
  } catch (error) {
    console.error('[AssessmentOffline] Error getting assessments by lesson:', error);
    throw error;
  }
}

/**
 * Get assessments by class ID
 * @param {string} classId - Class ID
 */
export async function getAssessmentsByClass(classId) {
  try {
    return await getByIndex(STORE_NAME, 'classId', classId);
  } catch (error) {
    console.error('[AssessmentOffline] Error getting assessments by class:', error);
    throw error;
  }
}

/**
 * Get assessments by type
 * @param {string} assessmentType - Type of assessment (assessment, essay, textbook, activity, etc.)
 */
export async function getAssessmentsByType(assessmentType) {
  try {
    return await getByIndex(STORE_NAME, 'assessmentType', assessmentType);
  } catch (error) {
    console.error('[AssessmentOffline] Error getting assessments by type:', error);
    throw error;
  }
}

/**
 * Delete an assessment from offline storage
 * @param {string} assessmentId - Assessment ID
 */
export async function deleteAssessmentOffline(assessmentId) {
  try {
    return await deleteItem(STORE_NAME, assessmentId);
  } catch (error) {
    console.error('[AssessmentOffline] Error deleting assessment:', error);
    throw error;
  }
}

/**
 * Update assessment offline
 * @param {string} assessmentId - Assessment ID
 * @param {object} updates - Fields to update
 */
export async function updateAssessmentOffline(assessmentId, updates) {
  try {
    const existing = await getItem(STORE_NAME, assessmentId);
    if (!existing) {
      throw new Error('Assessment not found in offline storage');
    }

    return await updateItem(STORE_NAME, {
      ...existing,
      ...updates,
      lastModified: new Date().toISOString()
    });
  } catch (error) {
    console.error('[AssessmentOffline] Error updating assessment:', error);
    throw error;
  }
}

/**
 * Batch save multiple assessments
 * @param {array} assessments - Array of assessments
 */
export async function saveAssessmentsBatch(assessments) {
  try {
    return await addBatch(STORE_NAME, assessments);
  } catch (error) {
    console.error('[AssessmentOffline] Error batch saving assessments:', error);
    throw error;
  }
}

/**
 * Check if an assessment is available offline
 * @param {string} assessmentId - Assessment ID
 */
export async function isAssessmentOffline(assessmentId) {
  try {
    const assessment = await getItem(STORE_NAME, assessmentId);
    return !!assessment;
  } catch (error) {
    console.error('[AssessmentOffline] Error checking assessment offline status:', error);
    return false;
  }
}

/**
 * Get count of offline assessments
 */
export async function getOfflineAssessmentCount() {
  try {
    return await countItems(STORE_NAME);
  } catch (error) {
    console.error('[AssessmentOffline] Error counting assessments:', error);
    throw error;
  }
}

/**
 * Search assessments offline (simple text search)
 * @param {string} query - Search query
 */
export async function searchAssessmentsOffline(query) {
  try {
    const allAssessments = await getAllItems(STORE_NAME);
    const lowerQuery = query.toLowerCase();

    return allAssessments.filter(assessment => {
      return (
        assessment.title?.toLowerCase().includes(lowerQuery) ||
        assessment.description?.toLowerCase().includes(lowerQuery) ||
        assessment.activityType?.toLowerCase().includes(lowerQuery)
      );
    });
  } catch (error) {
    console.error('[AssessmentOffline] Error searching assessments:', error);
    throw error;
  }
}

/**
 * Get recently downloaded assessments
 * @param {number} limit - Number of assessments to return
 */
export async function getRecentlyDownloaded(limit = 10) {
  try {
    const allAssessments = await getAllItems(STORE_NAME);
    return allAssessments
      .sort((a, b) => new Date(b.downloadedAt) - new Date(a.downloadedAt))
      .slice(0, limit);
  } catch (error) {
    console.error('[AssessmentOffline] Error getting recent assessments:', error);
    throw error;
  }
}

/**
 * Get assessments with generated content
 * Filters assessments that have actual content generated
 */
export async function getAssessmentsWithContent() {
  try {
    const allAssessments = await getAllItems(STORE_NAME);
    return allAssessments.filter(assessment => {
      return assessment.generatedContent &&
        (assessment.generatedContent.activityContent ||
         assessment.generatedContent.assessmentContent ||
         assessment.generatedContent.essayContent ||
         assessment.generatedContent.examContent);
    });
  } catch (error) {
    console.error('[AssessmentOffline] Error getting assessments with content:', error);
    throw error;
  }
}

/**
 * Get assessment statistics
 */
export async function getAssessmentStats() {
  try {
    const allAssessments = await getAllItems(STORE_NAME);

    const stats = {
      total: allAssessments.length,
      byType: {},
      withContent: 0,
      totalSize: 0
    };

    allAssessments.forEach(assessment => {
      // Count by type
      const type = assessment.assessmentType || 'unknown';
      stats.byType[type] = (stats.byType[type] || 0) + 1;

      // Count assessments with content
      if (assessment.generatedContent) {
        stats.withContent++;
      }

      // Estimate size (rough calculation)
      stats.totalSize += JSON.stringify(assessment).length;
    });

    stats.totalSizeKB = (stats.totalSize / 1024).toFixed(2);
    stats.totalSizeMB = (stats.totalSize / (1024 * 1024)).toFixed(2);

    return stats;
  } catch (error) {
    console.error('[AssessmentOffline] Error getting assessment stats:', error);
    throw error;
  }
}

export default {
  saveAssessmentOffline,
  getAssessmentOffline,
  getAllAssessmentsOffline,
  getAssessmentsByLesson,
  getAssessmentsByClass,
  getAssessmentsByType,
  deleteAssessmentOffline,
  updateAssessmentOffline,
  saveAssessmentsBatch,
  isAssessmentOffline,
  getOfflineAssessmentCount,
  searchAssessmentsOffline,
  getRecentlyDownloaded,
  getAssessmentsWithContent,
  getAssessmentStats
};
