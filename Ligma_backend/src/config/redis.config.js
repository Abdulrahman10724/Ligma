// Minimal Redis connection module.
//
// IMPORTANT: this file intentionally does NOT implement any Redis-backed
// features (Socket.IO adapter, caches, rate limiting, BullMQ, etc.). Its
// only job is to establish and expose a single shared Redis client so the
// backend can prove connectivity to the Redis container over the Docker
// network. Feature work is out of scope for this change.

import { createClient } from "redis";
import config from "./env.config.js";
import logger from "../utils/logger.util.js";

let client;

const connectRedis = async () => {
  if (client && client.isOpen) {
    return client;
  }

  client = createClient({ url: config.REDIS_URL });

  client.on("error", (error) => {
    logger.error(`❌ Redis Client Error: ${error.message}`);
  });

  client.on("reconnecting", () => {
    logger.warn("🔁 Redis reconnecting...");
  });

  await client.connect();

  const pong = await client.ping();
  logger.info(`🔌 Redis connected successfully (${pong}) at ${config.REDIS_URL}`);

  return client;
};

const getRedisClient = () => {
  if (!client) {
    throw new Error("Redis client not initialized. Call connectRedis() first.");
  }
  return client;
};

export { connectRedis, getRedisClient };

export default connectRedis;
