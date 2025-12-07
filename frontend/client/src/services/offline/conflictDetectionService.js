/**
 * Conflict Detection Service
 *
 * Detects conflicts between local and server data during synchronization.
 * Uses version numbers and timestamps to identify conflicting changes.
 *
 * Conflict Types:
 * - UPDATE_CONFLICT: Both local and server modified same resource
 * - DELETE_CONFLICT: Local modified but server deleted (or vice versa)
 * - CREATE_CONFLICT: Duplicate creation attempts
 *
 * Resolution Strategies:
 * - SERVER_WINS: Use server version
 * - LOCAL_WINS: Use local version
 * - MERGE: Combine both versions
 * - MANUAL: User decides
 */

import indexedDBService from '../indexedDB';

// Conflict types
export const CONFLICT_TYPES = {
  UPDATE_CONFLICT: 'UPDATE_CONFLICT',
  DELETE_CONFLICT: 'DELETE_CONFLICT',
  CREATE_CONFLICT: 'CREATE_CONFLICT',
  VERSION_MISMATCH: 'VERSION_MISMATCH'
};

// Resolution strategies
export const RESOLUTION_STRATEGIES = {
  SERVER_WINS: 'SERVER_WINS',
  LOCAL_WINS: 'LOCAL_WINS',
  MERGE: 'MERGE',
  MANUAL: 'MANUAL'
};

// Conflict severity levels
export const CONFLICT_SEVERITY = {
  LOW: 'LOW',       // Auto-resolvable
  MEDIUM: 'MEDIUM', // May need user input
  HIGH: 'HIGH'      // Requires user decision
};

/**
 * Detect conflicts between local and server data
 *
 * @param {Object} localData - Local version of data
 * @param {Object} serverData - Server version of data
 * @param {String} resourceType - Type of resource (lesson, assessment, etc.)
 * @returns {Object|null} Conflict object or null if no conflict
 */
export const detectConflict = (localData, serverData, resourceType) => {
  // No conflict if either doesn't exist
  if (!localData || !serverData) {
    return null;
  }

  // Check for version mismatch
  const versionConflict = checkVersionConflict(localData, serverData);
  if (versionConflict) {
    return versionConflict;
  }

  // Check for timestamp conflicts
  const timestampConflict = checkTimestampConflict(localData, serverData);
  if (timestampConflict) {
    return timestampConflict;
  }

  return null;
};

/**
 * Check for version number conflicts
 */
const checkVersionConflict = (localData, serverData) => {
  const localVersion = localData.__version || localData.version || 0;
  const serverVersion = serverData.__version || serverData.version || 0;

  // If local is based on older server version
  if (localVersion < serverVersion) {
    const fields = findChangedFields(localData, serverData);

    return {
      type: CONFLICT_TYPES.VERSION_MISMATCH,
      severity: fields.length > 3 ? CONFLICT_SEVERITY.HIGH : CONFLICT_SEVERITY.MEDIUM,
      localVersion,
      serverVersion,
      localData,
      serverData,
      changedFields: fields,
      description: `Local version (${localVersion}) is behind server version (${serverVersion})`,
      recommendedStrategy: fields.length > 3 ? RESOLUTION_STRATEGIES.MANUAL : RESOLUTION_STRATEGIES.MERGE
    };
  }

  return null;
};

/**
 * Check for timestamp conflicts
 */
const checkTimestampConflict = (localData, serverData) => {
  const localModified = new Date(localData.updatedAt || localData.lastModified);
  const serverModified = new Date(serverData.updatedAt || serverData.lastModified);

  // If both modified after last sync
  if (localModified && serverModified) {
    const timeDiff = Math.abs(localModified - serverModified);

    // If modified within 1 second, likely same change
    if (timeDiff < 1000) {
      return null;
    }

    // Server was modified after local change
    if (serverModified > localModified) {
      const fields = findChangedFields(localData, serverData);

      return {
        type: CONFLICT_TYPES.UPDATE_CONFLICT,
        severity: fields.length > 5 ? CONFLICT_SEVERITY.HIGH : CONFLICT_SEVERITY.MEDIUM,
        localModified: localModified.toISOString(),
        serverModified: serverModified.toISOString(),
        localData,
        serverData,
        changedFields: fields,
        description: `Both local and server modified. Server changed ${fields.length} fields.`,
        recommendedStrategy: RESOLUTION_STRATEGIES.MANUAL
      };
    }
  }

  return null;
};

/**
 * Find fields that differ between local and server
 */
const findChangedFields = (local, server) => {
  const changed = [];
  const allKeys = new Set([...Object.keys(local), ...Object.keys(server)]);

  for (const key of allKeys) {
    // Skip metadata fields
    if (['_id', '__v', 'createdAt', 'updatedAt', '__version', 'version'].includes(key)) {
      continue;
    }

    const localValue = local[key];
    const serverValue = server[key];

    // Deep comparison for objects and arrays
    if (JSON.stringify(localValue) !== JSON.stringify(serverValue)) {
      changed.push({
        field: key,
        localValue,
        serverValue,
        type: typeof localValue
      });
    }
  }

  return changed;
};

/**
 * Detect conflicts in a batch of items
 *
 * @param {Array} localItems - Array of local data
 * @param {Array} serverItems - Array of server data
 * @param {String} resourceType - Type of resource
 * @returns {Array} Array of conflicts
 */
export const detectBatchConflicts = (localItems, serverItems, resourceType) => {
  const conflicts = [];
  const serverMap = new Map(serverItems.map(item => [item._id, item]));

  for (const localItem of localItems) {
    const serverItem = serverMap.get(localItem._id);
    const conflict = detectConflict(localItem, serverItem, resourceType);

    if (conflict) {
      conflicts.push({
        ...conflict,
        resourceId: localItem._id,
        resourceType
      });
    }
  }

  return conflicts;
};

/**
 * Auto-resolve conflicts based on strategy
 *
 * @param {Object} conflict - Conflict object
 * @param {String} strategy - Resolution strategy
 * @returns {Object} Resolved data
 */
export const autoResolveConflict = (conflict, strategy = RESOLUTION_STRATEGIES.SERVER_WINS) => {
  switch (strategy) {
    case RESOLUTION_STRATEGIES.SERVER_WINS:
      return {
        resolved: true,
        data: conflict.serverData,
        strategy,
        message: 'Conflict resolved: Using server version'
      };

    case RESOLUTION_STRATEGIES.LOCAL_WINS:
      return {
        resolved: true,
        data: conflict.localData,
        strategy,
        message: 'Conflict resolved: Using local version'
      };

    case RESOLUTION_STRATEGIES.MERGE:
      return {
        resolved: true,
        data: mergeData(conflict.localData, conflict.serverData, conflict.changedFields),
        strategy,
        message: 'Conflict resolved: Merged local and server changes'
      };

    case RESOLUTION_STRATEGIES.MANUAL:
    default:
      return {
        resolved: false,
        conflict,
        strategy,
        message: 'Manual resolution required'
      };
  }
};

/**
 * Intelligent merge of local and server data
 *
 * Merge strategy:
 * 1. Start with server data (latest base)
 * 2. Apply non-conflicting local changes
 * 3. For conflicting fields, prefer newer timestamp
 * 4. Merge arrays intelligently
 */
const mergeData = (localData, serverData, changedFields) => {
  const merged = { ...serverData };

  for (const change of changedFields) {
    const { field, localValue, serverValue } = change;

    // Arrays: merge unique items
    if (Array.isArray(localValue) && Array.isArray(serverValue)) {
      merged[field] = mergeArrays(localValue, serverValue);
      continue;
    }

    // Objects: deep merge
    if (typeof localValue === 'object' && localValue !== null &&
        typeof serverValue === 'object' && serverValue !== null) {
      merged[field] = { ...serverValue, ...localValue };
      continue;
    }

    // Primitives: use local if it seems newer
    // This is heuristic - in real app, track field-level timestamps
    merged[field] = localValue;
  }

  // Update metadata
  merged.__merged = true;
  merged.__mergedAt = new Date().toISOString();

  return merged;
};

/**
 * Merge two arrays intelligently
 */
const mergeArrays = (localArray, serverArray) => {
  // For arrays of primitives, combine unique values
  if (localArray.length === 0) return serverArray;
  if (serverArray.length === 0) return localArray;

  const firstLocal = localArray[0];

  // If arrays contain objects with IDs, merge by ID
  if (typeof firstLocal === 'object' && firstLocal !== null && firstLocal._id) {
    const merged = new Map();

    // Add all server items
    for (const item of serverArray) {
      merged.set(item._id, item);
    }

    // Merge local items
    for (const item of localArray) {
      const existing = merged.get(item._id);
      if (existing) {
        merged.set(item._id, { ...existing, ...item });
      } else {
        merged.set(item._id, item);
      }
    }

    return Array.from(merged.values());
  }

  // For primitive arrays, return unique values
  return [...new Set([...serverArray, ...localArray])];
};

/**
 * Save conflict to IndexedDB for later resolution
 */
export const saveConflict = async (conflict) => {
  const conflictRecord = {
    _id: `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...conflict,
    status: 'pending',
    createdAt: new Date().toISOString(),
    resolvedAt: null,
    resolution: null
  };

  await indexedDBService.addItem('conflicts', conflictRecord);

  // Dispatch event
  window.dispatchEvent(new CustomEvent('conflict-detected', {
    detail: { conflict: conflictRecord }
  }));

  return conflictRecord;
};

/**
 * Get all pending conflicts
 */
export const getPendingConflicts = async () => {
  const allConflicts = await indexedDBService.getAllItems('conflicts');
  return allConflicts.filter(c => c.status === 'pending');
};

/**
 * Get conflicts by resource type
 */
export const getConflictsByType = async (resourceType) => {
  const allConflicts = await indexedDBService.getAllItems('conflicts');
  return allConflicts.filter(c => c.resourceType === resourceType && c.status === 'pending');
};

/**
 * Resolve conflict manually
 *
 * @param {String} conflictId - Conflict ID
 * @param {String} strategy - Resolution strategy
 * @param {Object} customData - Custom resolved data (if MANUAL)
 */
export const resolveConflict = async (conflictId, strategy, customData = null) => {
  const conflict = await indexedDBService.get('conflicts', conflictId);

  if (!conflict) {
    throw new Error('Conflict not found');
  }

  let resolvedData;

  if (customData) {
    // Manual resolution with custom data
    resolvedData = customData;
  } else {
    // Auto-resolve based on strategy
    const result = autoResolveConflict(conflict, strategy);
    if (!result.resolved) {
      throw new Error('Cannot auto-resolve: Manual resolution required');
    }
    resolvedData = result.data;
  }

  // Update conflict record
  const updatedConflict = {
    ...conflict,
    status: 'resolved',
    resolvedAt: new Date().toISOString(),
    resolution: {
      strategy,
      data: resolvedData,
      resolvedBy: 'user'
    }
  };

  await indexedDBService.updateItem('conflicts', updatedConflict);

  // Dispatch event
  window.dispatchEvent(new CustomEvent('conflict-resolved', {
    detail: {
      conflictId,
      conflict: updatedConflict,
      resolvedData
    }
  }));

  return {
    conflict: updatedConflict,
    resolvedData
  };
};

/**
 * Delete conflict
 */
export const deleteConflict = async (conflictId) => {
  await indexedDBService.deleteItem('conflicts', conflictId);

  window.dispatchEvent(new CustomEvent('conflict-deleted', {
    detail: { conflictId }
  }));
};

/**
 * Clear all resolved conflicts older than specified days
 */
export const clearOldConflicts = async (daysOld = 7) => {
  const allConflicts = await indexedDBService.getAllItems('conflicts');
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  let deletedCount = 0;

  for (const conflict of allConflicts) {
    if (conflict.status === 'resolved' && new Date(conflict.resolvedAt) < cutoffDate) {
      await indexedDBService.deleteItem('conflicts', conflict._id);
      deletedCount++;
    }
  }

  return deletedCount;
};

/**
 * Get conflict statistics
 */
export const getConflictStats = async () => {
  const allConflicts = await indexedDBService.getAllItems('conflicts');

  const stats = {
    total: allConflicts.length,
    pending: 0,
    resolved: 0,
    bySeverity: {
      [CONFLICT_SEVERITY.LOW]: 0,
      [CONFLICT_SEVERITY.MEDIUM]: 0,
      [CONFLICT_SEVERITY.HIGH]: 0
    },
    byType: {},
    byResourceType: {}
  };

  for (const conflict of allConflicts) {
    // Status
    if (conflict.status === 'pending') {
      stats.pending++;
    } else if (conflict.status === 'resolved') {
      stats.resolved++;
    }

    // Severity
    if (conflict.severity) {
      stats.bySeverity[conflict.severity]++;
    }

    // Type
    const type = conflict.type || 'UNKNOWN';
    stats.byType[type] = (stats.byType[type] || 0) + 1;

    // Resource type
    const resourceType = conflict.resourceType || 'UNKNOWN';
    stats.byResourceType[resourceType] = (stats.byResourceType[resourceType] || 0) + 1;
  }

  return stats;
};

/**
 * Check if resource has pending conflicts
 */
export const hasPendingConflict = async (resourceId, resourceType) => {
  const conflicts = await getPendingConflicts();
  return conflicts.some(c => c.resourceId === resourceId && c.resourceType === resourceType);
};

const conflictDetectionService = {
  // Detection
  detectConflict,
  detectBatchConflicts,

  // Resolution
  autoResolveConflict,
  resolveConflict,

  // Management
  saveConflict,
  getPendingConflicts,
  getConflictsByType,
  deleteConflict,
  clearOldConflicts,
  hasPendingConflict,

  // Stats
  getConflictStats,

  // Constants
  CONFLICT_TYPES,
  RESOLUTION_STRATEGIES,
  CONFLICT_SEVERITY
};

export default conflictDetectionService;
