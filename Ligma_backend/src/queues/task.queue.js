import { Queue } from "bullmq";

import { buildBullMQQueueOptions, registerBullMQQueue } from "../config/bullmq.config.js";
import { buildTaskJobId, taskJobSchema } from "../jobs/task.job.js";

const TASK_QUEUE_NAME = "task-processing";

let taskQueue;

const getTaskQueue = () => {
  if (!taskQueue) {
    taskQueue = registerBullMQQueue(new Queue(TASK_QUEUE_NAME, buildBullMQQueueOptions()));
  }

  return taskQueue;
};

const enqueueTaskJob = async (jobData) => {
  const payload = taskJobSchema.parse(jobData);
  return getTaskQueue().add(payload.action === "delete" ? "delete-task" : "upsert-task", payload, {
    jobId: buildTaskJobId(payload),
  });
};

export { TASK_QUEUE_NAME, getTaskQueue, enqueueTaskJob };

export default getTaskQueue;