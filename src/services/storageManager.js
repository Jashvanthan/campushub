/**
 * CampusHub Enterprise Storage Manager & High-Performance Persistence Engine
 * 
 * Optimized for large-scale multi-user data:
 * 1. Multi-Tier Cache (L1 Fast Memory + L2 Debounced IndexedDB/LocalForage)
 * 2. Asynchronous Batched & Debounced Persistence (prevents UI freeze on heavy write bursts)
 * 3. Partitioned Namespaces (users, posts, ideas, workspaces, chat, files, drafts)
 * 4. Quota Monitoring, Compaction & Auto-Pruning for large datasets
 * 5. Resilient Fallbacks (IndexedDB -> LocalStorage -> Memory)
 */

import localforage from 'localforage';

// Configure optimized LocalForage instance
localforage.config({
  name: 'CampusHubApp',
  storeName: 'campushub_datastore',
  description: 'CampusHub Unified Local Cache & Offline Datastore'
});

class StorageManager {
  constructor() {
    this.memoryStore = new Map();
    this.pendingWrites = new Map();
    this.debounceTimers = new Map();
    this.isInitialized = false;
    this.initPromise = null;
    this.DEBOUNCE_DELAY_MS = 300; // 300ms batch debounce
  }

  /**
   * Initialize and warm memory cache from IndexedDB
   */
  async init() {
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const keys = await localforage.keys();
        for (const key of keys) {
          const val = await localforage.getItem(key);
          if (val !== null && val !== undefined) {
            this.memoryStore.set(key, val);
          }
        }
        this.isInitialized = true;
      } catch (err) {
        console.warn('[StorageManager] LocalForage init warning, falling back to memory/localStorage:', err);
        this.isInitialized = true;
      }
    })();

    return this.initPromise;
  }

  /**
   * Fast synchronous read from L1 memory store with fallback
   */
  getItemSync(key, defaultValue = null) {
    if (this.memoryStore.has(key)) {
      return this.memoryStore.get(key);
    }
    // Fallback to localStorage if available
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(key);
        if (raw) return JSON.parse(raw);
      }
    } catch (_) {}
    return defaultValue;
  }

  /**
   * Asynchronous read from storage with auto-caching
   */
  async getItem(key, defaultValue = null) {
    if (this.memoryStore.has(key)) {
      return this.memoryStore.get(key);
    }
    try {
      const val = await localforage.getItem(key);
      if (val !== null && val !== undefined) {
        this.memoryStore.set(key, val);
        return val;
      }
    } catch (err) {
      console.warn(`[StorageManager] Read error for key "${key}":`, err);
    }
    return defaultValue;
  }

  /**
   * High-performance debounced write (immediate memory update + queued background disk write)
   */
  setItem(key, value) {
    // 1. Instant L1 memory update for zero-latency UI rendering
    this.memoryStore.set(key, value);
    this.pendingWrites.set(key, value);

    // 2. Debounced background persistent write to prevent main-thread contention
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
    }

    const timer = setTimeout(() => {
      this.flushKey(key);
    }, this.DEBOUNCE_DELAY_MS);

    this.debounceTimers.set(key, timer);
  }

  /**
   * Flush single key to disk
   */
  async flushKey(key) {
    if (!this.pendingWrites.has(key)) return;
    const valueToPersist = this.pendingWrites.get(key);
    this.pendingWrites.delete(key);
    this.debounceTimers.delete(key);

    try {
      await localforage.setItem(key, valueToPersist);
    } catch (err) {
      console.warn(`[StorageManager] Persistent write error for "${key}":`, err);
      // Secondary fallback to localStorage for small critical keys
      try {
        if (typeof localStorage !== 'undefined' && typeof valueToPersist === 'object') {
          localStorage.setItem(key, JSON.stringify(valueToPersist));
        }
      } catch (_) {}
    }
  }

  /**
   * Immediately flush all pending memory writes to disk
   */
  async flushAll() {
    const promises = [];
    for (const key of Array.from(this.pendingWrites.keys())) {
      promises.push(this.flushKey(key));
    }
    await Promise.all(promises);
  }

  /**
   * Remove item from all storage tiers
   */
  async removeItem(key) {
    this.memoryStore.delete(key);
    this.pendingWrites.delete(key);
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
      this.debounceTimers.delete(key);
    }
    try {
      await localforage.removeItem(key);
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch (err) {
      console.warn(`[StorageManager] Remove error for "${key}":`, err);
    }
  }

  /**
   * Inspect current storage consumption & counts for large storage management
   */
  async getStorageStats() {
    const stats = {
      keysCount: this.memoryStore.size,
      stores: {},
      estimatedSizeBytes: 0
    };

    for (const [key, val] of this.memoryStore.entries()) {
      let count = 0;
      let approxSize = 0;
      try {
        const jsonStr = JSON.stringify(val);
        approxSize = jsonStr.length * 2; // UTF-16 bytes approx
        stats.estimatedSizeBytes += approxSize;
        if (Array.isArray(val)) count = val.length;
        else if (typeof val === 'object' && val !== null) count = Object.keys(val).length;
        else count = 1;
      } catch (_) {}

      stats.stores[key] = {
        count,
        approxSizeKB: (approxSize / 1024).toFixed(2)
      };
    }

    stats.totalSizeMB = (stats.estimatedSizeBytes / (1024 * 1024)).toFixed(2);
    return stats;
  }

  /**
   * Compact & prune old cache/ephemeral entries to keep storage lean and ultra-responsive
   */
  async compactStorage() {
    try {
      // 1. Prune notifications older than 100 items per user if needed
      const notifs = this.getItemSync('campushub_notifications');
      if (Array.isArray(notifs) && notifs.length > 200) {
        const pruned = notifs.slice(0, 100);
        this.setItem('campushub_notifications', pruned);
      }

      // 2. Prune ephemeral network cache
      await this.removeItem('campushub_network_cache');

      // 3. Flush everything
      await this.flushAll();
      return true;
    } catch (err) {
      console.error('[StorageManager] Storage compaction error:', err);
      return false;
    }
  }

  /**
   * Clear all app storage (Logout / Reset)
   */
  async clear() {
    this.memoryStore.clear();
    this.pendingWrites.clear();
    this.debounceTimers.forEach(t => clearTimeout(t));
    this.debounceTimers.clear();
    try {
      await localforage.clear();
    } catch (err) {
      console.warn('[StorageManager] LocalForage clear error:', err);
    }
  }
}

export const storageManager = new StorageManager();
