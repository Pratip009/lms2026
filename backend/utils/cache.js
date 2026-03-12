const { getRedis } = require("../config/redis");
const logger = require("../config/logger");

const DEFAULT_TTL = 300;

const cacheGet = async (key) => {
  try {
    const redis = getRedis();
    if (!redis) return null;              // ← added
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  } catch (err) {
    logger.warn(`Cache GET failed for key ${key}: ${err.message}`);
    return null;
  }
};

const cacheSet = async (key, value, ttl = DEFAULT_TTL) => {
  try {
    const redis = getRedis();
    if (!redis) return;                   // ← added
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch (err) {
    logger.warn(`Cache SET failed for key ${key}: ${err.message}`);
  }
};

const cacheDel = async (key) => {
  try {
    const redis = getRedis();
    if (!redis) return;                   // ← added
    await redis.del(key);
  } catch (err) {
    logger.warn(`Cache DEL failed for key ${key}: ${err.message}`);
  }
};

const cacheDelPattern = async (pattern) => {
  try {
    const redis = getRedis();
    if (!redis) return;                   // ← added
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.debug(`Cache DEL pattern ${pattern}: removed ${keys.length} keys`);
    }
  } catch (err) {
    logger.warn(`Cache DEL pattern failed: ${err.message}`);
  }
};

const withCache = async (key, fetcher, ttl = DEFAULT_TTL) => {
  const cached = await cacheGet(key);
  if (cached !== null) return cached;
  const fresh = await fetcher();
  await cacheSet(key, fresh, ttl);
  return fresh;
};

module.exports = { cacheGet, cacheSet, cacheDel, cacheDelPattern, withCache };