const NodeCache = require('node-cache');
const logger = require('../utils/logger');

class CacheService {
  constructor() {
    // Cache for 5 minutes by default
    this.cache = new NodeCache({ 
      stdTTL: 300,
      checkperiod: 60,
      deleteOnExpire: true
    });

    // Track cache statistics
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0
    };

    // Log cache events
    this.cache.on('set', (key, value) => {
      this.stats.sets++;
      logger.debug(`Cache SET: ${key}`);
    });

    this.cache.on('expired', (key, value) => {
      logger.debug(`Cache EXPIRED: ${key}`);
    });
  }

  /**
   * Get value from cache
   */
  get(key) {
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.stats.hits++;
      logger.debug(`Cache HIT: ${key}`);
      return value;
    } else {
      this.stats.misses++;
      logger.debug(`Cache MISS: ${key}`);
      return null;
    }
  }

  /**
   * Set value in cache with optional TTL
   */
  set(key, value, ttl = null) {
    return this.cache.set(key, value, ttl);
  }

  /**
   * Delete key from cache
   */
  del(key) {
    return this.cache.del(key);
  }

  /**
   * Clear all cache
   */
  flush() {
    return this.cache.flushAll();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const keys = this.cache.keys();
    return {
      ...this.stats,
      totalKeys: keys.length,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
      keys: keys
    };
  }

  /**
   * Generate cache key for API requests
   */
  generateKey(prefix, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});
    
    return `${prefix}:${JSON.stringify(sortedParams)}`;
  }
}

module.exports = new CacheService();
