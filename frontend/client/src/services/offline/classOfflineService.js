/**
 * Class Offline Service
 * Specialized CRUD operations for classes in IndexedDB
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

const STORE_NAME = STORES.CLASSES;

/**
 * Save a class for offline access
 * @param {object} classData - Class data from API
 */
export async function saveClassOffline(classData) {
  try {
    // Check if class already exists
    const existing = await getItem(STORE_NAME, classData._id);

    if (existing) {
      // Update existing class
      return await updateItem(STORE_NAME, {
        ...classData,
        lastModified: new Date().toISOString()
      });
    } else {
      // Add new class
      return await addItem(STORE_NAME, classData);
    }
  } catch (error) {
    console.error('[ClassOffline] Error saving class:', error);
    throw error;
  }
}

/**
 * Get a class from offline storage
 * @param {string} classId - Class ID
 */
export async function getClassOffline(classId) {
  try {
    return await getItem(STORE_NAME, classId);
  } catch (error) {
    console.error('[ClassOffline] Error getting class:', error);
    throw error;
  }
}

/**
 * Get all offline classes
 */
export async function getAllClassesOffline() {
  try {
    return await getAllItems(STORE_NAME);
  } catch (error) {
    console.error('[ClassOffline] Error getting all classes:', error);
    throw error;
  }
}

/**
 * Get classes by grade
 * @param {string} grade - Grade level
 */
export async function getClassesByGrade(grade) {
  try {
    return await getByIndex(STORE_NAME, 'grade', grade);
  } catch (error) {
    console.error('[ClassOffline] Error getting classes by grade:', error);
    throw error;
  }
}

/**
 * Get classes by subject
 * @param {string} subject - Subject name
 */
export async function getClassesBySubject(subject) {
  try {
    return await getByIndex(STORE_NAME, 'subject', subject);
  } catch (error) {
    console.error('[ClassOffline] Error getting classes by subject:', error);
    throw error;
  }
}

/**
 * Delete a class from offline storage
 * @param {string} classId - Class ID
 */
export async function deleteClassOffline(classId) {
  try {
    return await deleteItem(STORE_NAME, classId);
  } catch (error) {
    console.error('[ClassOffline] Error deleting class:', error);
    throw error;
  }
}

/**
 * Update class offline
 * @param {string} classId - Class ID
 * @param {object} updates - Fields to update
 */
export async function updateClassOffline(classId, updates) {
  try {
    const existing = await getItem(STORE_NAME, classId);
    if (!existing) {
      throw new Error('Class not found in offline storage');
    }

    return await updateItem(STORE_NAME, {
      ...existing,
      ...updates,
      lastModified: new Date().toISOString()
    });
  } catch (error) {
    console.error('[ClassOffline] Error updating class:', error);
    throw error;
  }
}

/**
 * Batch save multiple classes
 * @param {array} classes - Array of classes
 */
export async function saveClassesBatch(classes) {
  try {
    return await addBatch(STORE_NAME, classes);
  } catch (error) {
    console.error('[ClassOffline] Error batch saving classes:', error);
    throw error;
  }
}

/**
 * Check if a class is available offline
 * @param {string} classId - Class ID
 */
export async function isClassOffline(classId) {
  try {
    const classData = await getItem(STORE_NAME, classId);
    return !!classData;
  } catch (error) {
    console.error('[ClassOffline] Error checking class offline status:', error);
    return false;
  }
}

/**
 * Get count of offline classes
 */
export async function getOfflineClassCount() {
  try {
    return await countItems(STORE_NAME);
  } catch (error) {
    console.error('[ClassOffline] Error counting classes:', error);
    throw error;
  }
}

/**
 * Search classes offline (simple text search)
 * @param {string} query - Search query
 */
export async function searchClassesOffline(query) {
  try {
    const allClasses = await getAllItems(STORE_NAME);
    const lowerQuery = query.toLowerCase();

    return allClasses.filter(classData => {
      return (
        classData.className?.toLowerCase().includes(lowerQuery) ||
        classData.grade?.toLowerCase().includes(lowerQuery) ||
        classData.subject?.toLowerCase().includes(lowerQuery)
      );
    });
  } catch (error) {
    console.error('[ClassOffline] Error searching classes:', error);
    throw error;
  }
}

/**
 * Get class statistics
 */
export async function getClassStats() {
  try {
    const allClasses = await getAllItems(STORE_NAME);

    const stats = {
      total: allClasses.length,
      byGrade: {},
      bySubject: {},
      totalStudents: 0,
      averageStudentsPerClass: 0
    };

    allClasses.forEach(classData => {
      // Count by grade
      const grade = classData.grade || 'unknown';
      stats.byGrade[grade] = (stats.byGrade[grade] || 0) + 1;

      // Count by subject
      const subject = classData.subject || 'unknown';
      stats.bySubject[subject] = (stats.bySubject[subject] || 0) + 1;

      // Count students
      stats.totalStudents += classData.students?.length || 0;
    });

    stats.averageStudentsPerClass = stats.total > 0
      ? (stats.totalStudents / stats.total).toFixed(2)
      : 0;

    return stats;
  } catch (error) {
    console.error('[ClassOffline] Error getting class stats:', error);
    throw error;
  }
}

export default {
  saveClassOffline,
  getClassOffline,
  getAllClassesOffline,
  getClassesByGrade,
  getClassesBySubject,
  deleteClassOffline,
  updateClassOffline,
  saveClassesBatch,
  isClassOffline,
  getOfflineClassCount,
  searchClassesOffline,
  getClassStats
};
