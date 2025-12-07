// backend/route/syncRoutes.js
// PHASE 6: Offline Sync Routes
// API endpoints for synchronization functionality

const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const syncController = require("../controller/syncController");

/**
 * @route   GET /api/sync/updates
 * @desc    Get all updates since a specific timestamp
 * @query   since (ISO timestamp), types (comma-separated: lessons,assessments,classes,students)
 * @access  Private
 */
router.get("/updates", protect, syncController.getUpdatesSince);

/**
 * @route   POST /api/sync/batch-upload
 * @desc    Upload multiple offline changes in batch
 * @body    { lessons: [], assessments: [], classes: [], students: [] }
 * @access  Private
 */
router.post("/batch-upload", protect, syncController.batchUpload);

/**
 * @route   POST /api/sync/check-conflicts
 * @desc    Check for conflicts before syncing
 * @body    { lessons: [], assessments: [], classes: [], students: [] }
 * @access  Private
 */
router.post("/check-conflicts", protect, syncController.checkConflicts);

/**
 * @route   POST /api/sync/resolve-conflict
 * @desc    Resolve a specific conflict
 * @body    { type, id, resolution, data }
 * @access  Private
 */
router.post("/resolve-conflict", protect, syncController.resolveConflict);

/**
 * @route   GET /api/sync/status
 * @desc    Get sync status for user's data
 * @access  Private
 */
router.get("/status", protect, syncController.getSyncStatus);

module.exports = router;
