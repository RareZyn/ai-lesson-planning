/**
 * Offline Queue Service
 *
 * Manages offline actions queue for synchronization when back online
 * Handles queuing, processing, and retry logic for offline operations
 */

import { addItem, getByIndex, updateItem, deleteItem, getAllItems } from '../indexedDB';
import api from '../api';

// Action types that can be queued
export const ACTION_TYPES = {
  // Lesson actions
  CREATE_LESSON: 'CREATE_LESSON',
  UPDATE_LESSON: 'UPDATE_LESSON',
  DELETE_LESSON: 'DELETE_LESSON',
  SHARE_LESSON: 'SHARE_LESSON',

  // Bookmark actions
  ADD_BOOKMARK: 'ADD_BOOKMARK',
  REMOVE_BOOKMARK: 'REMOVE_BOOKMARK',

  // Community actions
  LIKE_LESSON: 'LIKE_LESSON',
  UNLIKE_LESSON: 'UNLIKE_LESSON',
  ADD_REVIEW: 'ADD_REVIEW',

  // Assessment actions
  CREATE_ASSESSMENT: 'CREATE_ASSESSMENT',
  UPDATE_ASSESSMENT: 'UPDATE_ASSESSMENT',
  DELETE_ASSESSMENT: 'DELETE_ASSESSMENT',

  // Class actions
  UPDATE_CLASS: 'UPDATE_CLASS',

  // Student actions
  UPDATE_STUDENT: 'UPDATE_STUDENT',
};

// Action status
export const ACTION_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  RETRY: 'retry',
};

/**
 * Queue an action for later sync
 */
export async function queueAction(actionType, payload, metadata = {}) {
  try {
    const action = {
      _id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      actionType,
      payload,
      metadata,
      status: ACTION_STATUS.PENDING,
      createdAt: new Date().toISOString(),
      attemptCount: 0,
      maxAttempts: metadata.maxAttempts || 3,
      lastError: null,
    };

    await addItem('offlineQueue', action);
    console.log(`✅ Action queued: ${actionType}`, action);

    // Dispatch custom event for UI updates
    window.dispatchEvent(new CustomEvent('offline-action-queued', {
      detail: { action }
    }));

    return action;
  } catch (error) {
    console.error('Error queuing action:', error);
    throw error;
  }
}

/**
 * Get all pending actions
 */
export async function getPendingActions() {
  try {
    const actions = await getByIndex('offlineQueue', 'status', ACTION_STATUS.PENDING);
    return actions.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  } catch (error) {
    console.error('Error getting pending actions:', error);
    return [];
  }
}

/**
 * Get all actions with a specific status
 */
export async function getActionsByStatus(status) {
  try {
    return await getByIndex('offlineQueue', 'status', status);
  } catch (error) {
    console.error(`Error getting actions with status ${status}:`, error);
    return [];
  }
}

/**
 * Get actions by type
 */
export async function getActionsByType(actionType) {
  try {
    return await getByIndex('offlineQueue', 'actionType', actionType);
  } catch (error) {
    console.error(`Error getting actions of type ${actionType}:`, error);
    return [];
  }
}

/**
 * Get all actions in the queue
 */
export async function getAllQueuedActions() {
  try {
    return await getAllItems('offlineQueue');
  } catch (error) {
    console.error('Error getting all queued actions:', error);
    return [];
  }
}

/**
 * Update action status
 */
export async function updateActionStatus(actionId, status, error = null) {
  try {
    const action = await getByIndex('offlineQueue', '_id', actionId);

    if (action.length > 0) {
      const updatedAction = {
        ...action[0],
        status,
        lastError: error ? error.message : null,
        updatedAt: new Date().toISOString(),
      };

      if (status === ACTION_STATUS.FAILED || status === ACTION_STATUS.RETRY) {
        updatedAction.attemptCount = (action[0].attemptCount || 0) + 1;
      }

      await updateItem('offlineQueue', updatedAction);

      // Dispatch event for UI updates
      window.dispatchEvent(new CustomEvent('offline-action-updated', {
        detail: { action: updatedAction }
      }));

      return updatedAction;
    }
  } catch (error) {
    console.error('Error updating action status:', error);
    throw error;
  }
}

/**
 * Delete a completed or failed action
 */
export async function deleteAction(actionId) {
  try {
    await deleteItem('offlineQueue', actionId);

    window.dispatchEvent(new CustomEvent('offline-action-deleted', {
      detail: { actionId }
    }));
  } catch (error) {
    console.error('Error deleting action:', error);
    throw error;
  }
}

/**
 * Clear completed actions older than specified days
 */
export async function clearOldActions(daysOld = 7) {
  try {
    const completedActions = await getActionsByStatus(ACTION_STATUS.COMPLETED);
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - daysOld * 24 * 60 * 60 * 1000);

    let deletedCount = 0;

    for (const action of completedActions) {
      const actionDate = new Date(action.createdAt);
      if (actionDate < cutoffDate) {
        await deleteAction(action._id);
        deletedCount++;
      }
    }

    console.log(`🧹 Cleared ${deletedCount} old completed actions`);
    return deletedCount;
  } catch (error) {
    console.error('Error clearing old actions:', error);
    return 0;
  }
}

/**
 * Process a single action
 */
async function processAction(action) {
  try {
    console.log(`🔄 Processing action: ${action.actionType}`, action);

    let result;

    switch (action.actionType) {
      // Lesson actions
      case ACTION_TYPES.CREATE_LESSON:
        result = await api.post('/lessons', action.payload);
        break;

      case ACTION_TYPES.UPDATE_LESSON:
        result = await api.put(`/lessons/${action.payload.lessonId}`, action.payload.updates);
        break;

      case ACTION_TYPES.DELETE_LESSON:
        result = await api.delete(`/lessons/${action.payload.lessonId}`);
        break;

      case ACTION_TYPES.SHARE_LESSON:
        result = await api.post(`/lessons/${action.payload.lessonId}/share`, action.payload.data);
        break;

      // Bookmark actions
      case ACTION_TYPES.ADD_BOOKMARK:
        result = await api.post('/auth/bookmarks/add', { lessonId: action.payload.lessonId });
        break;

      case ACTION_TYPES.REMOVE_BOOKMARK:
        result = await api.post('/auth/bookmarks/remove', { lessonId: action.payload.lessonId });
        break;

      // Community actions
      case ACTION_TYPES.LIKE_LESSON:
        result = await api.post(`/community/lessons/${action.payload.lessonId}/like`);
        break;

      case ACTION_TYPES.UNLIKE_LESSON:
        result = await api.delete(`/community/lessons/${action.payload.lessonId}/like`);
        break;

      case ACTION_TYPES.ADD_REVIEW:
        result = await api.post(`/community/lessons/${action.payload.lessonId}/review`, action.payload.review);
        break;

      // Assessment actions
      case ACTION_TYPES.CREATE_ASSESSMENT:
        result = await api.post('/assessment', action.payload);
        break;

      case ACTION_TYPES.UPDATE_ASSESSMENT:
        result = await api.put(`/assessment/${action.payload.assessmentId}`, action.payload.updates);
        break;

      case ACTION_TYPES.DELETE_ASSESSMENT:
        result = await api.delete(`/assessment/${action.payload.assessmentId}`);
        break;

      // Class actions
      case ACTION_TYPES.UPDATE_CLASS:
        result = await api.put(`/classes/${action.payload.classId}`, action.payload.updates);
        break;

      // Student actions
      case ACTION_TYPES.UPDATE_STUDENT:
        result = await api.put(`/students/${action.payload.studentId}`, action.payload.updates);
        break;

      default:
        throw new Error(`Unknown action type: ${action.actionType}`);
    }

    console.log(`✅ Action processed successfully: ${action.actionType}`);
    return result;

  } catch (error) {
    console.error(`❌ Error processing action ${action.actionType}:`, error);
    throw error;
  }
}

/**
 * Process all pending actions
 */
export async function processPendingActions() {
  try {
    const pendingActions = await getPendingActions();

    if (pendingActions.length === 0) {
      console.log('No pending actions to process');
      return {
        total: 0,
        successful: 0,
        failed: 0
      };
    }

    console.log(`🔄 Processing ${pendingActions.length} pending actions...`);

    const results = {
      total: pendingActions.length,
      successful: 0,
      failed: 0,
      actions: []
    };

    for (const action of pendingActions) {
      try {
        // Update status to processing
        await updateActionStatus(action._id, ACTION_STATUS.PROCESSING);

        // Process the action
        const result = await processAction(action);

        // Mark as completed
        await updateActionStatus(action._id, ACTION_STATUS.COMPLETED);

        results.successful++;
        results.actions.push({
          actionId: action._id,
          type: action.actionType,
          status: 'success',
          result
        });

      } catch (error) {
        const attemptCount = action.attemptCount + 1;

        // Check if we should retry
        if (attemptCount < action.maxAttempts) {
          await updateActionStatus(action._id, ACTION_STATUS.RETRY, error);
          results.actions.push({
            actionId: action._id,
            type: action.actionType,
            status: 'retry',
            error: error.message,
            attemptCount
          });
        } else {
          await updateActionStatus(action._id, ACTION_STATUS.FAILED, error);
          results.failed++;
          results.actions.push({
            actionId: action._id,
            type: action.actionType,
            status: 'failed',
            error: error.message,
            attemptCount
          });
        }
      }
    }

    console.log(`✅ Sync complete: ${results.successful} successful, ${results.failed} failed`);

    // Dispatch sync complete event
    window.dispatchEvent(new CustomEvent('offline-sync-complete', {
      detail: results
    }));

    return results;

  } catch (error) {
    console.error('Error processing pending actions:', error);
    throw error;
  }
}

/**
 * Retry failed actions
 */
export async function retryFailedActions() {
  try {
    const retryActions = await getActionsByStatus(ACTION_STATUS.RETRY);
    const failedActions = await getActionsByStatus(ACTION_STATUS.FAILED);

    const actionsToRetry = [...retryActions, ...failedActions.filter(a => a.attemptCount < a.maxAttempts)];

    if (actionsToRetry.length === 0) {
      console.log('No failed actions to retry');
      return { total: 0, successful: 0, failed: 0 };
    }

    console.log(`🔄 Retrying ${actionsToRetry.length} failed actions...`);

    const results = {
      total: actionsToRetry.length,
      successful: 0,
      failed: 0
    };

    for (const action of actionsToRetry) {
      try {
        // Reset to pending
        await updateActionStatus(action._id, ACTION_STATUS.PENDING);

        // Process
        await processAction(action);

        // Mark as completed
        await updateActionStatus(action._id, ACTION_STATUS.COMPLETED);

        results.successful++;
      } catch (error) {
        const attemptCount = action.attemptCount + 1;

        if (attemptCount >= action.maxAttempts) {
          await updateActionStatus(action._id, ACTION_STATUS.FAILED, error);
          results.failed++;
        } else {
          await updateActionStatus(action._id, ACTION_STATUS.RETRY, error);
        }
      }
    }

    console.log(`✅ Retry complete: ${results.successful} successful, ${results.failed} failed`);
    return results;

  } catch (error) {
    console.error('Error retrying failed actions:', error);
    throw error;
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  try {
    const allActions = await getAllQueuedActions();

    const stats = {
      total: allActions.length,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      retry: 0,
      byType: {}
    };

    allActions.forEach(action => {
      // Count by status
      stats[action.status] = (stats[action.status] || 0) + 1;

      // Count by type
      if (!stats.byType[action.actionType]) {
        stats.byType[action.actionType] = 0;
      }
      stats.byType[action.actionType]++;
    });

    return stats;
  } catch (error) {
    console.error('Error getting queue stats:', error);
    return {
      total: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      retry: 0,
      byType: {}
    };
  }
}

/**
 * Clear all actions (use with caution!)
 */
export async function clearAllActions() {
  try {
    const allActions = await getAllQueuedActions();

    for (const action of allActions) {
      await deleteAction(action._id);
    }

    console.log(`🧹 Cleared ${allActions.length} actions from queue`);
    return allActions.length;
  } catch (error) {
    console.error('Error clearing all actions:', error);
    return 0;
  }
}

export default {
  // Queue management
  queueAction,
  getPendingActions,
  getActionsByStatus,
  getActionsByType,
  getAllQueuedActions,

  // Action operations
  updateActionStatus,
  deleteAction,
  clearOldActions,

  // Processing
  processPendingActions,
  retryFailedActions,

  // Stats
  getQueueStats,

  // Cleanup
  clearAllActions,

  // Constants
  ACTION_TYPES,
  ACTION_STATUS,
};
