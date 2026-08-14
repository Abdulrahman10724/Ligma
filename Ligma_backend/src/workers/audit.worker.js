import { Worker } from "bullmq";

import { buildBullMQWorkerOptions, registerBullMQWorker } from "../config/bullmq.config.js";
import { auditEventJobSchema } from "../jobs/audit.job.js";
import { AUDIT_QUEUE_NAME } from "../queues/audit.queue.js";
import { appendEvent } from "../services/event-log.service.js";
import logger from "../utils/logger.util.js";

const AUDIT_WORKER_NAME = "audit-worker";

let auditWorker;

const processAuditJob = async (job) => {
  const payload = auditEventJobSchema.parse(job.data);
  const event = await appendEvent(payload);
  logger.info("audit.worker: appended audit event", { jobId: job.id, eventType: payload.eventType, eventId: event?.id || null });
  return event;
};

const createAuditWorker = () => {
  if (auditWorker) {
    return auditWorker;
  }

  auditWorker = registerBullMQWorker(new Worker(AUDIT_QUEUE_NAME, processAuditJob, buildBullMQWorkerOptions()));

  auditWorker.on("active", (job) => logger.info("audit.worker: started", { jobId: job.id, eventType: job.data?.eventType }));
  auditWorker.on("completed", (job) => logger.info("audit.worker: completed", { jobId: job.id }));
  auditWorker.on("failed", (job, error) => logger.error("audit.worker: failed", { jobId: job?.id, message: error?.message }));
  auditWorker.on("error", (error) => logger.error(`audit.worker: error ${error.message}`));

  return auditWorker;
};

createAuditWorker();

export { createAuditWorker, AUDIT_WORKER_NAME };

export default createAuditWorker;