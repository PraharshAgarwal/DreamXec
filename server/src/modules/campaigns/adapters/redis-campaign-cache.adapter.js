const redis = require('../../../config/redis');
const CampaignCachePort = require('../ports/campaign-cache.port');

/**
 * High-Performance Multi-Tiered Cache Adapter (L1 In-Memory + L2 Redis Cache-Aside).
 * Provides sub-millisecond responses for hot campaign lookups.
 */
class RedisCampaignCacheAdapter extends CampaignCachePort {
  constructor({ redisClient = redis } = {}) {
    super();
    this.redis = redisClient;
    this.prefix = 'dx:campaign:';
    // L1 In-Memory Cache Store (key -> { data, expiresAt })
    this.l1Store = new Map();
    this.maxL1Entries = 500;
    // Stale Fallback Store (retains data up to 2 hours for resilient database outage recovery)
    this.fallbackStore = new Map();
  }

  _getL1(key) {
    const entry = this.l1Store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.l1Store.delete(key);
      return null;
    }
    return entry.data;
  }

  _setL1(key, data, ttlSeconds = 60) {
    if (this.l1Store.size >= this.maxL1Entries) {
      // Evict oldest 20% entries
      const keys = Array.from(this.l1Store.keys()).slice(0, 50);
      for (const k of keys) this.l1Store.delete(k);
    }
    this.l1Store.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    // Also save in fallbackStore
    this.fallbackStore.set(key, {
      data,
      expiresAt: Date.now() + 7200 * 1000,
    });
  }

  _delL1(prefixOrKey) {
    for (const k of this.l1Store.keys()) {
      if (k.includes(prefixOrKey)) {
        this.l1Store.delete(k);
      }
    }
    for (const k of this.fallbackStore.keys()) {
      if (k.includes(prefixOrKey)) {
        this.fallbackStore.delete(k);
      }
    }
  }

  async getPublicCampaigns(cacheKey) {
    const fullKey = `${this.prefix}list:${cacheKey}`;
    // 1. Fast L1 Memory Check (<1ms)
    const l1Hit = this._getL1(fullKey);
    if (l1Hit) return l1Hit;

    // 2. L2 Redis Check with short timeout
    try {
      const redisPromise = this.redis.get(fullKey);
      const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 300));
      const raw = await Promise.race([redisPromise, timeoutPromise]);
      if (raw) {
        const parsed = JSON.parse(raw);
        this._setL1(fullKey, parsed, 60);
        return parsed;
      }
    } catch (err) {
      // Ignore cache miss / warning
    }
    return null;
  }

  getFallbackPublicCampaigns(cacheKey) {
    const fullKey = `${this.prefix}list:${cacheKey}`;
    const entry = this.fallbackStore.get(fullKey);
    return entry?.data || null;
  }

  async setPublicCampaigns(cacheKey, data, ttlSeconds = 60) {
    const fullKey = `${this.prefix}list:${cacheKey}`;
    // 1. Store in L1 immediately
    this._setL1(fullKey, data, ttlSeconds);

    // 2. Asynchronously save to L2 without blocking HTTP response
    try {
      this.redis.set(fullKey, JSON.stringify(data), { EX: ttlSeconds }).catch(() => {});
    } catch {
      // Silent catch
    }
  }

  async getCampaignDetails(idOrSlug) {
    const clean = String(idOrSlug).trim();
    const fullKey = `${this.prefix}details:${clean}`;
    // 1. Fast L1 Memory Check (<1ms)
    const l1Hit = this._getL1(fullKey);
    if (l1Hit) return l1Hit;

    // Secondary scan across L1 for ID/slug match
    for (const [key, entry] of this.l1Store.entries()) {
      if (Date.now() <= entry.expiresAt) {
        const c = entry.data;
        if (c && (c.id === clean || c.slug === clean)) {
          return c;
        }
      }
    }

    // 2. L2 Redis Check with short timeout
    try {
      const redisPromise = this.redis.get(fullKey);
      const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 300));
      const raw = await Promise.race([redisPromise, timeoutPromise]);
      if (raw) {
        const parsed = JSON.parse(raw);
        this._setL1(fullKey, parsed, 60);
        return parsed;
      }
    } catch {
      // Ignore cache error
    }
    return null;
  }

  getFallbackCampaignDetails(idOrSlug) {
    const clean = String(idOrSlug).trim();
    const fullKey = `${this.prefix}details:${clean}`;
    const direct = this.fallbackStore.get(fullKey);
    if (direct?.data) return direct.data;

    for (const [, entry] of this.fallbackStore.entries()) {
      const c = entry.data;
      if (c && (c.id === clean || c.slug === clean)) {
        return c;
      }
    }
    return null;
  }

  async setCampaignDetails(idOrSlug, data, ttlSeconds = 60) {
    const keys = new Set();
    if (idOrSlug) keys.add(String(idOrSlug).trim());
    if (data?.id) keys.add(String(data.id).trim());
    if (data?.slug) keys.add(String(data.slug).trim());

    for (const key of keys) {
      const fullKey = `${this.prefix}details:${key}`;
      // 1. Store in L1 immediately
      this._setL1(fullKey, data, ttlSeconds);

      // 2. Asynchronously save to L2 without blocking HTTP response
      try {
        this.redis.set(fullKey, JSON.stringify(data), { EX: ttlSeconds }).catch(() => {});
      } catch {
        // Silent catch
      }
    }
  }

  async invalidateCampaign(idOrSlug, tenantId = null) {
    this._delL1(idOrSlug);
    this._delL1('list:');

    try {
      await this.redis.del(`${this.prefix}details:${idOrSlug}`);
    } catch (e) {
      // Ignore
    }

    try {
      const keysToDelete = [];
      for await (const key of this.redis.scanIterator({ MATCH: `${this.prefix}list:*`, COUNT: 50 })) {
        keysToDelete.push(key);
      }
      if (keysToDelete.length > 0) {
        await this.redis.del(keysToDelete);
      }
    } catch {
      // Ignore
    }
  }

  async invalidateAll() {
    this.l1Store.clear();
    try {
      const keysToDelete = [];
      for await (const key of this.redis.scanIterator({ MATCH: `${this.prefix}*`, COUNT: 100 })) {
        keysToDelete.push(key);
      }
      if (keysToDelete.length > 0) {
        await this.redis.del(keysToDelete);
      }
    } catch {
      // Ignore
    }
  }
}

module.exports = new RedisCampaignCacheAdapter();
module.exports.RedisCampaignCacheAdapter = RedisCampaignCacheAdapter;
