const redis = require('../config/redis');

/**
 * Get a cached value by key.
 * Returns parsed JS object or null on miss/error.
 */
const getCache = async (key) => {
  try {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data);
  } catch (err) {
    console.error(`[Cache] GET error for key "${key}":`, err.message);
    return null;
  }
};

/**
 * Store a value in cache.
 * @param {string} key
 * @param {any} value  — will be JSON.stringify'd
 * @param {number} ttl — seconds
 */
const setCache = async (key, value, ttl = 60) => {
  try {
    await redis.set(key, JSON.stringify(value), { EX: ttl });
  } catch (err) {
    console.error(`[Cache] SET error for key "${key}":`, err.message);
  }
};

/**
 * Delete one or more keys.
 * Supports a trailing * wildcard via SCAN, e.g. delCache('public:projects*')
 * @param {string} pattern
 */
const delCache = async (pattern) => {
  try {
    if (!pattern.includes('*')) {
      await redis.del(pattern);
      return;
    }
    // SCAN-based wildcard delete
    let cursor = 0;
    do {
      const reply = await redis.scan(cursor, { MATCH: pattern, COUNT: 100 });
      cursor = reply.cursor;
      if (reply.keys.length) {
        await redis.del(reply.keys);
      }
    } while (cursor !== 0);
  } catch (err) {
    console.error(`[Cache] DEL error for pattern "${pattern}":`, err.message);
  }
};

/**
 * Fetches and prints all stored data from Redis across all key types (string, hash, list, set, zset, stream).
 * @param {object} [options]
 * @param {string} [options.pattern='*'] Key matching pattern
 * @param {boolean} [options.logToConsole=true] Whether to output to console
 * @returns {Promise<Array<{ key: string, type: string, ttl: number, value: any }>>}
 */
const printAllRedisContents = async (options = {}) => {
  const { pattern = '*', logToConsole = true } = options;
  const results = [];

  try {
    for await (const key of redis.scanIterator({ MATCH: pattern, COUNT: 100 })) {
      const type = await redis.type(key);
      const ttl = await redis.ttl(key);
      let rawValue = null;

      switch (type) {
        case 'string':
          rawValue = await redis.get(key);
          try {
            rawValue = JSON.parse(rawValue);
          } catch {
            // Keep original string if not JSON
          }
          break;
        case 'hash':
          rawValue = await redis.hGetAll(key);
          break;
        case 'list':
          rawValue = await redis.lRange(key, 0, -1);
          break;
        case 'set':
          rawValue = await redis.sMembers(key);
          break;
        case 'zset':
          rawValue = await redis.zRangeWithScores(key, 0, -1);
          break;
        case 'stream':
          rawValue = await redis.xRange(key, '-', '+');
          break;
        default:
          rawValue = `<Unsupported type: ${type}>`;
      }

      const item = { key, type, ttl, value: rawValue };
      results.push(item);

      if (logToConsole) {
        console.log('--------------------------------------------------');
        console.log(`🔑 Key:   ${key}`);
        console.log(`🏷️  Type:  ${type}`);
        console.log(`⏱️  TTL:   ${ttl === -1 ? 'No Expiration' : ttl === -2 ? 'Key Not Found' : ttl + 's'}`);
        console.log('📦 Value:', typeof rawValue === 'object' ? JSON.stringify(rawValue, null, 2) : rawValue);
      }
    }

    if (logToConsole) {
      console.log('--------------------------------------------------');
      console.log(`✅ Total keys found: ${results.length}`);
    }

    return results;
  } catch (err) {
    console.error('❌ Error fetching/printing Redis contents:', err.message);
    throw err;
  }
};

module.exports = { getCache, setCache, delCache, printAllRedisContents };

