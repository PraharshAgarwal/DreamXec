/**
 * Abstract Port defining caching contract for Projects.
 * @abstract
 */
class ProjectCachePort {
  async get(key) {
    throw new Error('Method ProjectCachePort.get() must be implemented.');
  }

  async set(key, value, ttlSeconds) {
    throw new Error('Method ProjectCachePort.set() must be implemented.');
  }

  async del(key) {
    throw new Error('Method ProjectCachePort.del() must be implemented.');
  }
}

module.exports = ProjectCachePort;
