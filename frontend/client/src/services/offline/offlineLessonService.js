/**
 * Offline Lesson Service
 *
 * Service layer that handles lesson operations with offline support
 * Falls back to local cache when offline, queues actions for sync when back online
 */

import api from '../api';
import lessonOfflineService from './lessonOfflineService';
import { queueAction, ACTION_TYPES } from './offlineQueueService';
import networkStatus from '../networkStatus';

/**
 * Get a lesson by ID (offline-aware)
 */
export async function getLesson(lessonId, forceOnline = false) {
  try {
    const isOnline = networkStatus.isOnline();

    if (isOnline && !forceOnline) {
      // Try network first
      try {
        const response = await api.get(`/lessons/${lessonId}`);
        // Save to offline cache for future use
        await lessonOfflineService.saveLessonOffline(response.data);
        return { data: response.data, source: 'online' };
      } catch (error) {
        // If network fails, fall back to cache
        console.log('Network request failed, falling back to cache');
      }
    }

    // Get from offline cache
    const cachedLesson = await lessonOfflineService.getLessonOffline(lessonId);

    if (cachedLesson) {
      return { data: cachedLesson, source: 'offline' };
    }

    // No cache available and offline
    if (!isOnline) {
      throw new Error('Lesson not available offline. Please connect to the internet.');
    }

    throw new Error('Lesson not found');

  } catch (error) {
    console.error('Error getting lesson:', error);
    throw error;
  }
}

/**
 * Get all lessons for a user (offline-aware)
 */
export async function getAllLessons(forceOnline = false) {
  try {
    const isOnline = networkStatus.isOnline();

    if (isOnline && !forceOnline) {
      try {
        const response = await api.get('/lessons');
        // Update offline cache
        if (response.data && Array.isArray(response.data)) {
          await lessonOfflineService.saveLessonsBatch(response.data);
        }
        return { data: response.data, source: 'online' };
      } catch (error) {
        console.log('Network request failed, falling back to cache');
      }
    }

    // Get from offline cache
    const cachedLessons = await lessonOfflineService.getAllLessonsOffline();
    return { data: cachedLessons, source: 'offline' };

  } catch (error) {
    console.error('Error getting all lessons:', error);
    throw error;
  }
}

/**
 * Get lessons by class ID (offline-aware)
 */
export async function getLessonsByClass(classId, forceOnline = false) {
  try {
    const isOnline = networkStatus.isOnline();

    if (isOnline && !forceOnline) {
      try {
        const response = await api.get(`/lessons/class/${classId}`);
        if (response.data && Array.isArray(response.data)) {
          await lessonOfflineService.saveLessonsBatch(response.data);
        }
        return { data: response.data, source: 'online' };
      } catch (error) {
        console.log('Network request failed, falling back to cache');
      }
    }

    const cachedLessons = await lessonOfflineService.getLessonsByClass(classId);
    return { data: cachedLessons, source: 'offline' };

  } catch (error) {
    console.error('Error getting lessons by class:', error);
    throw error;
  }
}

/**
 * Create a new lesson (offline-aware)
 */
export async function createLesson(lessonData) {
  try {
    const isOnline = networkStatus.isOnline();

    if (isOnline) {
      // Create online
      const response = await api.post('/lessons', lessonData);
      // Save to cache
      await lessonOfflineService.saveLessonOffline(response.data);
      return { data: response.data, source: 'online', queued: false };
    }

    // Offline: create temporary lesson and queue action
    const tempLesson = {
      _id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...lessonData,
      createdAt: new Date().toISOString(),
      isTemporary: true,
      syncStatus: 'pending'
    };

    // Save temporary lesson locally
    await lessonOfflineService.saveLessonOffline(tempLesson);

    // Queue create action
    await queueAction(ACTION_TYPES.CREATE_LESSON, {
      tempId: tempLesson._id,
      lessonData
    }, {
      description: 'Create new lesson plan',
      displayName: lessonData.lessonTitle || 'New Lesson'
    });

    return {
      data: tempLesson,
      source: 'offline',
      queued: true,
      message: 'Lesson will be created when you\'re back online'
    };

  } catch (error) {
    console.error('Error creating lesson:', error);
    throw error;
  }
}

/**
 * Update a lesson (offline-aware)
 */
export async function updateLesson(lessonId, updates) {
  try {
    const isOnline = networkStatus.isOnline();

    if (isOnline) {
      // Update online
      const response = await api.put(`/lessons/${lessonId}`, updates);
      // Update cache
      await lessonOfflineService.updateLessonOffline(lessonId, response.data);
      return { data: response.data, source: 'online', queued: false };
    }

    // Offline: update locally and queue action
    const updatedLesson = await lessonOfflineService.updateLessonOffline(lessonId, {
      ...updates,
      syncStatus: 'pending',
      lastModified: new Date().toISOString()
    });

    // Queue update action
    await queueAction(ACTION_TYPES.UPDATE_LESSON, {
      lessonId,
      updates
    }, {
      description: 'Update lesson plan',
      displayName: updates.lessonTitle || 'Lesson Update'
    });

    return {
      data: updatedLesson,
      source: 'offline',
      queued: true,
      message: 'Changes will sync when you\'re back online'
    };

  } catch (error) {
    console.error('Error updating lesson:', error);
    throw error;
  }
}

/**
 * Delete a lesson (offline-aware)
 */
export async function deleteLesson(lessonId) {
  try {
    const isOnline = networkStatus.isOnline();

    if (isOnline) {
      // Delete online
      await api.delete(`/lessons/${lessonId}`);
      // Delete from cache
      await lessonOfflineService.deleteLessonOffline(lessonId);
      return { success: true, source: 'online', queued: false };
    }

    // Offline: mark for deletion and queue action
    await lessonOfflineService.updateLessonOffline(lessonId, {
      _deleted: true,
      syncStatus: 'pending-deletion',
      deletedAt: new Date().toISOString()
    });

    // Queue delete action
    await queueAction(ACTION_TYPES.DELETE_LESSON, {
      lessonId
    }, {
      description: 'Delete lesson plan'
    });

    return {
      success: true,
      source: 'offline',
      queued: true,
      message: 'Lesson will be deleted when you\'re back online'
    };

  } catch (error) {
    console.error('Error deleting lesson:', error);
    throw error;
  }
}

/**
 * Share lesson to community (offline-aware)
 */
export async function shareToCommunity(lessonId, shareData) {
  try {
    const isOnline = networkStatus.isOnline();

    if (!isOnline) {
      // Queue for later
      await queueAction(ACTION_TYPES.SHARE_LESSON, {
        lessonId,
        data: shareData
      }, {
        description: 'Share lesson to community'
      });

      return {
        success: true,
        queued: true,
        message: 'Lesson will be shared when you\'re back online'
      };
    }

    const response = await api.post(`/lessons/${lessonId}/share`, shareData);
    return { data: response.data, source: 'online', queued: false };

  } catch (error) {
    console.error('Error sharing lesson:', error);
    throw error;
  }
}

/**
 * Add bookmark (offline-aware)
 */
export async function addBookmark(lessonId) {
  try {
    const isOnline = networkStatus.isOnline();

    if (isOnline) {
      await api.post('/auth/bookmarks/add', { lessonId });
      return { success: true, source: 'online', queued: false };
    }

    // Queue for later
    await queueAction(ACTION_TYPES.ADD_BOOKMARK, {
      lessonId
    }, {
      description: 'Add bookmark'
    });

    return {
      success: true,
      queued: true,
      message: 'Bookmark will be added when you\'re back online'
    };

  } catch (error) {
    console.error('Error adding bookmark:', error);
    throw error;
  }
}

/**
 * Remove bookmark (offline-aware)
 */
export async function removeBookmark(lessonId) {
  try {
    const isOnline = networkStatus.isOnline();

    if (isOnline) {
      await api.post('/auth/bookmarks/remove', { lessonId });
      return { success: true, source: 'online', queued: false };
    }

    // Queue for later
    await queueAction(ACTION_TYPES.REMOVE_BOOKMARK, {
      lessonId
    }, {
      description: 'Remove bookmark'
    });

    return {
      success: true,
      queued: true,
      message: 'Bookmark will be removed when you\'re back online'
    };

  } catch (error) {
    console.error('Error removing bookmark:', error);
    throw error;
  }
}

/**
 * Search lessons (offline-aware)
 */
export async function searchLessons(query, forceOnline = false) {
  try {
    const isOnline = networkStatus.isOnline();

    if (isOnline && !forceOnline) {
      try {
        const response = await api.get(`/lessons/search?q=${encodeURIComponent(query)}`);
        return { data: response.data, source: 'online' };
      } catch (error) {
        console.log('Network search failed, searching offline cache');
      }
    }

    // Search offline cache
    const results = await lessonOfflineService.searchLessonsOffline(query);
    return { data: results, source: 'offline' };

  } catch (error) {
    console.error('Error searching lessons:', error);
    throw error;
  }
}

/**
 * Check if lesson is available offline
 */
export async function isLessonAvailableOffline(lessonId) {
  return await lessonOfflineService.isLessonOffline(lessonId);
}

/**
 * Get recently downloaded lessons
 */
export async function getRecentlyDownloaded(limit = 10) {
  return await lessonOfflineService.getRecentlyDownloaded(limit);
}

/**
 * Get lessons by date range
 */
export async function getLessonsByDateRange(startDate, endDate) {
  const isOnline = networkStatus.isOnline();

  if (isOnline) {
    try {
      const response = await api.get('/lessons', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });
      return { data: response.data, source: 'online' };
    } catch (error) {
      console.log('Network request failed, falling back to cache');
    }
  }

  const results = await lessonOfflineService.getLessonsByDateRange(startDate, endDate);
  return { data: results, source: 'offline' };
}

const offlineLessonService = {
  getLesson,
  getAllLessons,
  getLessonsByClass,
  createLesson,
  updateLesson,
  deleteLesson,
  shareToCommunity,
  addBookmark,
  removeBookmark,
  searchLessons,
  isLessonAvailableOffline,
  getRecentlyDownloaded,
  getLessonsByDateRange,
};

export default offlineLessonService;
