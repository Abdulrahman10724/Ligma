import { Worker } from "bullmq";

import { getBullMQConnection, registerBullMQWorker } from "../config/bullmq.config.js";
import { INFRASTRUCTURE_QUEUE_NAME } from "../queues/infrastructure.queue.js";
import logger from "../utils/logger.util.js";

let infrastructureWorker;

const createInfrastructureWorker = () => {
  if (infrastructureWorker) {
    return infrastructureWorker;
  }

  infrastructureWorker = registerBullMQWorker(
    new Worker(
      INFRASTRUCTURE_QUEUE_NAME,
      async (job) => {
        const processedAt = new Date().toISOString();

        logger.info(`✅ BullMQ demo job processed (${job.name})`, {
          jobId: job.id,
          queue: job.queueName,
        });

        return {
          processedAt,
          queue: job.queueName,
          jobId: job.id,
        };
      },
      {
        connection: getBullMQConnection("worker"),
        concurrency: 1,
      }
    )
  );

  infrastructureWorker.on("failed", (job, error) => {
    logger.error("❌ BullMQ demo job failed", {
      jobId: job?.id,
      message: error?.message,
    });
  });

  infrastructureWorker.on("error", (error) => {
    logger.error(`❌ BullMQ worker error: ${error.message}`);
  });

  return infrastructureWorker;
};

createInfrastructureWorker();

export { createInfrastructureWorker };

export default createInfrastructureWorker;