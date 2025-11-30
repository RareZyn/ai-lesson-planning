/**
 * Offline Assessment Service
 *
 * Service layer that handles assessment operations with offline support
 * Falls back to local cache when offline, queues actions for sync when back online
 */

import api from '../api';
import { assessmentOfflineService } from './assessmentOfflineService';
import { rubricOfflineService } from './rubricOfflineService';
import { queueAction, ACTION_TYPES } from './offlineQueueService';
import networkStatus from '../networkStatus';

/**
 * Get assessment by ID (offline-aware)
 */
export async function getAssessment(assessmentId, forceOnline = false) {
  try {
    const isOnline = networkStatus.isOnline();

    if (isOnline && !forceOnline) {
      try {
        const response = await api.get(`/assessment/${assessmentId}`);
        // Save to offline cache
        await assessmentOfflineService.saveAssessmentOffline(response.data);
        return { data: response.data, source: 'online' };
      } catch (error) {
        console.log('Network request failed, falling back to cache');
      }
    }

    // Get from offline cache
    const cachedAssessment = await assessmentOfflineService.getAssessmentOffline(assessmentId);

    if (cachedAssessment) {
      return { data: cachedAssessment, source: 'offline' };
    }

    if (!isOnline) {
      throw new Error('Assessment not available offline. Please connect to the internet.');
    }

    throw new Error('Assessment not found');

  } catch (error) {
    console.error('Error getting assessment:', error);
    throw error;
  }
}

/**
 * Get all assessments (offline-aware)
 */
export async function getAllAssessments(forceOnline = false) {
  try {
    const isOnline = networkStatus.isOnline();

    if (isOnline && !forceOnline) {
      try {
        const response = await api.get('/assessment');
        if (response.data && Array.isArray(response.data)) {
          // Save all to cache
          for (const assessment of response.data) {
            await assessmentOfflineService.saveAssessmentOffline(assessment);
          }
        }
        return { data: response.data, source: 'online' };
      } catch (error) {
        console.log('Network request failed, falling back to cache');
      }
    }

    const cachedAssessments = await assessmentOfflineService.getAllAssessmentsOffline();
    return { data: cachedAssessments, source: 'offline' };

  } catch (error) {
    console.error('Error getting all assessments:', error);
    throw error;
  }
}

/**
 * Get assessments by lesson ID (offline-aware)
 */
export async function getAssessmentsByLesson(lessonId, forceOnline = false) {
  try {
    const isOnline = networkStatus.isOnline();

    if (isOnline && !forceOnline) {
      try {
        const response = await api.get(`/assessment/lesson/${lessonId}`);
        if (response.data && Array.isArray(response.data)) {
          for (const assessment of response.data) {
            await assessmentOfflineService.saveAssessmentOffline(assessment);
          }
        }
        return { data: response.data, source: 'online' };
      } catch (error) {
        console.log('Network request failed, falling back to cache');
      }
    }

    const cachedAssessments = await assessmentOfflineService.getAssessmentsByLesson(lessonId);
    return { data: cachedAssessments, source: 'offline' };

  } catch (error) {
    console.error('Error getting assessments by lesson:', error);
    throw error;
  }
}

/**
 * Get assessments by class ID (offline-aware)
 */
export async function getAssessmentsByClass(classId, forceOnline = false) {
  try {
    const isOnline = networkStatus.isOnline();

    if (isOnline && !forceOnline) {
      try {
        const response = await api.get(`/assessment/class/${classId}`);
        if (response.data && Array.isArray(response.data)) {
          for (const assessment of response.data) {
            await assessmentOfflineService.saveAssessmentOffline(assessment);
          }
        }
        return { data: response.data, source: 'online' };
      } catch (error) {
        console.log('Network request failed, falling back to cache');
      }
    }

    const cachedAssessments = await assessmentOfflineService.getAssessmentsByClass(classId);
    return { data: cachedAssessments, source: 'offline' };

  } catch (error) {
    console.error('Error getting assessments by class:', error);
    throw error;
  }
}

/**
 * Create assessment (requires online - AI generation)
 */
export async function createAssessment(assessmentData) {
  try {
    const isOnline = networkStatus.isOnline();

    if (!isOnline) {
      throw new Error('Cannot create assessments offline. AI generation requires internet connection.');
    }

    const response = await api.post('/assessment/generate', assessmentData);
    // Save to cache
    await assessmentOfflineService.saveAssessmentOffline(response.data);
    return { data: response.data, source: 'online' };

  } catch (error) {
    console.error('Error creating assessment:', error);
    throw error;
  }
}

/**
 * Update assessment (offline-aware)
 */
export async function updateAssessment(assessmentId, updates) {
  try {
    const isOnline = networkStatus.isOnline();

    if (isOnline) {
      const response = await api.put(`/assessment/${assessmentId}`, updates);
      await assessmentOfflineService.updateAssessmentOffline(assessmentId, response.data);
      return { data: response.data, source: 'online', queued: false };
    }

    // Offline: update locally and queue
    const updatedAssessment = await assessmentOfflineService.updateAssessmentOffline(assessmentId, {
      ...updates,
      syncStatus: 'pending',
      lastModified: new Date().toISOString()
    });

    await queueAction(ACTION_TYPES.UPDATE_ASSESSMENT, {
      assessmentId,
      updates
    }, {
      description: 'Update assessment',
      displayName: updates.title || 'Assessment Update'
    });

    return {
      data: updatedAssessment,
      source: 'offline',
      queued: true,
      message: 'Changes will sync when you\'re back online'
    };

  } catch (error) {
    console.error('Error updating assessment:', error);
    throw error;
  }
}

/**
 * Delete assessment (offline-aware)
 */
export async function deleteAssessment(assessmentId) {
  try {
    const isOnline = networkStatus.isOnline();

    if (isOnline) {
      await api.delete(`/assessment/${assessmentId}`);
      await assessmentOfflineService.deleteAssessmentOffline(assessmentId);
      // Also delete related rubrics
      await rubricOfflineService.deleteRubricsByAssessment(assessmentId);
      return { success: true, source: 'online', queued: false };
    }

    // Offline: mark for deletion and queue
    await assessmentOfflineService.updateAssessmentOffline(assessmentId, {
      _deleted: true,
      syncStatus: 'pending-deletion',
      deletedAt: new Date().toISOString()
    });

    await queueAction(ACTION_TYPES.DELETE_ASSESSMENT, {
      assessmentId
    }, {
      description: 'Delete assessment'
    });

    return {
      success: true,
      source: 'offline',
      queued: true,
      message: 'Assessment will be deleted when you\'re back online'
    };

  } catch (error) {
    console.error('Error deleting assessment:', error);
    throw error;
  }
}

/**
 * Regenerate assessment (requires online - AI generation)
 */
export async function regenerateAssessment(assessmentId) {
  try {
    const isOnline = networkStatus.isOnline();

    if (!isOnline) {
      throw new Error('Cannot regenerate assessments offline. AI generation requires internet connection.');
    }

    const response = await api.post(`/assessment/${assessmentId}/regenerate`);
    await assessmentOfflineService.updateAssessmentOffline(assessmentId, response.data);
    return { data: response.data, source: 'online' };

  } catch (error) {
    console.error('Error regenerating assessment:', error);
    throw error;
  }
}

/**
 * Search assessments (offline-aware)
 */
export async function searchAssessments(query, forceOnline = false) {
  try {
    const isOnline = networkStatus.isOnline();

    if (isOnline && !forceOnline) {
      try {
        const response = await api.get(`/assessment/search?q=${encodeURIComponent(query)}`);
        return { data: response.data, source: 'online' };
      } catch (error) {
        console.log('Network search failed, searching offline cache');
      }
    }

    const results = await assessmentOfflineService.searchAssessmentsOffline(query);
    return { data: results, source: 'offline' };

  } catch (error) {
    console.error('Error searching assessments:', error);
    throw error;
  }
}

/**
 * Get assessments by type (offline-aware)
 */
export async function getAssessmentsByType(type) {
  try {
    const isOnline = networkStatus.isOnline();

    if (isOnline) {
      try {
        const response = await api.get(`/assessment/type/${type}`);
        if (response.data && Array.isArray(response.data)) {
          for (const assessment of response.data) {
            await assessmentOfflineService.saveAssessmentOffline(assessment);
          }
        }
        return { data: response.data, source: 'online' };
      } catch (error) {
        console.log('Network request failed, falling back to cache');
      }
    }

    const cachedAssessments = await assessmentOfflineService.getAssessmentsByType(type);
    return { data: cachedAssessments, source: 'offline' };

  } catch (error) {
    console.error('Error getting assessments by type:', error);
    throw error;
  }
}

/**
 * Get assessment statistics (offline-aware)
 */
export async function getAssessmentStats() {
  return await assessmentOfflineService.getAssessmentStats();
}

/**
 * Check if assessment is available offline
 */
export async function isAssessmentAvailableOffline(assessmentId) {
  try {
    const assessment = await assessmentOfflineService.getAssessmentOffline(assessmentId);
    return assessment !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Get assessments with generated content (offline-aware)
 */
export async function getAssessmentsWithContent() {
  return await assessmentOfflineService.getAssessmentsWithContent();
}

export default {
  getAssessment,
  getAllAssessments,
  getAssessmentsByLesson,
  getAssessmentsByClass,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  regenerateAssessment,
  searchAssessments,
  getAssessmentsByType,
  getAssessmentStats,
  isAssessmentAvailableOffline,
  getAssessmentsWithContent,
};
