/**
 * Storage Quota Manager
 * Manages storage quota, monitors usage, and handles quota exceeded scenarios
 */

/**
 * Check if Storage API is supported
 */
export function isStorageApiSupported() {
  return 'storage' in navigator && 'estimate' in navigator.storage;
}

/**
 * Check if persistent storage is supported
 */
export function isPersistentStorageSupported() {
  return 'storage' in navigator && 'persist' in navigator.storage;
}

/**
 * Get storage estimate (usage and quota)
 */
export async function getStorageEstimate() {
  if (!isStorageApiSupported()) {
    console.warn('[StorageQuota] Storage API not supported');
    return null;
  }

  try {
    const estimate = await navigator.storage.estimate();

    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0,
      usageDetails: estimate.usageDetails || {},
      usageInBytes: estimate.usage || 0,
      quotaInBytes: estimate.quota || 0,
      usageInKB: ((estimate.usage || 0) / 1024).toFixed(2),
      quotaInKB: ((estimate.quota || 0) / 1024).toFixed(2),
      usageInMB: ((estimate.usage || 0) / (1024 * 1024)).toFixed(2),
      quotaInMB: ((estimate.quota || 0) / (1024 * 1024)).toFixed(2),
      usageInGB: ((estimate.usage || 0) / (1024 * 1024 * 1024)).toFixed(2),
      quotaInGB: ((estimate.quota || 0) / (1024 * 1024 * 1024)).toFixed(2),
      percentageUsed: estimate.quota ? ((estimate.usage / estimate.quota) * 100).toFixed(2) : 0,
      availableInBytes: (estimate.quota || 0) - (estimate.usage || 0),
      availableInMB: (((estimate.quota || 0) - (estimate.usage || 0)) / (1024 * 1024)).toFixed(2)
    };
  } catch (error) {
    console.error('[StorageQuota] Error getting storage estimate:', error);
    throw error;
  }
}

/**
 * Check if storage is persistent
 */
export async function isStoragePersisted() {
  if (!isPersistentStorageSupported()) {
    console.warn('[StorageQuota] Persistent storage not supported');
    return false;
  }

  try {
    return await navigator.storage.persisted();
  } catch (error) {
    console.error('[StorageQuota] Error checking persistence:', error);
    return false;
  }
}

/**
 * Request persistent storage
 */
export async function requestPersistentStorage() {
  if (!isPersistentStorageSupported()) {
    console.warn('[StorageQuota] Persistent storage not supported');
    return false;
  }

  try {
    const isPersisted = await navigator.storage.persist();
    console.log('[StorageQuota] Persistent storage granted:', isPersisted);
    return isPersisted;
  } catch (error) {
    console.error('[StorageQuota] Error requesting persistent storage:', error);
    return false;
  }
}

/**
 * Check if there's enough space for a download
 * @param {number} estimatedSize - Estimated size in bytes
 * @param {number} bufferPercentage - Safety buffer (default 10%)
 */
export async function hasEnoughSpace(estimatedSize, bufferPercentage = 10) {
  try {
    const estimate = await getStorageEstimate();
    if (!estimate) return true; // Can't check, assume it's okay

    const buffer = estimatedSize * (bufferPercentage / 100);
    const totalNeeded = estimatedSize + buffer;

    return estimate.availableInBytes >= totalNeeded;
  } catch (error) {
    console.error('[StorageQuota] Error checking available space:', error);
    return true; // Default to allowing the operation
  }
}

/**
 * Get storage status with color coding
 */
export async function getStorageStatus() {
  try {
    const estimate = await getStorageEstimate();
    if (!estimate) {
      return {
        status: 'unknown',
        color: 'gray',
        message: 'Storage information not available'
      };
    }

    const percentage = parseFloat(estimate.percentageUsed);

    if (percentage < 50) {
      return {
        status: 'healthy',
        color: 'green',
        message: 'Plenty of storage available',
        ...estimate
      };
    } else if (percentage < 75) {
      return {
        status: 'warning',
        color: 'yellow',
        message: 'Storage is filling up',
        ...estimate
      };
    } else if (percentage < 90) {
      return {
        status: 'critical',
        color: 'orange',
        message: 'Storage is almost full',
        ...estimate
      };
    } else {
      return {
        status: 'danger',
        color: 'red',
        message: 'Storage is critically low',
        ...estimate
      };
    }
  } catch (error) {
    console.error('[StorageQuota] Error getting storage status:', error);
    return {
      status: 'error',
      color: 'red',
      message: 'Error checking storage'
    };
  }
}

/**
 * Estimate size of data before download
 * @param {object} data - Data object to estimate
 */
export function estimateDataSize(data) {
  try {
    const jsonString = JSON.stringify(data);
    const bytes = new Blob([jsonString]).size;

    return {
      bytes,
      kb: (bytes / 1024).toFixed(2),
      mb: (bytes / (1024 * 1024)).toFixed(2)
    };
  } catch (error) {
    console.error('[StorageQuota] Error estimating data size:', error);
    return { bytes: 0, kb: 0, mb: 0 };
  }
}

/**
 * Calculate remaining downloads possible
 * @param {number} averageItemSize - Average size of one item in bytes
 */
export async function calculateRemainingDownloads(averageItemSize) {
  try {
    const estimate = await getStorageEstimate();
    if (!estimate) return Infinity;

    const remainingDownloads = Math.floor(estimate.availableInBytes / averageItemSize);
    return remainingDownloads;
  } catch (error) {
    console.error('[StorageQuota] Error calculating remaining downloads:', error);
    return 0;
  }
}

/**
 * Get breakdown of storage by type
 */
export async function getStorageBreakdown() {
  try {
    const estimate = await getStorageEstimate();
    if (!estimate || !estimate.usageDetails) {
      return null;
    }

    const breakdown = {};
    const details = estimate.usageDetails;

    for (const [key, value] of Object.entries(details)) {
      breakdown[key] = {
        bytes: value,
        kb: (value / 1024).toFixed(2),
        mb: (value / (1024 * 1024)).toFixed(2),
        percentage: estimate.usage ? ((value / estimate.usage) * 100).toFixed(2) : 0
      };
    }

    return breakdown;
  } catch (error) {
    console.error('[StorageQuota] Error getting storage breakdown:', error);
    return null;
  }
}

/**
 * Monitor storage and warn if low
 * @param {function} onLowStorage - Callback when storage is low
 * @param {number} threshold - Threshold percentage (default 80%)
 */
export async function monitorStorage(onLowStorage, threshold = 80) {
  try {
    const estimate = await getStorageEstimate();
    if (!estimate) return;

    const percentage = parseFloat(estimate.percentageUsed);

    if (percentage >= threshold && onLowStorage) {
      onLowStorage({
        percentage,
        estimate,
        message: `Storage is ${percentage}% full. Consider removing old content.`
      });
    }

    return percentage;
  } catch (error) {
    console.error('[StorageQuota] Error monitoring storage:', error);
    return 0;
  }
}

/**
 * Clear quota exceeded state
 * This function helps identify what can be cleaned up
 */
export async function getCleanupSuggestions() {
  const suggestions = {
    oldestContent: [],
    largestContent: [],
    unusedContent: [],
    totalSavings: 0
  };

  try {
    // Import offline services
    const { getAllLessonsOffline } = await import('./lessonOfflineService');
    const { getAllAssessmentsOffline } = await import('./assessmentOfflineService');

    // Get all content
    const lessons = await getAllLessonsOffline();
    const assessments = await getAllAssessmentsOffline();

    // Find oldest content (older than 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    lessons.forEach(lesson => {
      const downloadDate = new Date(lesson.downloadedAt);
      if (downloadDate < thirtyDaysAgo) {
        const size = estimateDataSize(lesson);
        suggestions.oldestContent.push({
          type: 'lesson',
          id: lesson._id,
          title: lesson.specificTopic || 'Untitled',
          downloadedAt: lesson.downloadedAt,
          size: size.mb
        });
        suggestions.totalSavings += parseInt(size.bytes);
      }
    });

    assessments.forEach(assessment => {
      const downloadDate = new Date(assessment.downloadedAt);
      if (downloadDate < thirtyDaysAgo) {
        const size = estimateDataSize(assessment);
        suggestions.oldestContent.push({
          type: 'assessment',
          id: assessment._id,
          title: assessment.title || 'Untitled',
          downloadedAt: assessment.downloadedAt,
          size: size.mb
        });
        suggestions.totalSavings += parseInt(size.bytes);
      }
    });

    // Find largest content
    const allContent = [
      ...lessons.map(l => ({ type: 'lesson', data: l, id: l._id, title: l.specificTopic })),
      ...assessments.map(a => ({ type: 'assessment', data: a, id: a._id, title: a.title }))
    ];

    allContent.forEach(item => {
      const size = estimateDataSize(item.data);
      item.size = parseFloat(size.mb);
    });

    suggestions.largestContent = allContent
      .sort((a, b) => b.size - a.size)
      .slice(0, 10)
      .map(item => ({
        type: item.type,
        id: item.id,
        title: item.title,
        size: item.size
      }));

    suggestions.totalSavingsInMB = (suggestions.totalSavings / (1024 * 1024)).toFixed(2);

    return suggestions;
  } catch (error) {
    console.error('[StorageQuota] Error getting cleanup suggestions:', error);
    return suggestions;
  }
}

/**
 * Format bytes to human-readable format
 * @param {number} bytes - Number of bytes
 * @param {number} decimals - Decimal places
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default {
  isStorageApiSupported,
  isPersistentStorageSupported,
  getStorageEstimate,
  isStoragePersisted,
  requestPersistentStorage,
  hasEnoughSpace,
  getStorageStatus,
  estimateDataSize,
  calculateRemainingDownloads,
  getStorageBreakdown,
  monitorStorage,
  getCleanupSuggestions,
  formatBytes
};
