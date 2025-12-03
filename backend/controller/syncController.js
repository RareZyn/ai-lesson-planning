// backend/controller/syncController.js
// PHASE 6: Offline Sync Controller
// Handles synchronization between client and server for offline-first functionality

const LessonPlan = require("../model/Lesson");
const Assessment = require("../model/Assessment");
const Class = require("../model/Class");
const Student = require("../model/Student");

/**
 * Get updates since a specific timestamp
 * Endpoint: GET /api/sync/updates
 * Query params: since (ISO timestamp), types (comma-separated: lessons,assessments,classes,students)
 */
exports.getUpdatesSince = async (req, res) => {
  try {
    const { since, types = "lessons,assessments,classes,students" } = req.query;
    const userId = req.user.id;

    if (!since) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameter: since (timestamp)",
      });
    }

    const sinceDate = new Date(since);
    if (isNaN(sinceDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid timestamp format",
      });
    }

    const requestedTypes = types.split(",").map((t) => t.trim());
    const updates = {};

    // Get updated lessons
    if (requestedTypes.includes("lessons")) {
      updates.lessons = await LessonPlan.find({
        createdBy: userId,
        updatedAt: { $gt: sinceDate },
      })
        .select(
          "_id version updatedAt syncStatus parameters plan status approvalStatus communityData"
        )
        .sort({ updatedAt: -1 })
        .lean();
    }

    // Get updated assessments
    if (requestedTypes.includes("assessments")) {
      updates.assessments = await Assessment.find({
        createdBy: userId,
        updatedAt: { $gt: sinceDate },
      })
        .select(
          "_id version updatedAt syncStatus title activityType assessmentType status generatedContent"
        )
        .sort({ updatedAt: -1 })
        .lean();
    }

    // Get updated classes
    if (requestedTypes.includes("classes")) {
      updates.classes = await Class.find({
        createdBy: userId,
        updatedAt: { $gt: sinceDate },
      })
        .select(
          "_id version updatedAt syncStatus className grade subject year students classStats"
        )
        .sort({ updatedAt: -1 })
        .lean();
    }

    // Get updated students
    if (requestedTypes.includes("students")) {
      // Get all classes for this user to find their students
      const userClasses = await Class.find({ createdBy: userId }).select("_id");
      const classIds = userClasses.map((c) => c._id);

      updates.students = await Student.find({
        classId: { $in: classIds },
        updatedAt: { $gt: sinceDate },
      })
        .select(
          "_id version updatedAt syncStatus name studentId classId grade performanceStats status"
        )
        .sort({ updatedAt: -1 })
        .lean();
    }

    res.status(200).json({
      success: true,
      message: "Updates retrieved successfully",
      since: since,
      data: updates,
      counts: {
        lessons: updates.lessons?.length || 0,
        assessments: updates.assessments?.length || 0,
        classes: updates.classes?.length || 0,
        students: updates.students?.length || 0,
      },
    });
  } catch (error) {
    console.error("Error in getUpdatesSince:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving updates",
      error: error.message,
    });
  }
};

/**
 * Batch upload offline changes
 * Endpoint: POST /api/sync/batch-upload
 * Body: { lessons: [], assessments: [], classes: [], students: [] }
 */
exports.batchUpload = async (req, res) => {
  try {
    const { lessons = [], assessments = [], classes = [], students = [] } = req.body;
    const userId = req.user.id;

    const results = {
      success: [],
      conflicts: [],
      errors: [],
    };

    // Process lessons
    for (const lessonData of lessons) {
      try {
        const result = await processLessonUpdate(lessonData, userId);
        if (result.conflict) {
          results.conflicts.push({
            type: "lesson",
            id: lessonData._id,
            conflict: result.conflict,
          });
        } else {
          results.success.push({
            type: "lesson",
            id: result.lesson._id,
            version: result.lesson.version,
          });
        }
      } catch (error) {
        results.errors.push({
          type: "lesson",
          id: lessonData._id,
          error: error.message,
        });
      }
    }

    // Process assessments
    for (const assessmentData of assessments) {
      try {
        const result = await processAssessmentUpdate(assessmentData, userId);
        if (result.conflict) {
          results.conflicts.push({
            type: "assessment",
            id: assessmentData._id,
            conflict: result.conflict,
          });
        } else {
          results.success.push({
            type: "assessment",
            id: result.assessment._id,
            version: result.assessment.version,
          });
        }
      } catch (error) {
        results.errors.push({
          type: "assessment",
          id: assessmentData._id,
          error: error.message,
        });
      }
    }

    // Process classes
    for (const classData of classes) {
      try {
        const result = await processClassUpdate(classData, userId);
        if (result.conflict) {
          results.conflicts.push({
            type: "class",
            id: classData._id,
            conflict: result.conflict,
          });
        } else {
          results.success.push({
            type: "class",
            id: result.class._id,
            version: result.class.version,
          });
        }
      } catch (error) {
        results.errors.push({
          type: "class",
          id: classData._id,
          error: error.message,
        });
      }
    }

    // Process students
    for (const studentData of students) {
      try {
        const result = await processStudentUpdate(studentData, userId);
        if (result.conflict) {
          results.conflicts.push({
            type: "student",
            id: studentData._id,
            conflict: result.conflict,
          });
        } else {
          results.success.push({
            type: "student",
            id: result.student._id,
            version: result.student.version,
          });
        }
      } catch (error) {
        results.errors.push({
          type: "student",
          id: studentData._id,
          error: error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Batch upload completed",
      results: {
        successful: results.success.length,
        conflicts: results.conflicts.length,
        errors: results.errors.length,
      },
      data: results,
    });
  } catch (error) {
    console.error("Error in batchUpload:", error);
    res.status(500).json({
      success: false,
      message: "Error processing batch upload",
      error: error.message,
    });
  }
};

/**
 * Check for conflicts before sync
 * Endpoint: POST /api/sync/check-conflicts
 * Body: { lessons: [], assessments: [], classes: [], students: [] }
 */
exports.checkConflicts = async (req, res) => {
  try {
    const { lessons = [], assessments = [], classes = [], students = [] } = req.body;
    const userId = req.user.id;

    const conflicts = [];

    // Check lesson conflicts
    for (const lessonData of lessons) {
      const serverLesson = await LessonPlan.findOne({
        _id: lessonData._id,
        createdBy: userId,
      });

      if (serverLesson && serverLesson.version !== lessonData.version) {
        conflicts.push({
          type: "lesson",
          id: lessonData._id,
          localVersion: lessonData.version,
          serverVersion: serverLesson.version,
          localUpdatedAt: lessonData.updatedAt,
          serverUpdatedAt: serverLesson.updatedAt,
        });
      }
    }

    // Check assessment conflicts
    for (const assessmentData of assessments) {
      const serverAssessment = await Assessment.findOne({
        _id: assessmentData._id,
        createdBy: userId,
      });

      if (serverAssessment && serverAssessment.version !== assessmentData.version) {
        conflicts.push({
          type: "assessment",
          id: assessmentData._id,
          localVersion: assessmentData.version,
          serverVersion: serverAssessment.version,
          localUpdatedAt: assessmentData.updatedAt,
          serverUpdatedAt: serverAssessment.updatedAt,
        });
      }
    }

    // Check class conflicts
    for (const classData of classes) {
      const serverClass = await Class.findOne({
        _id: classData._id,
        createdBy: userId,
      });

      if (serverClass && serverClass.version !== classData.version) {
        conflicts.push({
          type: "class",
          id: classData._id,
          localVersion: classData.version,
          serverVersion: serverClass.version,
          localUpdatedAt: classData.updatedAt,
          serverUpdatedAt: serverClass.updatedAt,
        });
      }
    }

    // Check student conflicts
    for (const studentData of students) {
      const serverStudent = await Student.findById(studentData._id);

      if (serverStudent && serverStudent.version !== studentData.version) {
        conflicts.push({
          type: "student",
          id: studentData._id,
          localVersion: studentData.version,
          serverVersion: serverStudent.version,
          localUpdatedAt: studentData.updatedAt,
          serverUpdatedAt: serverStudent.updatedAt,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Conflict check completed",
      hasConflicts: conflicts.length > 0,
      conflicts,
    });
  } catch (error) {
    console.error("Error in checkConflicts:", error);
    res.status(500).json({
      success: false,
      message: "Error checking conflicts",
      error: error.message,
    });
  }
};

/**
 * Resolve a conflict
 * Endpoint: POST /api/sync/resolve-conflict
 * Body: { type, id, resolution, data }
 */
exports.resolveConflict = async (req, res) => {
  try {
    const { type, id, resolution, data } = req.body;
    const userId = req.user.id;

    if (!type || !id || !resolution || !data) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: type, id, resolution, data",
      });
    }

    let updated;

    switch (type) {
      case "lesson":
        updated = await resolveLessonConflict(id, userId, resolution, data);
        break;
      case "assessment":
        updated = await resolveAssessmentConflict(id, userId, resolution, data);
        break;
      case "class":
        updated = await resolveClassConflict(id, userId, resolution, data);
        break;
      case "student":
        updated = await resolveStudentConflict(id, userId, resolution, data);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: `Invalid type: ${type}`,
        });
    }

    res.status(200).json({
      success: true,
      message: "Conflict resolved successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error in resolveConflict:", error);
    res.status(500).json({
      success: false,
      message: "Error resolving conflict",
      error: error.message,
    });
  }
};

/**
 * Get sync status for user's data
 * Endpoint: GET /api/sync/status
 */
exports.getSyncStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const [lessonsPending, assessmentsPending, classesPending, studentsPending] =
      await Promise.all([
        LessonPlan.countDocuments({
          createdBy: userId,
          syncStatus: { $in: ["pending", "conflict"] },
        }),
        Assessment.countDocuments({
          createdBy: userId,
          syncStatus: { $in: ["pending", "conflict"] },
        }),
        Class.countDocuments({
          createdBy: userId,
          syncStatus: { $in: ["pending", "conflict"] },
        }),
        Student.countDocuments({
          addedBy: userId,
          syncStatus: { $in: ["pending", "conflict"] },
        }),
      ]);

    res.status(200).json({
      success: true,
      message: "Sync status retrieved",
      data: {
        pendingSync: {
          lessons: lessonsPending,
          assessments: assessmentsPending,
          classes: classesPending,
          students: studentsPending,
          total: lessonsPending + assessmentsPending + classesPending + studentsPending,
        },
      },
    });
  } catch (error) {
    console.error("Error in getSyncStatus:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving sync status",
      error: error.message,
    });
  }
};

// ===== HELPER FUNCTIONS =====

/**
 * Process a lesson update from offline client
 */
async function processLessonUpdate(lessonData, userId) {
  const { _id, offlineCreated, ...updates } = lessonData;

  // If created offline (temporary ID), create new document
  if (offlineCreated || _id.startsWith("temp-")) {
    const newLesson = new LessonPlan({
      ...updates,
      createdBy: userId,
      offlineCreated: true,
      syncStatus: "synced",
      lastSyncedAt: new Date(),
    });
    await newLesson.save();
    return { lesson: newLesson };
  }

  // Otherwise, update existing document
  const serverLesson = await LessonPlan.findOne({ _id, createdBy: userId });

  if (!serverLesson) {
    throw new Error("Lesson not found or access denied");
  }

  // Check for version conflict
  if (serverLesson.version !== lessonData.version) {
    return {
      conflict: {
        type: "VERSION_MISMATCH",
        localVersion: lessonData.version,
        serverVersion: serverLesson.version,
        serverData: serverLesson.toObject(),
        localData: lessonData,
      },
    };
  }

  // No conflict, apply updates
  Object.assign(serverLesson, updates);
  serverLesson.syncStatus = "synced";
  serverLesson.lastSyncedAt = new Date();
  await serverLesson.save();

  return { lesson: serverLesson };
}

/**
 * Process an assessment update from offline client
 */
async function processAssessmentUpdate(assessmentData, userId) {
  const { _id, offlineCreated, ...updates } = assessmentData;

  if (offlineCreated || _id.startsWith("temp-")) {
    const newAssessment = new Assessment({
      ...updates,
      createdBy: userId,
      offlineCreated: true,
      syncStatus: "synced",
      lastSyncedAt: new Date(),
    });
    await newAssessment.save();
    return { assessment: newAssessment };
  }

  const serverAssessment = await Assessment.findOne({ _id, createdBy: userId });

  if (!serverAssessment) {
    throw new Error("Assessment not found or access denied");
  }

  if (serverAssessment.version !== assessmentData.version) {
    return {
      conflict: {
        type: "VERSION_MISMATCH",
        localVersion: assessmentData.version,
        serverVersion: serverAssessment.version,
        serverData: serverAssessment.toObject(),
        localData: assessmentData,
      },
    };
  }

  Object.assign(serverAssessment, updates);
  serverAssessment.syncStatus = "synced";
  serverAssessment.lastSyncedAt = new Date();
  await serverAssessment.save();

  return { assessment: serverAssessment };
}

/**
 * Process a class update from offline client
 */
async function processClassUpdate(classData, userId) {
  const { _id, offlineCreated, ...updates } = classData;

  if (offlineCreated || _id.startsWith("temp-")) {
    const newClass = new Class({
      ...updates,
      createdBy: userId,
      offlineCreated: true,
      syncStatus: "synced",
      lastSyncedAt: new Date(),
    });
    await newClass.save();
    return { class: newClass };
  }

  const serverClass = await Class.findOne({ _id, createdBy: userId });

  if (!serverClass) {
    throw new Error("Class not found or access denied");
  }

  if (serverClass.version !== classData.version) {
    return {
      conflict: {
        type: "VERSION_MISMATCH",
        localVersion: classData.version,
        serverVersion: serverClass.version,
        serverData: serverClass.toObject(),
        localData: classData,
      },
    };
  }

  Object.assign(serverClass, updates);
  serverClass.syncStatus = "synced";
  serverClass.lastSyncedAt = new Date();
  await serverClass.save();

  return { class: serverClass };
}

/**
 * Process a student update from offline client
 */
async function processStudentUpdate(studentData, userId) {
  const { _id, offlineCreated, ...updates } = studentData;

  if (offlineCreated || _id.startsWith("temp-")) {
    const newStudent = new Student({
      ...updates,
      addedBy: userId,
      offlineCreated: true,
      syncStatus: "synced",
      lastSyncedAt: new Date(),
    });
    await newStudent.save();
    return { student: newStudent };
  }

  const serverStudent = await Student.findById(_id);

  if (!serverStudent) {
    throw new Error("Student not found");
  }

  if (serverStudent.version !== studentData.version) {
    return {
      conflict: {
        type: "VERSION_MISMATCH",
        localVersion: studentData.version,
        serverVersion: serverStudent.version,
        serverData: serverStudent.toObject(),
        localData: studentData,
      },
    };
  }

  Object.assign(serverStudent, updates);
  serverStudent.syncStatus = "synced";
  serverStudent.lastSyncedAt = new Date();
  await serverStudent.save();

  return { student: serverStudent };
}

/**
 * Resolve a lesson conflict
 */
async function resolveLessonConflict(id, userId, resolution, data) {
  const lesson = await LessonPlan.findOne({ _id: id, createdBy: userId });

  if (!lesson) {
    throw new Error("Lesson not found or access denied");
  }

  Object.assign(lesson, data);
  lesson.syncStatus = "synced";
  lesson.lastSyncedAt = new Date();
  lesson.conflictData = null;
  await lesson.save();

  return lesson;
}

/**
 * Resolve an assessment conflict
 */
async function resolveAssessmentConflict(id, userId, resolution, data) {
  const assessment = await Assessment.findOne({ _id: id, createdBy: userId });

  if (!assessment) {
    throw new Error("Assessment not found or access denied");
  }

  Object.assign(assessment, data);
  assessment.syncStatus = "synced";
  assessment.lastSyncedAt = new Date();
  assessment.conflictData = null;
  await assessment.save();

  return assessment;
}

/**
 * Resolve a class conflict
 */
async function resolveClassConflict(id, userId, resolution, data) {
  const classDoc = await Class.findOne({ _id: id, createdBy: userId });

  if (!classDoc) {
    throw new Error("Class not found or access denied");
  }

  Object.assign(classDoc, data);
  classDoc.syncStatus = "synced";
  classDoc.lastSyncedAt = new Date();
  classDoc.conflictData = null;
  await classDoc.save();

  return classDoc;
}

/**
 * Resolve a student conflict
 */
async function resolveStudentConflict(id, userId, resolution, data) {
  const student = await Student.findById(id);

  if (!student) {
    throw new Error("Student not found");
  }

  Object.assign(student, data);
  student.syncStatus = "synced";
  student.lastSyncedAt = new Date();
  student.conflictData = null;
  await student.save();

  return student;
}
