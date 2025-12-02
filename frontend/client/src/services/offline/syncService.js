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
        console.log('✅ Background sync registered');
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
      console.log('📡 Network online - triggering auto-sync');
      this.triggerAutoSync();
    });

    // Listen for visibility change (user returns to tab)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && networkStatus.isOnline()) {
        // User returned to tab and we're online
        const timeSinceLastSync = Date.now() - (this.lastSyncTime || 0);
        const FIVE_MINUTES = 5 * 60 * 1000;

        if (timeSinceLastSync > FIVE_MINUTES) {
          console.log('📡 Tab visible - triggering sync');
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
      console.log('⏭️ Sync already in progress, skipping');
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

      console.log(`🔄 Starting ${syncType} sync...`);

      // Step 1: Process pending actions from queue
      this.notifyListeners({ status: SYNC_STATUS.SYNCING, progress: 20, step: 'Processing queue' });
      const queueResults = await offlineQueueService.processPendingActions();

      // Step 2: Check for conflicts
      this.notifyListeners({ status: SYNC_STATUS.SYNCING, progress: 40, step: 'Checking conflicts' });
      const conflicts = await this.detectConflicts();

      if (conflicts.length > 0) {
        console.log(`⚠️ Found ${conflicts.length} conflicts`);
        this.notifyListeners({
          status: SYNC_STATUS.CONFLICT,
          progress: 50,
          conflicts
        });

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

      console.log(`✅ Sync completed in ${duration}ms`);

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
    const lessons = await indexedDBService.getAll('lessons');
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
    const assessments = await indexedDBService.getAll('assessments');
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
      // Get last sync timestamp
      const lastSync = this.lastSyncTime || 0;

      // Fetch updated lessons
      const lessonsResponse = await fetch(`/api/lessons?since=${lastSync}`);
      if (lessonsResponse.ok) {
        const updatedLessons = await lessonsResponse.json();
        for (const lesson of updatedLessons) {
          await indexedDBService.update('lessons', lesson._id, lesson);
          results.lessons++;
        }
      }

      // Fetch updated assessments
      const assessmentsResponse = await fetch(`/api/assessment?since=${lastSync}`);
      if (assessmentsResponse.ok) {
        const updatedAssessments = await assessmentsResponse.json();
        for (const assessment of updatedAssessments) {
          await indexedDBService.update('assessments', assessment._id, assessment);
          results.assessments++;
        }
      }

      console.log('📥 Downloaded updates:', results);
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
      failed: 0
    };

    try {
      // Get items marked for sync
      const lessons = await indexedDBService.getAll('lessons');
      const pendingLessons = lessons.filter(l => l.__pendingSync);

      for (const lesson of pendingLessons) {
        try {
          const response = await fetch(`/api/lessons/${lesson._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lesson)
          });

          if (response.ok) {
            // Remove pending sync flag
            delete lesson.__pendingSync;
            await indexedDBService.update('lessons', lesson._id, lesson);
            results.uploaded++;
          } else {
            results.failed++;
          }
        } catch (error) {
          console.error(`Failed to upload lesson ${lesson._id}:`, error);
          results.failed++;
        }
      }

      console.log('📤 Uploaded changes:', results);
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

    await indexedDBService.add('syncHistory', historyEntry);

    // Keep only last 50 entries
    const allHistory = await indexedDBService.getAll('syncHistory');
    if (allHistory.length > 50) {
      const sorted = allHistory.sort((a, b) =>
        new Date(b.timestamp) - new Date(a.timestamp)
      );

      // Delete oldest entries
      for (let i = 50; i < sorted.length; i++) {
        await indexedDBService.delete('syncHistory', sorted[i]._id);
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
    const allHistory = await indexedDBService.getAll('syncHistory');
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
        console.log('⏰ Periodic sync triggered');
        this.sync(SYNC_TYPES.PERIODIC).catch(error => {
          console.error('Periodic sync failed:', error);
        });
      }
    }, intervalMinutes * 60 * 1000);

    console.log(`⏰ Periodic sync scheduled every ${intervalMinutes} minutes`);
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync() {
    if (this.periodicSyncInterval) {
      clearInterval(this.periodicSyncInterval);
      this.periodicSyncInterval = null;
      console.log('⏰ Periodic sync stopped');
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
