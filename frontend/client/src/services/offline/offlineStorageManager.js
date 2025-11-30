/**
 * Offline Storage Manager
 * Central service for managing offline downloads and storage
 * Coordinates between different offline services and provides high-level features
 */

import * as lessonService from './lessonOfflineService';
import * as assessmentService from './assessmentOfflineService';
import * as rubricService from './rubricOfflineService';
import * as classService from './classOfflineService';
import * as studentService from './studentOfflineService';
import { addItem, updateItem, getItem, getAllItems, STORES } from '../indexedDB';

// Import API services for downloading data
import { getAllLessons, getLessonById } from '../lessonService';
import { getAllAssessments, getAssessmentById } from '../assessmentService';
import { getAllClasses, getClassById } from '../classService';
import { getAllStudents, getStudentsByClass } from '../studentService';

/**
 * Download Types
 */
export const DOWNLOAD_TYPES = {
  LESSON: 'lesson',
  ASSESSMENT: 'assessment',
  CLASS: 'class',
  STUDENT: 'student',
  RUBRIC: 'rubric',
  ALL: 'all'
};

/**
 * Download a single lesson plan for offline access
 * @param {string} lessonId - Lesson plan ID
 */
export async function downloadLesson(lessonId) {
  try {
    // Fetch from API
    const lesson = await getLessonById(lessonId);

    // Save to IndexedDB
    await lessonService.saveLessonOffline(lesson);

    // Update metadata
    await updateDownloadMetadata('lessons', lessonId);

    console.log('[OfflineManager] Lesson downloaded successfully:', lessonId);
    return { success: true, data: lesson };
  } catch (error) {
    console.error('[OfflineManager] Error downloading lesson:', error);
    throw error;
  }
}

/**
 * Download multiple lessons for offline access
 * @param {array} lessonIds - Array of lesson plan IDs
 * @param {function} onProgress - Progress callback (current, total)
 */
export async function downloadLessons(lessonIds, onProgress) {
  const results = {
    success: [],
    failed: [],
    total: lessonIds.length
  };

  for (let i = 0; i < lessonIds.length; i++) {
    try {
      await downloadLesson(lessonIds[i]);
      results.success.push(lessonIds[i]);
    } catch (error) {
      results.failed.push({ id: lessonIds[i], error: error.message });
    }

    if (onProgress) {
      onProgress(i + 1, lessonIds.length);
    }
  }

  return results;
}

/**
 * Download all lessons from a specific class
 * @param {string} classId - Class ID
 * @param {function} onProgress - Progress callback
 */
export async function downloadClassLessons(classId, onProgress) {
  try {
    // Fetch all lessons for the class
    const lessons = await getAllLessons({ classId });

    const results = {
      success: [],
      failed: [],
      total: lessons.length
    };

    for (let i = 0; i < lessons.length; i++) {
      try {
        await lessonService.saveLessonOffline(lessons[i]);
        results.success.push(lessons[i]._id);
      } catch (error) {
        results.failed.push({ id: lessons[i]._id, error: error.message });
      }

      if (onProgress) {
        onProgress(i + 1, lessons.length);
      }
    }

    return results;
  } catch (error) {
    console.error('[OfflineManager] Error downloading class lessons:', error);
    throw error;
  }
}

/**
 * Download an assessment for offline access
 * @param {string} assessmentId - Assessment ID
 */
export async function downloadAssessment(assessmentId) {
  try {
    // Fetch from API
    const assessment = await getAssessmentById(assessmentId);

    // Save to IndexedDB
    await assessmentService.saveAssessmentOffline(assessment);

    // If assessment has rubric, save it separately
    if (assessment.generatedContent?.rubricContent) {
      const rubric = {
        _id: `${assessmentId}_rubric`,
        assessmentId: assessmentId,
        ...assessment.generatedContent.rubricContent
      };
      await rubricService.saveRubricOffline(rubric);
    }

    // Update metadata
    await updateDownloadMetadata('assessments', assessmentId);

    console.log('[OfflineManager] Assessment downloaded successfully:', assessmentId);
    return { success: true, data: assessment };
  } catch (error) {
    console.error('[OfflineManager] Error downloading assessment:', error);
    throw error;
  }
}

/**
 * Download assessments for a lesson plan
 * @param {string} lessonId - Lesson plan ID
 * @param {function} onProgress - Progress callback
 */
export async function downloadLessonAssessments(lessonId, onProgress) {
  try {
    const assessments = await getAllAssessments({ lessonPlanId: lessonId });

    const results = {
      success: [],
      failed: [],
      total: assessments.length
    };

    for (let i = 0; i < assessments.length; i++) {
      try {
        await downloadAssessment(assessments[i]._id);
        results.success.push(assessments[i]._id);
      } catch (error) {
        results.failed.push({ id: assessments[i]._id, error: error.message });
      }

      if (onProgress) {
        onProgress(i + 1, assessments.length);
      }
    }

    return results;
  } catch (error) {
    console.error('[OfflineManager] Error downloading lesson assessments:', error);
    throw error;
  }
}

/**
 * Download a class and its students for offline access
 * @param {string} classId - Class ID
 * @param {boolean} includeStudents - Whether to include students
 */
export async function downloadClass(classId, includeStudents = true) {
  try {
    // Fetch class from API
    const classData = await getClassById(classId);

    // Save class to IndexedDB
    await classService.saveClassOffline(classData);

    let studentCount = 0;

    // Optionally download students
    if (includeStudents) {
      const students = await getStudentsByClass(classId);
      if (students && students.length > 0) {
        await studentService.saveStudentsBatch(students);
        studentCount = students.length;
      }
    }

    // Update metadata
    await updateDownloadMetadata('classes', classId);

    console.log('[OfflineManager] Class downloaded successfully:', classId);
    return { success: true, data: classData, studentCount };
  } catch (error) {
    console.error('[OfflineManager] Error downloading class:', error);
    throw error;
  }
}

/**
 * Download complete package: lesson + assessments + class + students
 * @param {string} lessonId - Lesson plan ID
 * @param {function} onProgress - Progress callback
 */
export async function downloadCompleteLesson(lessonId, onProgress) {
  try {
    const results = {
      lesson: null,
      assessments: [],
      class: null,
      students: [],
      errors: []
    };

    // Step 1: Download lesson (25%)
    try {
      const lessonResult = await downloadLesson(lessonId);
      results.lesson = lessonResult.data;
      if (onProgress) onProgress(25, 100);
    } catch (error) {
      results.errors.push({ type: 'lesson', error: error.message });
    }

    // Step 2: Download assessments (50%)
    if (results.lesson) {
      try {
        const assessmentResults = await downloadLessonAssessments(lessonId);
        results.assessments = assessmentResults.success;
        if (onProgress) onProgress(50, 100);
      } catch (error) {
        results.errors.push({ type: 'assessments', error: error.message });
      }
    }

    // Step 3: Download class (75%)
    if (results.lesson && results.lesson.classId) {
      try {
        const classResult = await downloadClass(results.lesson.classId, true);
        results.class = classResult.data;
        results.students = classResult.studentCount;
        if (onProgress) onProgress(75, 100);
      } catch (error) {
        results.errors.push({ type: 'class', error: error.message });
      }
    }

    if (onProgress) onProgress(100, 100);

    return results;
  } catch (error) {
    console.error('[OfflineManager] Error downloading complete lesson:', error);
    throw error;
  }
}

/**
 * Download all user data for offline access
 * @param {function} onProgress - Progress callback
 */
export async function downloadAllUserData(onProgress) {
  try {
    const results = {
      lessons: { success: 0, failed: 0 },
      assessments: { success: 0, failed: 0 },
      classes: { success: 0, failed: 0 },
      students: { success: 0, failed: 0 },
      errors: []
    };

    // Download all classes
    const classes = await getAllClasses();
    for (let i = 0; i < classes.length; i++) {
      try {
        await downloadClass(classes[i]._id, true);
        results.classes.success++;
      } catch (error) {
        results.classes.failed++;
        results.errors.push({ type: 'class', id: classes[i]._id, error: error.message });
      }
      if (onProgress) onProgress('classes', i + 1, classes.length);
    }

    // Download all lessons
    const lessons = await getAllLessons();
    for (let i = 0; i < lessons.length; i++) {
      try {
        await lessonService.saveLessonOffline(lessons[i]);
        results.lessons.success++;
      } catch (error) {
        results.lessons.failed++;
        results.errors.push({ type: 'lesson', id: lessons[i]._id, error: error.message });
      }
      if (onProgress) onProgress('lessons', i + 1, lessons.length);
    }

    // Download all assessments
    const assessments = await getAllAssessments();
    for (let i = 0; i < assessments.length; i++) {
      try {
        await assessmentService.saveAssessmentOffline(assessments[i]);
        results.assessments.success++;
      } catch (error) {
        results.assessments.failed++;
        results.errors.push({ type: 'assessment', id: assessments[i]._id, error: error.message });
      }
      if (onProgress) onProgress('assessments', i + 1, assessments.length);
    }

    return results;
  } catch (error) {
    console.error('[OfflineManager] Error downloading all user data:', error);
    throw error;
  }
}

/**
 * Remove downloaded content
 * @param {string} type - Type of content (lesson, assessment, class, student)
 * @param {string} id - ID of the item to remove
 */
export async function removeOfflineContent(type, id) {
  try {
    switch (type) {
      case DOWNLOAD_TYPES.LESSON:
        await lessonService.deleteLessonOffline(id);
        break;
      case DOWNLOAD_TYPES.ASSESSMENT:
        await assessmentService.deleteAssessmentOffline(id);
        break;
      case DOWNLOAD_TYPES.CLASS:
        await classService.deleteClassOffline(id);
        break;
      case DOWNLOAD_TYPES.STUDENT:
        await studentService.deleteStudentOffline(id);
        break;
      case DOWNLOAD_TYPES.RUBRIC:
        await rubricService.deleteRubricOffline(id);
        break;
      default:
        throw new Error('Invalid content type');
    }

    await removeDownloadMetadata(type, id);
    console.log('[OfflineManager] Removed offline content:', type, id);
  } catch (error) {
    console.error('[OfflineManager] Error removing offline content:', error);
    throw error;
  }
}

/**
 * Get storage statistics
 */
export async function getStorageStats() {
  try {
    const stats = {
      lessons: await lessonService.getOfflineLessonCount(),
      assessments: await assessmentService.getOfflineAssessmentCount(),
      classes: await classService.getOfflineClassCount(),
      students: await studentService.getOfflineStudentCount(),
      rubrics: await rubricService.getOfflineRubricCount(),
      total: 0,
      estimatedSize: {
        bytes: 0,
        kb: 0,
        mb: 0
      }
    };

    stats.total = stats.lessons + stats.assessments + stats.classes + stats.students + stats.rubrics;

    // Get detailed stats
    const assessmentStats = await assessmentService.getAssessmentStats();
    const classStats = await classService.getClassStats();
    const studentStats = await studentService.getStudentStats();

    stats.details = {
      assessments: assessmentStats,
      classes: classStats,
      students: studentStats
    };

    // Estimate total size
    const allData = {
      lessons: await lessonService.getAllLessonsOffline(),
      assessments: await assessmentService.getAllAssessmentsOffline(),
      classes: await classService.getAllClassesOffline(),
      students: await studentService.getAllStudentsOffline(),
      rubrics: await rubricService.getAllRubricsOffline()
    };

    const jsonSize = JSON.stringify(allData).length;
    stats.estimatedSize.bytes = jsonSize;
    stats.estimatedSize.kb = (jsonSize / 1024).toFixed(2);
    stats.estimatedSize.mb = (jsonSize / (1024 * 1024)).toFixed(2);

    return stats;
  } catch (error) {
    console.error('[OfflineManager] Error getting storage stats:', error);
    throw error;
  }
}

/**
 * Check if content is available offline
 * @param {string} type - Type of content
 * @param {string} id - ID of the item
 */
export async function isContentOffline(type, id) {
  try {
    switch (type) {
      case DOWNLOAD_TYPES.LESSON:
        return await lessonService.isLessonOffline(id);
      case DOWNLOAD_TYPES.ASSESSMENT:
        return await assessmentService.isAssessmentOffline(id);
      case DOWNLOAD_TYPES.CLASS:
        return await classService.isClassOffline(id);
      case DOWNLOAD_TYPES.STUDENT:
        return await studentService.isStudentOffline(id);
      case DOWNLOAD_TYPES.RUBRIC:
        return await rubricService.isRubricOffline(id);
      default:
        return false;
    }
  } catch (error) {
    console.error('[OfflineManager] Error checking offline status:', error);
    return false;
  }
}

/**
 * Update download metadata
 * @param {string} type - Type of content
 * @param {string} id - ID of the item
 */
async function updateDownloadMetadata(type, id) {
  const key = `download_${type}_${id}`;
  const metadata = {
    key,
    type,
    id,
    downloadedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    const existing = await getItem(STORES.METADATA, key);
    if (existing) {
      await updateItem(STORES.METADATA, metadata);
    } else {
      await addItem(STORES.METADATA, metadata);
    }
  } catch (error) {
    console.error('[OfflineManager] Error updating metadata:', error);
  }
}

/**
 * Remove download metadata
 * @param {string} type - Type of content
 * @param {string} id - ID of the item
 */
async function removeDownloadMetadata(type, id) {
  const key = `download_${type}_${id}`;
  try {
    const { deleteItem } = await import('../indexedDB');
    await deleteItem(STORES.METADATA, key);
  } catch (error) {
    console.error('[OfflineManager] Error removing metadata:', error);
  }
}

/**
 * Get all download metadata
 */
export async function getAllDownloadMetadata() {
  try {
    return await getAllItems(STORES.METADATA);
  } catch (error) {
    console.error('[OfflineManager] Error getting download metadata:', error);
    return [];
  }
}

export default {
  downloadLesson,
  downloadLessons,
  downloadClassLessons,
  downloadAssessment,
  downloadLessonAssessments,
  downloadClass,
  downloadCompleteLesson,
  downloadAllUserData,
  removeOfflineContent,
  getStorageStats,
  isContentOffline,
  getAllDownloadMetadata,
  DOWNLOAD_TYPES
};
