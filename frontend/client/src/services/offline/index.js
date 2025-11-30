/**
 * Offline Services Index
 * Exports all offline-related services
 */

// Core IndexedDB wrapper
export * from '../indexedDB';

// Specialized offline services
export * as lessonOfflineService from './lessonOfflineService';
export * as assessmentOfflineService from './assessmentOfflineService';
export * as rubricOfflineService from './rubricOfflineService';
export * as classOfflineService from './classOfflineService';
export * as studentOfflineService from './studentOfflineService';

// Main offline storage manager
export { default as offlineStorageManager } from './offlineStorageManager';
export * from './offlineStorageManager';

// Storage quota management
export { default as storageQuotaManager } from './storageQuotaManager';
export * from './storageQuotaManager';

// Offline action queue management
export { default as offlineQueueService } from './offlineQueueService';
export * from './offlineQueueService';

// Offline-aware service wrappers
export { default as offlineLessonService } from './offlineLessonService';
export { default as offlineAssessmentService } from './offlineAssessmentService';
