import { getCacheClient } from '../utils/cache.js';
import logger from '../utils/logger.js';

/**
 * Express middleware that intercepts GET requests and serves them from Redis if available.
 * If a cache miss occurs, it intercepts the `res.json` response, caches it, and then passes it along.
 * 
 * @param {number} ttlSeconds - Duration to cache the payload within Redis.
 */
export function routeCache(ttlSeconds = 300) {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') return next();

    const cache = getCacheClient();
    
    // If Redis is not available, bypass silently
    if (!cache) return next();

    // Generate a secure cache key based on the URL and tenant context
    const tenantId = req.user?.tenantId || 'global';
    const key = `cache:${tenantId}:${req.originalUrl}`;

    try {
      const cachedRecord = await cache.get(key);
      if (cachedRecord) {
        // Cache Hit: Bypass the controller entirely
        res.setHeader('X-Cache', 'HIT');
        return res.json(JSON.parse(cachedRecord));
      }

      // Cache Miss
      res.setHeader('X-Cache', 'MISS');
      const originalJson = res.json.bind(res);

      res.json = (body) => {
        // Fire & Forget set commands upon successful response
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cache.set(key, JSON.stringify(body), 'EX', ttlSeconds).catch(err => logger.error({ err }, "Cache middleware set error"));
        }
        return originalJson(body);
      };

      next();
    } catch (error) {
      logger.error(`[Redis Middleware Error] on key ${key}:`, error);
      next(); // Fail gracefully to postgres lookup
    }
  };
}
