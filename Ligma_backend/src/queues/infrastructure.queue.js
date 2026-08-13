import { Queue } from "bullmq";

import { getBullMQConnection, registerBullMQQueue } from "../config/bullmq.config.js";

const INFRASTRUCTURE_QUEUE_NAME = "infrastructure-demo";

let infrastructureQueue;

const getInfrastructureQueue = () => {
  if (!infrastructureQueue) {
    infrastructureQueue = registerBullMQQueue(
      new Queue(INFRASTRUCTURE_QUEUE_NAME, {
        connection: getBullMQConnection("producer"),
      })
    );
  }

  return infrastructureQueue;
};

const enqueueInfrastructureCheckJob = async (data = {}) => {
  const queue = getInfrastructureQueue();

  return queue.add(
    "redis-bullmq-check",
    {
      ...data,
      createdAt: new Date().toISOString(),
    },
    {
      removeOnComplete: true,
      removeOnFail: 10,
    }
  );
};

export { INFRASTRUCTURE_QUEUE_NAME, enqueueInfrastructureCheckJob, getInfrastructureQueue };

export default getInfrastructureQueue;