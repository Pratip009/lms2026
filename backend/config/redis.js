const Redis = require("ioredis");
const logger = require("./logger");

let redisClient = null;
let redisAvailable = false;

const connectRedis = () => {
  return new Promise((resolve) => {
    const client = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 3) {
          logger.warn("Redis: max retry attempts reached. Running without cache.");
          return null; // stop retrying — do NOT throw
        }
        return Math.min(times * 200, 2000);
      },
      reconnectOnError(err) {
        const targetErrors = ["READONLY", "ECONNRESET"];
        return targetErrors.some((e) => err.message.includes(e));
      },
    });

    client.on("connect", () => {
      redisAvailable = true;
      logger.info("✅ Redis connected");
    });

    client.on("error", (err) => {
      redisAvailable = false;
      logger.warn(`Redis unavailable: ${err.message} — caching disabled`);
    });

    client.on("close", () => {
      redisAvailable = false;
      logger.warn("Redis connection closed");
    });

    // Attempt connection — resolve either way so server always starts
    client.connect()
      .then(() => {
        redisClient = client;
        redisAvailable = true;
        resolve(client);
      })
      .catch((err) => {
        logger.warn(`Redis failed to connect: ${err.message} — running without cache`);
        redisAvailable = false;
        resolve(null); // resolve (not reject) so server.js doesn't crash
      });
  });
};

// Returns client or null — never throws
const getRedis = () => {
  if (!redisClient || !redisAvailable) return null;
  return redisClient;
};

const isRedisAvailable = () => redisAvailable;

module.exports = connectRedis;
module.exports.getRedis = getRedis;
module.exports.isRedisAvailable = isRedisAvailable;