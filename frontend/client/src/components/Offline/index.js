/**
 * Offline Components Index
 * Exports all offline-related UI components
 */

// Phase 2 Components
export { default as StorageIndicator } from './StorageIndicator';
export { default as OfflineContentManager } from './OfflineContentManager';
export { default as DownloadButton } from './DownloadButton';

// Phase 4 Components
export { default as OfflinePlaceholder, AIFeaturePlaceholder, SyncPendingPlaceholder, OnlineOnlyPlaceholder } from './OfflinePlaceholder';
export { default as PendingActionsViewer } from './PendingActionsViewer';

// Phase 5 Components
export { default as ConflictResolutionModal } from './ConflictResolutionModal';
export { default as ConflictsManager } from './ConflictsManager';
export { default as SyncProgress } from './SyncProgress';

// Phase 7 Components - UI/UX Enhancements
export { default as BulkDownloadButton } from './BulkDownloadButton';
export { default as OfflineBadge, OfflineBadgeCompact, OfflineBadgeWithCount } from './OfflineBadge';
export { default as SyncStatusBadge, SyncStatusBadgeCompact, SyncStatusWithProgress, LastSyncedIndicator } from './SyncStatusBadge';
export { default as OnlineFeatureGuard, withOnlineGuard, useFeatureAvailable } from './OnlineFeatureGuard';
