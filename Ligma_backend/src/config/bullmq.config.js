import IORedis from "ioredis";

import config from "./env.config.js";
import logger from "../utils/logger.util.js";

const REDIS_ROLES = {
  producer: "producer",
  worker: "worker",
};

const connections = new Map();
const queues = new Set();
const workers = new Set();

const DEFAULT_QUEUE_JOB_OPTIONS = {
  attempts: 5,
  backoff: {
    type: "exponential",
    delay: 2000,
  },
  removeOnComplete: 100,
  removeOnFail: 1000,
};

const DEFAULT_WORKER_OPTIONS = {
  concurrency: 1,
};

const createBullMQConnection = (role) => {
  const connection = new IORedis(config.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    connectTimeout: 10000,
    retryStrategy: (retries) => Math.min(retries * 100, 2000),
    connectionName: `ligma:${role}`,
  });

  connection.on("error", (error) => {
    logger.error(`❌ BullMQ Redis (${role}) error: ${error.message}`);
  });

  connection.on("reconnecting", () => {
    logger.warn(`🔁 BullMQ Redis (${role}) reconnecting...`);
  });

  connection.on("close", () => {
    logger.warn(`🔌 BullMQ Redis (${role}) closed.`);
  });

  return connection;
};

const getBullMQConnection = (role = REDIS_ROLES.producer) => {
  if (!connections.has(role)) {
    connections.set(role, createBullMQConnection(role));
  }

  return connections.get(role);
};

const registerBullMQQueue = (queue) => {
  queues.add(queue);
  return queue;
};

const registerBullMQWorker = (worker) => {
  workers.add(worker);
  return worker;
};

const ensureBullMQConnection = async (role) => {
  const connection = getBullMQConnection(role);

  if (connection.status !== "ready") {
    await connection.connect();
  }

  await connection.ping();
  return connection;
};

const buildBullMQQueueOptions = (overrides = {}) => ({
  connection: getBullMQConnection(REDIS_ROLES.producer),
  defaultJobOptions: {
    ...DEFAULT_QUEUE_JOB_OPTIONS,
    ...(overrides.defaultJobOptions || {}),
  },
  ...overrides,
});

const buildBullMQWorkerOptions = (overrides = {}) => ({
  connection: getBullMQConnection(REDIS_ROLES.worker),
  ...DEFAULT_WORKER_OPTIONS,
  ...overrides,
});

const getBullMQHealth = () => ({
  connections: Array.from(connections.entries()).map(([role, connection]) => ({
    role,
    status: connection.status,
  })),
  queuesRegistered: queues.size,
  workersRegistered: workers.size,
});

const closeBullMQInfrastructure = async () => {
  await Promise.allSettled(Array.from(workers, (worker) => worker.close()));
  await Promise.allSettled(Array.from(queues, (queue) => queue.close()));

  await Promise.allSettled(
    Array.from(connections.values(), async (connection) => {
      try {
        await connection.quit();
      } catch {
        connection.disconnect();
      }
    })
  );

  connections.clear();
  queues.clear();
  workers.clear();
};

export {
  buildBullMQQueueOptions,
  buildBullMQWorkerOptions,
  REDIS_ROLES,
  getBullMQHealth,
  closeBullMQInfrastructure,
  ensureBullMQConnection,
  getBullMQConnection,
  registerBullMQQueue,
  registerBullMQWorker,
};

export default {
  buildBullMQQueueOptions,
  buildBullMQWorkerOptions,
  REDIS_ROLES,
  getBullMQHealth,
  closeBullMQInfrastructure,
  ensureBullMQConnection,
  getBullMQConnection,
  registerBullMQQueue,
  registerBullMQWorker,
};