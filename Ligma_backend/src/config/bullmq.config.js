import IORedis from "ioredis";

import config from "./env.config.js";
import logger from "../utils/logger.util.js";

const REDIS_ROLES = {
  producer: "producer",
  worker: "worker", // kept for backward-compat; prefer worker-<name> per queue
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

// Cap retry delay AND retry count so a dead Redis doesn't hang startup forever.
// ioredis calls this on every disconnect; returning `null`/`undefined` stops retrying.
const MAX_RETRY_ATTEMPTS = 20; // ~ a few minutes total with capped backoff

const createBullMQConnection = (role) => {
  const connection = new IORedis(config.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: null, // required by BullMQ blocking commands
    enableReadyCheck: false,
    connectTimeout: 10000,
    retryStrategy: (retries) => {
      if (retries > MAX_RETRY_ATTEMPTS) {
        logger.error(`❌ BullMQ Redis (${role}) exceeded max retries (${MAX_RETRY_ATTEMPTS}); giving up.`);
        return null; // stop retrying — connect() promise will reject
      }
      return Math.min(retries * 200, 3000);
    },
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

// `role` can now be any unique string (e.g. "worker-audit", "worker-task")
// so each worker gets its own dedicated connection instead of sharing one.
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

// Now bounded: connect() will reject once retryStrategy returns null,
// instead of hanging forever when Redis is unreachable.
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

// `workerName` lets each worker request its own dedicated Redis connection
// instead of all 5 workers sharing REDIS_ROLES.worker.
const buildBullMQWorkerOptions = (workerName, overrides = {}) => ({
  connection: getBullMQConnection(workerName ? `worker-${workerName}` : REDIS_ROLES.worker),
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