/**
 * Enhanced Sync Service
 *
 * Advanced synchronization service with:
 * - Background Sync API integration
 * - Conflict detection and resolution
 * - Sync history tracking
 * - Differential sync (only changed data)
 * - Progress tracking
 * - Retry logic with exponential backoff
 *
 * Features:
 * - Auto-sync on network reconnect
 * - Manual sync trigger
 * - Scheduled background sync
 * - Conflict resolution workflow
 * - Sync performance metrics
 */

import indexedDBService from '../indexedDB';
import offlineQueueService from './offlineQueueService';
import conflictDetectionService from './conflictDetectionService';
import networkStatus from '../networkStatus';
import syncApiService from '../syncApiService'; // PHASE 6: Backend sync API integration

// Sync status types
export const SYNC_STATUS = {
  IDLE: 'IDLE',
  SYNCING: 'SYNCING',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
  CONFLICT: 'CONFLICT'
};

// Sync types
export const SYNC_TYPES = {
  AUTO: 'AUTO',           // Automatic sync
  MANUAL: 'MANUAL',       // User-triggered
  BACKGROUND: 'BACKGROUND', // Background sync API
  PERIODIC: 'PERIODIC'    // Scheduled periodic sync
};

class SyncService {
  constructor() {
    this.syncInProgress = false;
    this.lastSyncTime = null;
    this.syncHistory = [];
    this.listeners = [];

    // Register service worker for background sync
    this.registerBackgroundSync();

    // Listen for online status
    this.setupNetworkListeners();
  }

  /**
   * Register Background Sync API
   */
  async registerBackgroundSync() {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;

        // Register background sync tag
        await registration.sync.register('sync-offline-data');
      } catch (error) {
        console.warn('⚠️ Background sync not available:', error);
      }
    } else {
      console.warn('⚠️ Background Sync API not supported');
    }
  }

  /**
   * Setup network status listeners
   */
  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.triggerAutoSync();
    });

    // Listen for visibility change (user returns to tab)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && networkStatus.isOnline()) {
        // User returned to tab and we're online
        const timeSinceLastSync = Date.now() - (this.lastSyncTime || 0);
        const FIVE_MINUTES = 5 * 60 * 1000;

        if (timeSinceLastSync > FIVE_MINUTES) {
          this.triggerAutoSync();
        }
      }
    });
  }

  /**
   * Trigger automatic sync
   */
  async triggerAutoSync() {
    if (this.syncInProgress) {
      return;
    }

    try {
      await this.sync(SYNC_TYPES.AUTO);
    } catch (error) {
      console.error('Auto-sync failed:', error);
    }
  }

  /**
   * Main sync function
   *
   * @param {String} syncType - Type of sync (AUTO, MANUAL, BACKGROUND, PERIODIC)
   * @returns {Object} Sync result
   */
  async sync(syncType = SYNC_TYPES.MANUAL) {
    if (!networkStatus.isOnline()) {
      throw new Error('Cannot sync while offline');
    }

    if (this.syncInProgress) {
      throw new Error('Sync already in progress');
    }

    const syncId = `sync-${Date.now()}`;
    const startTime = Date.now();

    try {
      this.syncInProgress = true;
      this.notifyListeners({ status: SYNC_STATUS.SYNCING, progress: 0 });

      // Step 1: Process pending actions from queue
      this.notifyListeners({ status: SYNC_STATUS.SYNCING, progress: 20, step: 'Processing queue' });
      const queueResults = await offlineQueueService.processPendingActions();

      // Step 2: Check for conflicts
      this.notifyListeners({ status: SYNC_STATUS.SYNCING, progress: 40, step: 'Checking conflicts' });
      const conflicts = await this.detectConflicts();

      if (conflicts.length > 0) {

        // Save conflicts for user resolution
        for (const conflict of conflicts) {
          await conflictDetectionService.saveConflict(conflict);
        }

        // Pause sync - user needs to resolve conflicts
        throw new Error(`Sync paused: ${conflicts.length} conflicts require resolution`);
      }

      // Step 3: Differential sync - download updates from server
      this.notifyListeners({ status: SYNC_STATUS.SYNCING, progress: 60, step: 'Downloading updates' });
      const downloadResults = await this.downloadUpdates();

      // Step 4: Upload local changes
      this.notifyListeners({ status: SYNC_STATUS.SYNCING, progress: 80, step: 'Uploading changes' });
      const uploadResults = await this.uploadChanges();

      // Step 5: Complete
      const duration = Date.now() - startTime;
      this.lastSyncTime = Date.now();

      const syncResult = {
        syncId,
        syncType,
        status: SYNC_STATUS.SUCCESS,
        startTime: new Date(startTime).toISOString(),
        duration,
        queueResults,
        downloadResults,
        uploadResults,
        conflicts: [],
        success: true
      };

      // Save to history
      await this.saveSyncHistory(syncResult);

      this.notifyListeners({
        status: SYNC_STATUS.SUCCESS,
        progress: 100,
        result: syncResult
      });

      // Dispatch success event
      window.dispatchEvent(new CustomEvent('sync-complete', {
        detail: syncResult
      }));

      return syncResult;

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('❌ Sync failed:', error);

      const syncResult = {
        syncId,
        syncType,
        status: SYNC_STATUS.ERROR,
        startTime: new Date(startTime).toISOString(),
        duration,
        error: error.message,
        success: false
      };

      await this.saveSyncHistory(syncResult);

      this.notifyListeners({
        status: SYNC_STATUS.ERROR,
        error: error.message
      });

      // Dispatch error event
      window.dispatchEvent(new CustomEvent('sync-error', {
        detail: { error: error.message, syncResult }
      }));

      throw error;

    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Detect conflicts between local and server data
   */
  async detectConflicts() {
    const conflicts = [];

    // Check lessons for conflicts
    const lessons = await indexedDBService.getAllItems('lessons');
    const lessonsWithPendingChanges = lessons.filter(lesson => lesson.__pendingSync);

    for (const lesson of lessonsWithPendingChanges) {
      try {
        // Fetch server version
        const response = await fetch(`/api/lessons/${lesson._id}`);
        if (response.ok) {
          const serverLesson = await response.json();

          // Detect conflict
          const conflict = conflictDetectionService.detectConflict(
            lesson,
            serverLesson,
            'lesson'
          );

          if (conflict) {
            conflicts.push({
              ...conflict,
              resourceId: lesson._id,
              resourceType: 'lesson'
            });
          }
        }
      } catch (error) {
        console.warn(`Could not check conflict for lesson ${lesson._id}:`, error);
      }
    }

    // Check assessments for conflicts
    const assessments = await indexedDBService.getAllItems('assessments');
    const assessmentsWithPendingChanges = assessments.filter(a => a.__pendingSync);

    for (const assessment of assessmentsWithPendingChanges) {
      try {
        const response = await fetch(`/api/assessment/${assessment._id}`);
        if (response.ok) {
          const serverAssessment = await response.json();

          const conflict = conflictDetectionService.detectConflict(
            assessment,
            serverAssessment,
            'assessment'
          );

          if (conflict) {
            conflicts.push({
              ...conflict,
              resourceId: assessment._id,
              resourceType: 'assessment'
            });
          }
        }
      } catch (error) {
        console.warn(`Could not check conflict for assessment ${assessment._id}:`, error);
      }
    }

    return conflicts;
  }

  /**
   * Download updates from server
   * Uses differential sync - only fetch changes since last sync
   */
  async downloadUpdates() {
    const results = {
      lessons: 0,
      assessments: 0,
      classes: 0,
      students: 0
    };

    try {
      // PHASE 6: Use new sync API endpoint for differential sync
      const lastSync = this.lastSyncTime || new Date(0).toISOString();

      const response = await syncApiService.getUpdatesSince(lastSync);

      if (response.success && response.data) {
        // Update lessons
        if (response.data.lessons) {
          for (const lesson of response.data.lessons) {
            await indexedDBService.updateItem('lessons', lesson);
            results.lessons++;
          }
        }

        // Update assessments
        if (response.data.assessments) {
          for (const assessment of response.data.assessments) {
            await indexedDBService.updateItem('assessments', assessment);
            results.assessments++;
          }
        }

        // Update classes
        if (response.data.classes) {
          for (const classItem of response.data.classes) {
            await indexedDBService.updateItem('classes', classItem);
            results.classes++;
          }
        }

        // Update students
        if (response.data.students) {
          for (const student of response.data.students) {
            await indexedDBService.updateItem('students', student);
            results.students++;
          }
        }
      }

    } catch (error) {
      console.error('Error downloading updates:', error);
    }

    return results;
  }

  /**
   * Upload local changes to server
   */
  async uploadChanges() {
    const results = {
      uploaded: 0,
      failed: 0,
      conflicts: 0
    };

    try {
      // PHASE 6: Collect all items marked for sync
      const lessons = await indexedDBService.getAllItems('lessons');
      const assessments = await indexedDBService.getAllItems('assessments');
      const classes = await indexedDBService.getAllItems('classes');
      const students = await indexedDBService.getAllItems('students');

      const pendingLessons = lessons.filter(l => l.__pendingSync || l.syncStatus === 'pending');
      const pendingAssessments = assessments.filter(a => a.__pendingSync || a.syncStatus === 'pending');
      const pendingClasses = classes.filter(c => c.__pendingSync || c.syncStatus === 'pending');
      const pendingStudents = students.filter(s => s.__pendingSync || s.syncStatus === 'pending');

      // Use batch upload API
      if (pendingLessons.length > 0 || pendingAssessments.length > 0 ||
          pendingClasses.length > 0 || pendingStudents.length > 0) {

        const response = await syncApiService.batchUploadChanges({
          lessons: pendingLessons,
          assessments: pendingAssessments,
          classes: pendingClasses,
          students: pendingStudents
        });

        if (response.success && response.data) {
          // Process successful uploads
          for (const item of response.data.success) {
            // Update local item to remove pending flags
            const storeName = `${item.type}s`;
            const localItem = await indexedDBService.getItem(storeName, item.id);
            if (localItem) {
              delete localItem.__pendingSync;
              localItem.syncStatus = 'synced';
              localItem.version = item.version;
              await indexedDBService.updateItem(storeName, localItem);
            }
            results.uploaded++;
          }

          // Handle conflicts
          results.conflicts = response.data.conflicts.length;
          for (const conflict of response.data.conflicts) {
            await conflictDetectionService.saveConflict(conflict);
          }

          // Track failures
          results.failed = response.data.errors.length;
        }
      }

    } catch (error) {
      console.error('Error uploading changes:', error);
    }

    return results;
  }

  /**
   * Save sync history
   */
  async saveSyncHistory(syncResult) {
    const historyEntry = {
      _id: syncResult.syncId,
      ...syncResult,
      timestamp: new Date().toISOString()
    };

    await indexedDBService.addItem('syncHistory', historyEntry);

    // Keep only last 50 entries
    const allHistory = await indexedDBService.getAllItems('syncHistory');
    if (allHistory.length > 50) {
      const sorted = allHistory.sort((a, b) =>
        new Date(b.timestamp) - new Date(a.timestamp)
      );

      // Delete oldest entries
      for (let i = 50; i < sorted.length; i++) {
        await indexedDBService.deleteItem('syncHistory', sorted[i]._id);
      }
    }
  }

  /**
   * Get sync history
   *
   * @param {Number} limit - Number of entries to return
   * @returns {Array} Sync history entries
   */
  async getSyncHistory(limit = 20) {
    const allHistory = await indexedDBService.getAllItems('syncHistory');
    return allHistory
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  /**
   * Get sync statistics
   */
  async getSyncStats() {
    const history = await this.getSyncHistory(100);

    const stats = {
      totalSyncs: history.length,
      successful: 0,
      failed: 0,
      withConflicts: 0,
      averageDuration: 0,
      lastSync: this.lastSyncTime ? new Date(this.lastSyncTime).toISOString() : null,
      byType: {}
    };

    let totalDuration = 0;

    for (const entry of history) {
      if (entry.status === SYNC_STATUS.SUCCESS) {
        stats.successful++;
      } else if (entry.status === SYNC_STATUS.ERROR) {
        stats.failed++;
      } else if (entry.status === SYNC_STATUS.CONFLICT) {
        stats.withConflicts++;
      }

      if (entry.duration) {
        totalDuration += entry.duration;
      }

      const type = entry.syncType || 'UNKNOWN';
      stats.byType[type] = (stats.byType[type] || 0) + 1;
    }

    if (history.length > 0) {
      stats.averageDuration = Math.round(totalDuration / history.length);
    }

    return stats;
  }

  /**
   * Schedule periodic sync
   *
   * @param {Number} intervalMinutes - Sync interval in minutes
   */
  schedulePeriodicSync(intervalMinutes = 30) {
    // Clear existing interval
    if (this.periodicSyncInterval) {
      clearInterval(this.periodicSyncInterval);
    }

    // Set new interval
    this.periodicSyncInterval = setInterval(() => {
      if (networkStatus.isOnline() && !this.syncInProgress) {
        this.sync(SYNC_TYPES.PERIODIC).catch(error => {
          console.error('Periodic sync failed:', error);
        });
      }
    }, intervalMinutes * 60 * 1000);

  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync() {
    if (this.periodicSyncInterval) {
      clearInterval(this.periodicSyncInterval);
      this.periodicSyncInterval = null;
    }
  }

  /**
   * Add sync listener
   */
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify listeners
   */
  notifyListeners(update) {
    this.listeners.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        console.error('Listener error:', error);
      }
    });
  }

  /**
   * Check if sync is needed
   */
  async isSyncNeeded() {
    const pending = await offlineQueueService.getPendingActions();
    const conflicts = await conflictDetectionService.getPendingConflicts();

    return pending.length > 0 || conflicts.length > 0;
  }

  /**
   * Get last sync time
   */
  getLastSyncTime() {
    return this.lastSyncTime;
  }

  /**
   * Check if sync is in progress
   */
  isSyncing() {
    return this.syncInProgress;
  }
}

// Export singleton instance
const syncService = new SyncService();

export default syncService;
