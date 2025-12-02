/**
 * Student Offline Service
 * Specialized CRUD operations for students in IndexedDB
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

const STORE_NAME = STORES.STUDENTS;

/**
 * Save a student for offline access
 * @param {object} student - Student data from API
 */
export async function saveStudentOffline(student) {
  try {
    // Check if student already exists
    const existing = await getItem(STORE_NAME, student._id);

    if (existing) {
      // Update existing student
      return await updateItem(STORE_NAME, {
        ...student,
        lastModified: new Date().toISOString()
      });
    } else {
      // Add new student
      return await addItem(STORE_NAME, student);
    }
  } catch (error) {
    console.error('[StudentOffline] Error saving student:', error);
    throw error;
  }
}

/**
 * Get a student from offline storage
 * @param {string} studentId - Student _id (MongoDB ID)
 */
export async function getStudentOffline(studentId) {
  try {
    return await getItem(STORE_NAME, studentId);
  } catch (error) {
    console.error('[StudentOffline] Error getting student:', error);
    throw error;
  }
}

/**
 * Get student by student ID (unique identifier like student number)
 * @param {string} studentId - Student ID (e.g., S001, S002)
 */
export async function getStudentByStudentId(studentId) {
  try {
    const students = await getByIndex(STORE_NAME, 'studentId', studentId);
    return students.length > 0 ? students[0] : null;
  } catch (error) {
    console.error('[StudentOffline] Error getting student by studentId:', error);
    throw error;
  }
}

/**
 * Get all offline students
 */
export async function getAllStudentsOffline() {
  try {
    return await getAllItems(STORE_NAME);
  } catch (error) {
    console.error('[StudentOffline] Error getting all students:', error);
    throw error;
  }
}

/**
 * Get students by class ID
 * @param {string} classId - Class ID
 */
export async function getStudentsByClass(classId) {
  try {
    return await getByIndex(STORE_NAME, 'classId', classId);
  } catch (error) {
    console.error('[StudentOffline] Error getting students by class:', error);
    throw error;
  }
}

/**
 * Delete a student from offline storage
 * @param {string} studentId - Student _id
 */
export async function deleteStudentOffline(studentId) {
  try {
    return await deleteItem(STORE_NAME, studentId);
  } catch (error) {
    console.error('[StudentOffline] Error deleting student:', error);
    throw error;
  }
}

/**
 * Update student offline
 * @param {string} studentId - Student _id
 * @param {object} updates - Fields to update
 */
export async function updateStudentOffline(studentId, updates) {
  try {
    const existing = await getItem(STORE_NAME, studentId);
    if (!existing) {
      throw new Error('Student not found in offline storage');
    }

    return await updateItem(STORE_NAME, {
      ...existing,
      ...updates,
      lastModified: new Date().toISOString()
    });
  } catch (error) {
    console.error('[StudentOffline] Error updating student:', error);
    throw error;
  }
}

/**
 * Batch save multiple students
 * @param {array} students - Array of students
 */
export async function saveStudentsBatch(students) {
  try {
    return await addBatch(STORE_NAME, students);
  } catch (error) {
    console.error('[StudentOffline] Error batch saving students:', error);
    throw error;
  }
}

/**
 * Check if a student is available offline
 * @param {string} studentId - Student _id
 */
export async function isStudentOffline(studentId) {
  try {
    const student = await getItem(STORE_NAME, studentId);
    return !!student;
  } catch (error) {
    console.error('[StudentOffline] Error checking student offline status:', error);
    return false;
  }
}

/**
 * Get count of offline students
 */
export async function getOfflineStudentCount() {
  try {
    return await countItems(STORE_NAME);
  } catch (error) {
    console.error('[StudentOffline] Error counting students:', error);
    throw error;
  }
}

/**
 * Search students offline (simple text search)
 * @param {string} query - Search query
 */
export async function searchStudentsOffline(query) {
  try {
    const allStudents = await getAllItems(STORE_NAME);
    const lowerQuery = query.toLowerCase();

    return allStudents.filter(student => {
      return (
        student.name?.toLowerCase().includes(lowerQuery) ||
        student.studentId?.toLowerCase().includes(lowerQuery) ||
        student.email?.toLowerCase().includes(lowerQuery)
      );
    });
  } catch (error) {
    console.error('[StudentOffline] Error searching students:', error);
    throw error;
  }
}

/**
 * Delete students by class ID
 * Useful when a class is deleted
 * @param {string} classId - Class ID
 */
export async function deleteStudentsByClass(classId) {
  try {
    const students = await getStudentsByClass(classId);
    const deletePromises = students.map(student => deleteItem(STORE_NAME, student._id));
    await Promise.all(deletePromises);
    return students.length;
  } catch (error) {
    console.error('[StudentOffline] Error deleting students by class:', error);
    throw error;
  }
}

/**
 * Get student statistics
 */
export async function getStudentStats() {
  try {
    const allStudents = await getAllItems(STORE_NAME);

    const stats = {
      total: allStudents.length,
      byClass: {},
      byGrade: {},
      byGender: {
        male: 0,
        female: 0,
        other: 0
      },
      activeStudents: 0,
      averagePerformance: 0
    };

    let totalPerformance = 0;
    let studentsWithPerformance = 0;

    allStudents.forEach(student => {
      // Count by class
      if (student.classId) {
        stats.byClass[student.classId] = (stats.byClass[student.classId] || 0) + 1;
      }

      // Count by grade
      const grade = student.grade || 'unknown';
      stats.byGrade[grade] = (stats.byGrade[grade] || 0) + 1;

      // Count by gender
      const gender = (student.gender || 'other').toLowerCase();
      if (gender === 'male' || gender === 'female') {
        stats.byGender[gender]++;
      } else {
        stats.byGender.other++;
      }

      // Count active students
      if (student.status === 'active') {
        stats.activeStudents++;
      }

      // Calculate average performance
      if (student.performanceStats?.averageScore) {
        totalPerformance += student.performanceStats.averageScore;
        studentsWithPerformance++;
      }
    });

    stats.averagePerformance = studentsWithPerformance > 0
      ? (totalPerformance / studentsWithPerformance).toFixed(2)
      : 0;

    return stats;
  } catch (error) {
    console.error('[StudentOffline] Error getting student stats:', error);
    throw error;
  }
}

/**
 * Get top performing students
 * @param {number} limit - Number of students to return
 */
export async function getTopPerformingStudents(limit = 10) {
  try {
    const allStudents = await getAllItems(STORE_NAME);

    return allStudents
      .filter(student => student.performanceStats?.averageScore)
      .sort((a, b) => b.performanceStats.averageScore - a.performanceStats.averageScore)
      .slice(0, limit);
  } catch (error) {
    console.error('[StudentOffline] Error getting top performing students:', error);
    throw error;
  }
}

const studentOfflineService = {
  saveStudentOffline,
  getStudentOffline,
  getStudentByStudentId,
  getAllStudentsOffline,
  getStudentsByClass,
  deleteStudentOffline,
  updateStudentOffline,
  saveStudentsBatch,
  isStudentOffline,
  getOfflineStudentCount,
  searchStudentsOffline,
  deleteStudentsByClass,
  getStudentStats,
  getTopPerformingStudents
};

export default studentOfflineService;
