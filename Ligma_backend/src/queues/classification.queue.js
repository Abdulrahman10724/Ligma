import { Queue } from "bullmq";

import { buildBullMQQueueOptions, registerBullMQQueue } from "../config/bullmq.config.js";
import { buildClassificationJobId, classificationJobSchema } from "../jobs/classification.job.js";

const CLASSIFICATION_QUEUE_NAME = "ai-classification";

let classificationQueue;

const getClassificationQueue = () => {
  if (!classificationQueue) {
    classificationQueue = registerBullMQQueue(new Queue(CLASSIFICATION_QUEUE_NAME, buildBullMQQueueOptions()));
  }

  return classificationQueue;
};

const enqueueClassificationJob = async (jobData) => {
  const payload = classificationJobSchema.parse(jobData);
  return getClassificationQueue().add("classify-node", payload, {
    jobId: buildClassificationJobId(payload),
  });
};

export { CLASSIFICATION_QUEUE_NAME, getClassificationQueue, enqueueClassificationJob };

export default getClassificationQueue;