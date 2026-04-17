/**
 * Native Memory Cache
 * Provides a localized, zero-dependency proxy fallback for rote route caching.
 * Emulates the base signature of an `ioredis` client so middleware arrays hook natively.
 */
class MemoryCache {
  constructor() {
    this.store = new Map();
  }
  
  async get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }
  
  async set(key, value, mode, ttlSeconds) {
    // Mimics the typical Redis EX (expire in seconds) footprint
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.store.set(key, { value, expiresAt });
    return 'OK';
  }
}

const nativeCache = new MemoryCache();

export function getCacheClient() {
  return nativeCache;
}

export async function fetchWithCache(key, ttlSeconds, fetchFn) {
  const cache = getCacheClient();

  try {
    const cachedRecord = await cache.get(key);
    if (cachedRecord) {
      return JSON.parse(cachedRecord);
    }

    // Execute standard repository logic
    const freshPayload = await fetchFn();

    // Fire & Forget set commands
    cache.set(key, JSON.stringify(freshPayload), 'EX', ttlSeconds).catch(err => logger.error({ err }, "Cache set error"));

    return freshPayload;
  } catch (error) {
    logger.error(`[Memory Interceptor Warning] Cache failure on key ${key}:`, error);
    // Hard failback to actual database lookup if Memory chokes
    return await fetchFn();
  }
}
