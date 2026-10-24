const { getCache, setCache, delCache } = require('../../../utils/cache');
const ProjectCachePort = require('../ports/project-cache.port');

class RedisProjectCacheAdapter extends ProjectCachePort {
  async get(key) {
    try {
      return await getCache(key);
    } catch (err) {
      console.warn(`[RedisProjectCacheAdapter] get error for key ${key}:`, err.message);
      return null;
    }
  }

  async set(key, value, ttlSeconds) {
    try {
      return await setCache(key, value, ttlSeconds);
    } catch (err) {
      console.warn(`[RedisProjectCacheAdapter] set error for key ${key}:`, err.message);
    }
  }

  async del(key) {
    try {
      return await delCache(key);
    } catch (err) {
      console.warn(`[RedisProjectCacheAdapter] del error for key ${key}:`, err.message);
    }
  }
}

module.exports = new RedisProjectCacheAdapter();
module.exports.RedisProjectCacheAdapter = RedisProjectCacheAdapter;
