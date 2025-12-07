/**
 * Lesson Plan Offline Service
 * Specialized CRUD operations for lesson plans in IndexedDB
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

const STORE_NAME = STORES.LESSONS;

/**
 * Save a lesson plan for offline access
 * @param {object} lessonPlan - Lesson plan data from API
 */
export async function saveLessonOffline(lessonPlan) {
  try {
    // Check if lesson already exists
    const existing = await getItem(STORE_NAME, lessonPlan._id);

    if (existing) {
      // Update existing lesson
      return await updateItem(STORE_NAME, {
        ...lessonPlan,
        lastModified: new Date().toISOString()
      });
    } else {
      // Add new lesson
      return await addItem(STORE_NAME, lessonPlan);
    }
  } catch (error) {
    console.error('[LessonOffline] Error saving lesson:', error);
    throw error;
  }
}

/**
 * Get a lesson plan from offline storage
 * @param {string} lessonId - Lesson plan ID
 */
export async function getLessonOffline(lessonId) {
  try {
    return await getItem(STORE_NAME, lessonId);
  } catch (error) {
    console.error('[LessonOffline] Error getting lesson:', error);
    throw error;
  }
}

/**
 * Get all offline lesson plans
 */
export async function getAllLessonsOffline() {
  try {
    return await getAllItems(STORE_NAME);
  } catch (error) {
    console.error('[LessonOffline] Error getting all lessons:', error);
    throw error;
  }
}

/**
 * Get lessons by class ID
 * @param {string} classId - Class ID
 */
export async function getLessonsByClass(classId) {
  try {
    return await getByIndex(STORE_NAME, 'classId', classId);
  } catch (error) {
    console.error('[LessonOffline] Error getting lessons by class:', error);
    throw error;
  }
}

/**
 * Get lessons by grade
 * @param {string} grade - Grade level
 */
export async function getLessonsByGrade(grade) {
  try {
    return await getByIndex(STORE_NAME, 'grade', grade);
  } catch (error) {
    console.error('[LessonOffline] Error getting lessons by grade:', error);
    throw error;
  }
}

/**
 * Delete a lesson from offline storage
 * @param {string} lessonId - Lesson plan ID
 */
export async function deleteLessonOffline(lessonId) {
  try {
    return await deleteItem(STORE_NAME, lessonId);
  } catch (error) {
    console.error('[LessonOffline] Error deleting lesson:', error);
    throw error;
  }
}

/**
 * Update lesson plan offline
 * @param {string} lessonId - Lesson plan ID
 * @param {object} updates - Fields to update
 */
export async function updateLessonOffline(lessonId, updates) {
  try {
    const existing = await getItem(STORE_NAME, lessonId);
    if (!existing) {
      throw new Error('Lesson not found in offline storage');
    }

    return await updateItem(STORE_NAME, {
      ...existing,
      ...updates,
      lastModified: new Date().toISOString()
    });
  } catch (error) {
    console.error('[LessonOffline] Error updating lesson:', error);
    throw error;
  }
}

/**
 * Batch save multiple lessons
 * @param {array} lessons - Array of lesson plans
 */
export async function saveLessonsBatch(lessons) {
  try {
    return await addBatch(STORE_NAME, lessons);
  } catch (error) {
    console.error('[LessonOffline] Error batch saving lessons:', error);
    throw error;
  }
}

/**
 * Check if a lesson is available offline
 * @param {string} lessonId - Lesson plan ID
 */
export async function isLessonOffline(lessonId) {
  try {
    const lesson = await getItem(STORE_NAME, lessonId);
    return !!lesson;
  } catch (error) {
    console.error('[LessonOffline] Error checking lesson offline status:', error);
    return false;
  }
}

/**
 * Get count of offline lessons
 */
export async function getOfflineLessonCount() {
  try {
    return await countItems(STORE_NAME);
  } catch (error) {
    console.error('[LessonOffline] Error counting lessons:', error);
    throw error;
  }
}

/**
 * Search lessons offline (simple text search)
 * @param {string} query - Search query
 */
export async function searchLessonsOffline(query) {
  try {
    const allLessons = await getAllItems(STORE_NAME);
    const lowerQuery = query.toLowerCase();

    return allLessons.filter(lesson => {
      return (
        lesson.specificTopic?.toLowerCase().includes(lowerQuery) ||
        lesson.learningObjective?.toLowerCase().includes(lowerQuery) ||
        lesson.successCriteria?.some(sc => sc.toLowerCase().includes(lowerQuery))
      );
    });
  } catch (error) {
    console.error('[LessonOffline] Error searching lessons:', error);
    throw error;
  }
}

/**
 * Get recently downloaded lessons
 * @param {number} limit - Number of lessons to return
 */
export async function getRecentlyDownloaded(limit = 10) {
  try {
    const allLessons = await getAllItems(STORE_NAME);
    return allLessons
      .sort((a, b) => new Date(b.downloadedAt) - new Date(a.downloadedAt))
      .slice(0, limit);
  } catch (error) {
    console.error('[LessonOffline] Error getting recent lessons:', error);
    throw error;
  }
}

/**
 * Get lessons by date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 */
export async function getLessonsByDateRange(startDate, endDate) {
  try {
    const allLessons = await getAllItems(STORE_NAME);
    return allLessons.filter(lesson => {
      const lessonDate = new Date(lesson.lessonDate);
      return lessonDate >= startDate && lessonDate <= endDate;
    });
  } catch (error) {
    console.error('[LessonOffline] Error getting lessons by date range:', error);
    throw error;
  }
}

const lessonOfflineService = {
  saveLessonOffline,
  getLessonOffline,
  getAllLessonsOffline,
  getLessonsByClass,
  getLessonsByGrade,
  deleteLessonOffline,
  updateLessonOffline,
  saveLessonsBatch,
  isLessonOffline,
  getOfflineLessonCount,
  searchLessonsOffline,
  getRecentlyDownloaded,
  getLessonsByDateRange
};

export default lessonOfflineService;
