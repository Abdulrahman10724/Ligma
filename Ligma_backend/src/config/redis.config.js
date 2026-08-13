import { createClient } from "redis";
import config from "./env.config.js";
import logger from "../utils/logger.util.js";

let client;
let connectPromise;

const attachRedisEvents = (redisClient) => {
  redisClient.on("error", (error) => {
    logger.error(`❌ Redis client error: ${error.message}`);
  });

  redisClient.on("connect", () => {
    logger.info("🔌 Redis client connecting...");
  });

  redisClient.on("ready", () => {
    logger.info(`✅ Redis client ready at ${config.REDIS_URL}`);
  });

  redisClient.on("reconnecting", () => {
    logger.warn("🔁 Redis client reconnecting...");
  });

  redisClient.on("end", () => {
    logger.warn("🔌 Redis client connection ended.");
  });
};

const createRedisClient = () => {
  const redisClient = createClient({
    url: config.REDIS_URL,
    socket: {
      connectTimeout: 10000,
      reconnectStrategy: (retries) => Math.min(retries * 100, 2000),
    },
  });

  attachRedisEvents(redisClient);
  return redisClient;
};

const connectRedis = async () => {
  if (client && client.isOpen) {
    return client;
  }

  if (!client) {
    client = createRedisClient();
  }

  if (!connectPromise) {
    connectPromise = client
      .connect()
      .then(async () => {
        const pong = await client.ping();
        logger.info(`🔌 Redis connected successfully (${pong}) at ${config.REDIS_URL}`);
        return client;
      })
      .catch((error) => {
        connectPromise = undefined;
        throw error;
      });
  }

  return connectPromise;
};

const getRedisClient = () => {
  if (!client) {
    throw new Error("Redis client not initialized. Call connectRedis() first.");
  }
  return client;
};

const closeRedis = async () => {
  if (!client) {
    return;
  }

  const activeClient = client;
  client = undefined;
  connectPromise = undefined;

  if (activeClient.isOpen) {
    await activeClient.quit();
    return;
  }

  activeClient.disconnect();
};

export { connectRedis, getRedisClient, closeRedis };

export default connectRedis;
