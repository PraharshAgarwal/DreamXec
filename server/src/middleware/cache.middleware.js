const redis = require('../config/redis');

// Process-level L1 Cache with TTL and capacity limits
const l1HttpCache = new Map();
const MAX_L1_ENTRIES = parseInt(process.env.CACHE_MAX_L1_ENTRIES || "2000", 10);
const L1_MAX_TTL_SECONDS = parseInt(process.env.CACHE_L1_MAX_TTL_SECONDS || "60", 10);

function getFromL1(key) {
  const item = l1HttpCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    l1HttpCache.delete(key);
    return null;
  }
  return item.body;
}

function setToL1(key, body, ttlSeconds) {
  if (l1HttpCache.size >= MAX_L1_ENTRIES) {
    const oldestKey = l1HttpCache.keys().next().value;
    if (oldestKey) l1HttpCache.delete(oldestKey);
  }
  l1HttpCache.set(key, {
    body,
    expiresAt: Date.now() + Math.min(ttlSeconds, L1_MAX_TTL_SECONDS) * 1000,
  });
}

function invalidateL1Pattern(pattern) {
  const cleanPattern = pattern.replace(/\*/g, '');
  for (const k of l1HttpCache.keys()) {
    if (k.includes(cleanPattern)) {
      l1HttpCache.delete(k);
    }
  }
}

/**
 * Express middleware for Two-Tier (L1 Memory + L2 Redis) Cache-Aside.
 * @param {number} ttlSeconds - Time-to-live in seconds (default: 60)
 * @param {Object} options - Options for cache key prefix and user-scoping
 */
function redisCacheMiddleware(ttlSeconds = 60, options = {}) {
  const { prefix = 'dx:http:', isUserScoped = false } = options;

  return async (req, res, next) => {
    // Bypass caching in test environment or for non-GET requests
    if (process.env.NODE_ENV === 'test' || req.method !== 'GET') {
      return next();
    }

    const userPart = isUserScoped && req.user?.id ? `u:${req.user.id}:` : 'anon:';
    const queryPart = Object.keys(req.query).length > 0 ? `?${JSON.stringify(req.query)}` : '';
    const cacheKey = `${prefix}${userPart}${req.baseUrl}${req.path}${queryPart}`;

    // Set standard HTTP caching headers
    res.set(
      'Cache-Control',
      `public, max-age=${ttlSeconds}, stale-while-revalidate=${Math.min(ttlSeconds * 2, 86400)}`
    );

    // 1. Check L1 Memory Cache (< 0.1ms)
    const l1Cached = getFromL1(cacheKey);
    if (l1Cached) {
      res.setHeader('X-Cache', 'L1-HIT');
      return res.status(200).json(l1Cached);
    }

    // 2. Check L2 Redis Cache (~20-50ms)
    try {
      if (redis && redis.get) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          res.setHeader('X-Cache', 'L2-HIT');
          const parsed = JSON.parse(cached);
          setToL1(cacheKey, parsed, ttlSeconds);
          return res.status(200).json(parsed);
        }
      }
    } catch (err) {
      console.warn(`[RedisCacheMiddleware] Cache read error for ${cacheKey}:`, err.message);
    }

    res.setHeader('X-Cache', 'MISS');

    // Intercept res.json to store in both L1 and L2
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setToL1(cacheKey, body, ttlSeconds);
        if (redis && redis.set) {
          redis
            .set(cacheKey, JSON.stringify(body), { EX: ttlSeconds })
            .catch((err) => {
              console.warn(`[RedisCacheMiddleware] Cache write error for ${cacheKey}:`, err.message);
            });
        }
      }
      return originalJson(body);
    };

    next();
  };
}

/**
 * Utility to invalidate cached endpoints by pattern across L1 and L2
 */
async function invalidateRedisPattern(pattern) {
  try {
    invalidateL1Pattern(pattern);
    if (!redis || !redis.scanIterator) return;
    const keysToDelete = [];
    for await (const key of redis.scanIterator({ MATCH: pattern, COUNT: 100 })) {
      keysToDelete.push(key);
    }
    if (keysToDelete.length > 0) {
      await redis.del(keysToDelete);
    }
  } catch (err) {
    console.warn(`[invalidateRedisPattern] Error invalidating ${pattern}:`, err.message);
  }
}

module.exports = {
  redisCacheMiddleware,
  invalidateRedisPattern,
  invalidateL1Pattern,
};

