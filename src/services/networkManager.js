/**
 * CampusHub Network Manager & Offline Sync Engine
 * 
 * Features:
 * 1. Online / Offline Connectivity Detection & Event Bus
 * 2. In-Memory Request Deduplication & Response Caching (Stale-While-Revalidate)
 * 3. Exponential Backoff Retry for Flaky Campus WiFi Connections
 * 4. Offline Action Queue (Store-and-Forward sync when connection resumes)
 * 5. Bandwidth & Payload Optimization
 */

import { storageManager } from './storageManager';


const QUEUE_STORAGE_KEY = 'campushub_offline_queue';
const CACHE_STORAGE_KEY = 'campushub_network_cache';
const DEFAULT_TTL_MS = 15 * 1000; // 15 second cache TTL for GET requests (short to avoid stale likes/comments)

class NetworkManager {
  constructor() {
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.listeners = new Set();
    this.inFlightRequests = new Map();
    this.memoryCache = new Map();
    this.isSyncingQueue = false;
    this.queue = [];

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleStatusChange(true));
      window.addEventListener('offline', () => this.handleStatusChange(false));
      
      // Load initial offline queue from storage
      this.loadQueueFromStorage();
    }
  }

  /**
   * Subscribe to network status changes
   */
  subscribe(callback) {
    this.listeners.add(callback);
    callback({
      isOnline: this.isOnline,
      pendingCount: this.queue.length,
      isSyncing: this.isSyncingQueue
    });
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    const status = {
      isOnline: this.isOnline,
      pendingCount: this.queue.length,
      isSyncing: this.isSyncingQueue
    };
    this.listeners.forEach(cb => {
      try { cb(status); } catch (e) { console.error(e); }
    });
  }

  async handleStatusChange(online) {
    this.isOnline = online;
    console.log(`[NetworkManager] Network status changed: ${online ? 'ONLINE' : 'OFFLINE'}`);
    this.notifyListeners();

    if (online) {
      // Automatically flush and replay queued actions
      await this.processOfflineQueue();
    }
  }

  async loadQueueFromStorage() {
    try {
      const stored = await storageManager.getItem(QUEUE_STORAGE_KEY);
      if (Array.isArray(stored)) {
        this.queue = stored;
        this.notifyListeners();
      }
    } catch (err) {
      console.warn('[NetworkManager] Failed to load offline queue:', err);
    }
  }

  async persistQueue() {
    try {
      storageManager.setItem(QUEUE_STORAGE_KEY, this.queue);
      this.notifyListeners();
    } catch (err) {
      console.warn('[NetworkManager] Failed to persist offline queue:', err);
    }
  }


  /**
   * Enqueue an action when network is unreachable
   */
  async enqueueAction(action) {
    const queueItem = {
      id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      endpoint: action.endpoint,
      method: action.method || 'POST',
      body: action.body,
      headers: action.headers,
      timestamp: new Date().toISOString(),
      retryCount: 0
    };

    this.queue.push(queueItem);
    await this.persistQueue();
    console.log(`[NetworkManager] Enqueued offline action for ${action.endpoint}. Total in queue: ${this.queue.length}`);
    return queueItem;
  }

  /**
   * Process and replay all queued actions when reconnected
   */
  async processOfflineQueue() {
    if (this.isSyncingQueue || this.queue.length === 0 || !this.isOnline) {
      return;
    }

    this.isSyncingQueue = true;
    this.notifyListeners();
    console.log(`[NetworkManager] Starting synchronization of ${this.queue.length} offline actions...`);

    const remainingQueue = [];

    for (const item of this.queue) {
      try {
        const response = await this.executeWithRetry(item.endpoint, {
          method: item.method,
          body: item.body ? JSON.stringify(item.body) : undefined,
          headers: item.headers
        }, 2); // 2 retries per item during flush

        if (response && (response.success || response.status < 400)) {
          console.log(`[NetworkManager] Successfully synced queued action: ${item.endpoint}`);
        } else {
          // If server returned non-retriable error (e.g. 400 invalid data), don't keep retrying forever
          console.warn(`[NetworkManager] Queued action ${item.endpoint} returned failure:`, response);
        }
      } catch (err) {
        console.error(`[NetworkManager] Failed to sync ${item.endpoint}:`, err.message);
        item.retryCount = (item.retryCount || 0) + 1;
        if (item.retryCount < 5) {
          remainingQueue.push(item);
        }
      }
    }

    this.queue = remainingQueue;
    this.isSyncingQueue = false;
    await this.persistQueue();
    console.log(`[NetworkManager] Queue processing complete. Remaining items: ${this.queue.length}`);
  }

  /**
   * Exponential backoff retry execution
   */
  async executeWithRetry(url, options = {}, maxRetries = 3) {
    let attempt = 0;
    let delay = 600; // start with 600ms

    while (attempt < maxRetries) {
      try {
        const response = await fetch(url, options);
        
        if (response.ok) {
          // 2xx success - parse and return JSON
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            return await response.json();
          }
          const text = await response.text();
          try { return JSON.parse(text); } catch (_) {
            return { success: true, message: text, status: response.status };
          }
        }

        if (response.status >= 400 && response.status < 500) {
          // Check for 401 on authenticated endpoints (exclude login/register which return 401 for wrong credentials)
          const isLoginOrRegister = url.includes('/auth/login') || url.includes('/auth/register');
          if (response.status === 401 && !isLoginOrRegister && typeof window !== 'undefined') {
            const hasToken = typeof localStorage !== 'undefined' && localStorage.getItem('campushub_jwt_token');
            if (hasToken) {
              window.dispatchEvent(new CustomEvent('campushub:token_expired', {
                detail: { endpoint: url, status: 401 }
              }));
            }
          }

          // 4xx Client error - read JSON body and return it (don't retry, don't throw)
          // This preserves error messages like "Incorrect password", "Post not found" etc.
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const body = await response.json();
            return { ...body, success: false, _httpStatus: response.status };
          }
          return { success: false, error: `HTTP ${response.status}`, _httpStatus: response.status };
        }

        // 5xx Server Error - retry with backoff
        throw new Error(`Server error HTTP ${response.status}`);
      } catch (err) {
        attempt++;
        if (attempt >= maxRetries) {
          throw err;
        }
        // Jittered exponential backoff
        const jitter = Math.random() * 200;
        await new Promise(r => setTimeout(r, delay + jitter));
        delay *= 2;
      }
    }
  }

  /**
   * Smart Fetch Wrapper with Caching & Deduplication
   */
  async smartFetch(endpoint, options = {}, config = {}) {
    const {
      ttl = DEFAULT_TTL_MS,
      useCache = true,
      allowOfflineQueue = true,
      maxRetries = 2
    } = config;

    const method = (options.method || 'GET').toUpperCase();
    const isGet = method === 'GET';
    // Include auth token in cache key so authenticated/unauthenticated requests never share cache
    const authHeader = (options.headers && options.headers['Authorization']) ? options.headers['Authorization'].slice(-16) : 'noauth';
    const cacheKey = `${method}:${endpoint}:${authHeader}`;

    // 1. If GET and cached & fresh, return from memory cache
    if (isGet && useCache) {
      const cached = this.memoryCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp < ttl)) {
        return cached.data;
      }
    }

    // 2. Request Deduplication: If already in flight, reuse existing promise
    if (isGet && this.inFlightRequests.has(cacheKey)) {
      return this.inFlightRequests.get(cacheKey);
    }

    // 3. Create request promise
    const requestPromise = (async () => {
      try {
        const data = await this.executeWithRetry(endpoint, options, maxRetries);

        // Cache successful GET responses
        if (isGet && useCache && data && data.success !== false) {
          this.memoryCache.set(cacheKey, {
            data,
            timestamp: Date.now()
          });
        } else if (!isGet && data && data.success !== false) {
          // Clear cache on successful mutations to prevent stale data
          this.memoryCache.clear();
        }

        return data;
      } catch (err) {
        console.warn(`[NetworkManager] Request failed for ${endpoint}:`, err.message);

        // Only network failures and 5xx server errors reach here now (4xx return directly)
        const isServerError = err.message.includes('Server error') || err.message.includes('50');
        const isNetworkFailure = !this.isOnline || err.message.toLowerCase().includes('failed to fetch') || err.message.toLowerCase().includes('network');

        // If offline or network dropped during mutation, enqueue for later sync
        if (!isGet && allowOfflineQueue && (isNetworkFailure || isServerError) && !this.isOnline) {
          let parsedBody = null;
          try {
            parsedBody = options.body ? JSON.parse(options.body) : null;
          } catch (e) {
            parsedBody = options.body;
          }

          await this.enqueueAction({
            endpoint,
            method,
            body: parsedBody,
            headers: options.headers
          });

          return {
            success: true,
            queued: true,
            message: 'Network offline: action saved locally and queued for synchronization.'
          };
        }

        // Return cached stale data if available as emergency fallback for GETs
        if (isGet && this.memoryCache.has(cacheKey)) {
          console.info(`[NetworkManager] Returning stale cached data for ${endpoint}`);
          return this.memoryCache.get(cacheKey).data;
        }

        return {
          success: false,
          error: err.message || 'Network connection unavailable',
          isOffline: !this.isOnline
        };
      } finally {
        this.inFlightRequests.delete(cacheKey);
      }
    })();

    if (isGet) {
      this.inFlightRequests.set(cacheKey, requestPromise);
    }

    return requestPromise;
  }

  /**
   * Clear in-memory network caches
   */
  clearCache() {
    this.memoryCache.clear();
    this.inFlightRequests.clear();
  }
}

export const networkManager = new NetworkManager();
