/**
 * IndexedDB Wrapper Service
 * Provides a clean API for offline data storage
 * Database: ai-lesson-planning-offline
 * Version: 1
 */

const DB_NAME = 'ai-lesson-planning-offline';
const DB_VERSION = 3; // Incremented to fix offlineQueue schema (id vs _id issue)

// Object Store Names
export const STORES = {
  LESSONS: 'lessons',
  ASSESSMENTS: 'assessments',
  RUBRICS: 'rubrics',
  CLASSES: 'classes',
  STUDENTS: 'students',
  OFFLINE_QUEUE: 'offlineQueue',
  METADATA: 'metadata',
  CONFLICTS: 'conflicts',         // Phase 5: Conflict tracking
  SYNC_HISTORY: 'syncHistory'     // Phase 5: Sync history
};

/**
 * Initialize and open the IndexedDB database
 * Creates all necessary object stores if they don't exist
 */
export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const oldVersion = event.oldVersion;
      const newVersion = event.newVersion;

      // Migration from version 2 to 3: Clear offlineQueue due to schema change (id vs _id)
      if (oldVersion === 2 && newVersion === 3) {
        const transaction = event.target.transaction;
        if (db.objectStoreNames.contains(STORES.OFFLINE_QUEUE)) {
          const queueStore = transaction.objectStore(STORES.OFFLINE_QUEUE);
          queueStore.clear();
        }
      }

      // Store: Lesson Plans
      if (!db.objectStoreNames.contains(STORES.LESSONS)) {
        const lessonStore = db.createObjectStore(STORES.LESSONS, {
          keyPath: '_id'
        });
        lessonStore.createIndex('classId', 'classId', { unique: false });
        lessonStore.createIndex('lessonDate', 'lessonDate', { unique: false });
        lessonStore.createIndex('grade', 'grade', { unique: false });
        lessonStore.createIndex('downloadedAt', 'downloadedAt', { unique: false });
        lessonStore.createIndex('lastModified', 'lastModified', { unique: false });
      }

      // Store: Assessments
      if (!db.objectStoreNames.contains(STORES.ASSESSMENTS)) {
        const assessmentStore = db.createObjectStore(STORES.ASSESSMENTS, {
          keyPath: '_id'
        });
        assessmentStore.createIndex('lessonPlanId', 'lessonPlanId', { unique: false });
        assessmentStore.createIndex('classId', 'classId', { unique: false });
        assessmentStore.createIndex('assessmentType', 'assessmentType', { unique: false });
        assessmentStore.createIndex('downloadedAt', 'downloadedAt', { unique: false });
      }

      // Store: Rubrics (part of assessments but can be stored separately for quick access)
      if (!db.objectStoreNames.contains(STORES.RUBRICS)) {
        const rubricStore = db.createObjectStore(STORES.RUBRICS, {
          keyPath: '_id'
        });
        rubricStore.createIndex('assessmentId', 'assessmentId', { unique: false });
        rubricStore.createIndex('downloadedAt', 'downloadedAt', { unique: false });
      }

      // Store: Classes
      if (!db.objectStoreNames.contains(STORES.CLASSES)) {
        const classStore = db.createObjectStore(STORES.CLASSES, {
          keyPath: '_id'
        });
        classStore.createIndex('className', 'className', { unique: false });
        classStore.createIndex('grade', 'grade', { unique: false });
        classStore.createIndex('subject', 'subject', { unique: false });
        classStore.createIndex('downloadedAt', 'downloadedAt', { unique: false });
      }

      // Store: Students
      if (!db.objectStoreNames.contains(STORES.STUDENTS)) {
        const studentStore = db.createObjectStore(STORES.STUDENTS, {
          keyPath: '_id'
        });
        studentStore.createIndex('classId', 'classId', { unique: false });
        studentStore.createIndex('studentId', 'studentId', { unique: true });
        studentStore.createIndex('name', 'name', { unique: false });
        studentStore.createIndex('downloadedAt', 'downloadedAt', { unique: false });
      }

      // Store: Offline Queue (for pending actions when offline)
      if (!db.objectStoreNames.contains(STORES.OFFLINE_QUEUE)) {
        const queueStore = db.createObjectStore(STORES.OFFLINE_QUEUE, {
          keyPath: 'id',
          autoIncrement: true
        });
        queueStore.createIndex('timestamp', 'timestamp', { unique: false });
        queueStore.createIndex('status', 'status', { unique: false });
        queueStore.createIndex('actionType', 'actionType', { unique: false });
        queueStore.createIndex('retryCount', 'retryCount', { unique: false });
      }

      // Store: Metadata (for tracking downloads, sync status, etc.)
      if (!db.objectStoreNames.contains(STORES.METADATA)) {
        const metadataStore = db.createObjectStore(STORES.METADATA, {
          keyPath: 'key'
        });
        metadataStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      // Phase 5: Store: Conflicts (for sync conflict resolution)
      if (!db.objectStoreNames.contains(STORES.CONFLICTS)) {
        const conflictsStore = db.createObjectStore(STORES.CONFLICTS, {
          keyPath: '_id'
        });
        conflictsStore.createIndex('status', 'status', { unique: false });
        conflictsStore.createIndex('resourceType', 'resourceType', { unique: false });
        conflictsStore.createIndex('severity', 'severity', { unique: false });
        conflictsStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // Phase 5: Store: Sync History (for tracking sync operations)
      if (!db.objectStoreNames.contains(STORES.SYNC_HISTORY)) {
        const syncHistoryStore = db.createObjectStore(STORES.SYNC_HISTORY, {
          keyPath: '_id'
        });
        syncHistoryStore.createIndex('timestamp', 'timestamp', { unique: false });
        syncHistoryStore.createIndex('status', 'status', { unique: false });
        syncHistoryStore.createIndex('syncType', 'syncType', { unique: false });
      }

    };
  });
}

/**
 * Generic CRUD Operations
 */

/**
 * Add a single item to a store
 * @param {string} storeName - Name of the object store
 * @param {object} data - Data to add
 */
export async function addItem(storeName, data) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    // Add download timestamp if not present
    const itemToAdd = {
      ...data,
      downloadedAt: data.downloadedAt || new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    const request = store.add(itemToAdd);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      console.error(`[IndexedDB] Error adding item to ${storeName}:`, request.error);
      reject(request.error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Update an existing item in a store
 * @param {string} storeName - Name of the object store
 * @param {object} data - Data to update (must include key)
 */
export async function updateItem(storeName, data) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    // Update last modified timestamp
    const itemToUpdate = {
      ...data,
      lastModified: new Date().toISOString()
    };

    const request = store.put(itemToUpdate);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      console.error(`[IndexedDB] Error updating item in ${storeName}:`, request.error);
      reject(request.error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Get a single item by key
 * @param {string} storeName - Name of the object store
 * @param {string} key - Key of the item to retrieve
 */
export async function getItem(storeName, key) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      console.error(`[IndexedDB] Error getting item from ${storeName}:`, request.error);
      reject(request.error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Get all items from a store
 * @param {string} storeName - Name of the object store
 */
export async function getAllItems(storeName) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      console.error(`[IndexedDB] Error getting all items from ${storeName}:`, request.error);
      reject(request.error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Delete an item by key
 * @param {string} storeName - Name of the object store
 * @param {string} key - Key of the item to delete
 */
export async function deleteItem(storeName, key) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => {
      resolve(key);
    };

    request.onerror = () => {
      console.error(`[IndexedDB] Error deleting item from ${storeName}:`, request.error);
      reject(request.error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Clear all items from a store
 * @param {string} storeName - Name of the object store
 */
export async function clearStore(storeName) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      console.error(`[IndexedDB] Error clearing ${storeName}:`, request.error);
      reject(request.error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Query items by index
 * @param {string} storeName - Name of the object store
 * @param {string} indexName - Name of the index
 * @param {any} value - Value to query
 */
export async function getByIndex(storeName, indexName, value) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      console.error(`[IndexedDB] Error querying ${storeName}:`, request.error);
      reject(request.error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Count items in a store
 * @param {string} storeName - Name of the object store
 */
export async function countItems(storeName) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.count();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      console.error(`[IndexedDB] Error counting items in ${storeName}:`, request.error);
      reject(request.error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Batch add multiple items
 * @param {string} storeName - Name of the object store
 * @param {array} items - Array of items to add
 */
export async function addBatch(storeName, items) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    items.forEach(item => {
      const itemToAdd = {
        ...item,
        downloadedAt: item.downloadedAt || new Date().toISOString(),
        lastModified: new Date().toISOString()
      };
      store.add(itemToAdd);
    });

    transaction.oncomplete = () => {
      db.close();
      resolve(items.length);
    };

    transaction.onerror = () => {
      reject(transaction.error);
    };
  });
}

/**
 * Check if database is supported
 */
export function isIndexedDBSupported() {
  return 'indexedDB' in window;
}

/**
 * Delete the entire database (use with caution)
 */
export async function deleteDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

const indexedDBService = {
  openDB,
  addItem,
  updateItem,
  getItem,
  getAllItems,
  deleteItem,
  clearStore,
  getByIndex,
  countItems,
  addBatch,
  isIndexedDBSupported,
  deleteDatabase,
  STORES
};

export default indexedDBService;
