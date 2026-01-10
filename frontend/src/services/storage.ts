/**
 * IndexedDB Storage Service (T105)
 * 
 * Provides offline storage for workout sessions and pending operations.
 * Uses IndexedDB for persistent local storage.
 */

const DB_NAME = 'fitness-tracker';
const DB_VERSION = 1;

// Store names
const STORES = {
  SESSIONS: 'sessions',
  PENDING_OPS: 'pendingOperations',
  CACHE: 'apiCache',
} as const;

interface PendingOperation {
  id: string;
  type: 'complete_exercise' | 'undo_exercise' | 'update_session' | 'start_session';
  data: Record<string, unknown>;
  timestamp: number;
  retries: number;
}

interface CacheEntry {
  key: string;
  data: unknown;
  timestamp: number;
  expiresAt: number;
}

let dbInstance: IDBDatabase | null = null;

/**
 * Initialize the IndexedDB database.
 */
export async function initDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Sessions store - for offline session data
      if (!db.objectStoreNames.contains(STORES.SESSIONS)) {
        const sessionsStore = db.createObjectStore(STORES.SESSIONS, { keyPath: 'id' });
        sessionsStore.createIndex('status', 'status', { unique: false });
        sessionsStore.createIndex('date', 'date', { unique: false });
      }

      // Pending operations store - for sync queue
      if (!db.objectStoreNames.contains(STORES.PENDING_OPS)) {
        const opsStore = db.createObjectStore(STORES.PENDING_OPS, { keyPath: 'id' });
        opsStore.createIndex('timestamp', 'timestamp', { unique: false });
        opsStore.createIndex('type', 'type', { unique: false });
      }

      // API cache store - for caching API responses
      if (!db.objectStoreNames.contains(STORES.CACHE)) {
        const cacheStore = db.createObjectStore(STORES.CACHE, { keyPath: 'key' });
        cacheStore.createIndex('expiresAt', 'expiresAt', { unique: false });
      }
    };
  });
}

/**
 * Get the database instance.
 */
async function getDB(): Promise<IDBDatabase> {
  if (!dbInstance) {
    return initDB();
  }
  return dbInstance;
}

// ============================================================================
// Session Storage
// ============================================================================

/**
 * Save a session to local storage.
 */
export async function saveSession<T extends { id: string }>(session: T): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.SESSIONS, 'readwrite');
    const store = tx.objectStore(STORES.SESSIONS);
    const request = store.put(session);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get a session by ID from local storage.
 */
export async function getSession<T>(id: string): Promise<T | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.SESSIONS, 'readonly');
    const store = tx.objectStore(STORES.SESSIONS);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all sessions from local storage.
 */
export async function getAllSessions<T>(): Promise<T[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.SESSIONS, 'readonly');
    const store = tx.objectStore(STORES.SESSIONS);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete a session from local storage.
 */
export async function deleteSession(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.SESSIONS, 'readwrite');
    const store = tx.objectStore(STORES.SESSIONS);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ============================================================================
// Pending Operations Queue
// ============================================================================

/**
 * Add a pending operation to the queue.
 */
export async function addPendingOperation(op: Omit<PendingOperation, 'id' | 'timestamp' | 'retries'>): Promise<string> {
  const db = await getDB();
  const id = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const operation: PendingOperation = {
    ...op,
    id,
    timestamp: Date.now(),
    retries: 0,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PENDING_OPS, 'readwrite');
    const store = tx.objectStore(STORES.PENDING_OPS);
    const request = store.put(operation);

    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all pending operations sorted by timestamp.
 */
export async function getPendingOperations(): Promise<PendingOperation[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PENDING_OPS, 'readonly');
    const store = tx.objectStore(STORES.PENDING_OPS);
    const index = store.index('timestamp');
    const request = index.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Remove a pending operation after successful sync.
 */
export async function removePendingOperation(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PENDING_OPS, 'readwrite');
    const store = tx.objectStore(STORES.PENDING_OPS);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Update a pending operation (e.g., increment retries).
 */
export async function updatePendingOperation(id: string, updates: Partial<PendingOperation>): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PENDING_OPS, 'readwrite');
    const store = tx.objectStore(STORES.PENDING_OPS);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      if (!getRequest.result) {
        reject(new Error('Operation not found'));
        return;
      }
      const updated = { ...getRequest.result, ...updates };
      const putRequest = store.put(updated);
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

/**
 * Get the count of pending operations.
 */
export async function getPendingOperationCount(): Promise<number> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PENDING_OPS, 'readonly');
    const store = tx.objectStore(STORES.PENDING_OPS);
    const request = store.count();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ============================================================================
// API Cache
// ============================================================================

/**
 * Cache an API response.
 */
export async function cacheApiResponse(key: string, data: unknown, ttlMs: number = 5 * 60 * 1000): Promise<void> {
  const db = await getDB();
  const entry: CacheEntry = {
    key,
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + ttlMs,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.CACHE, 'readwrite');
    const store = tx.objectStore(STORES.CACHE);
    const request = store.put(entry);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get a cached API response if not expired.
 */
export async function getCachedApiResponse<T>(key: string): Promise<T | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.CACHE, 'readonly');
    const store = tx.objectStore(STORES.CACHE);
    const request = store.get(key);

    request.onsuccess = () => {
      const entry = request.result as CacheEntry | undefined;
      if (!entry) {
        resolve(null);
        return;
      }
      if (entry.expiresAt < Date.now()) {
        // Expired - clean up in background
        clearCacheEntry(key).catch(console.error);
        resolve(null);
        return;
      }
      resolve(entry.data as T);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear a cache entry.
 */
export async function clearCacheEntry(key: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.CACHE, 'readwrite');
    const store = tx.objectStore(STORES.CACHE);
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear all expired cache entries.
 */
export async function clearExpiredCache(): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.CACHE, 'readwrite');
    const store = tx.objectStore(STORES.CACHE);
    const index = store.index('expiresAt');
    const now = Date.now();
    const range = IDBKeyRange.upperBound(now);
    const request = index.openCursor(range);

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };
    request.onerror = () => reject(request.error);
  });
}

// ============================================================================
// Utility
// ============================================================================

/**
 * Clear all data from the database.
 */
export async function clearAllData(): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.SESSIONS, STORES.PENDING_OPS, STORES.CACHE], 'readwrite');
    
    tx.objectStore(STORES.SESSIONS).clear();
    tx.objectStore(STORES.PENDING_OPS).clear();
    tx.objectStore(STORES.CACHE).clear();

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Initialize DB on module load
initDB().catch(console.error);
