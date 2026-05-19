const logger = require("../config/logger");

const DEFAULT_TTL = 300;

const store = new Map(); // { key: { value, expiresAt } }

const cacheGet = async (key) => {
  try {
    const entry = store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      store.delete(key);
      return null;
    }
    return entry.value;
  } catch (err) {
    logger.warn(`Cache GET failed for key ${key}: ${err.message}`);
    return null;
  }
};

const cacheSet = async (key, value, ttl = DEFAULT_TTL) => {
  try {
    store.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
  } catch (err) {
    logger.warn(`Cache SET failed for key ${key}: ${err.message}`);
  }
};

const cacheDel = async (key) => {
  try {
    store.delete(key);
  } catch (err) {
    logger.warn(`Cache DEL failed for key ${key}: ${err.message}`);
  }
};

const cacheDelPattern = async (pattern) => {
  try {
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    let count = 0;
    for (const key of store.keys()) {
      if (regex.test(key)) {
        store.delete(key);
        count++;
      }
    }
    if (count > 0) logger.debug(`Cache DEL pattern ${pattern}: removed ${count} keys`);
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