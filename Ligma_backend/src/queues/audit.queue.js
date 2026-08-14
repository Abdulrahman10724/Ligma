import { Queue } from "bullmq";

import { buildBullMQQueueOptions, registerBullMQQueue } from "../config/bullmq.config.js";
import { auditEventJobSchema } from "../jobs/audit.job.js";
import { buildStableJobId } from "../jobs/job.utils.js";

const AUDIT_QUEUE_NAME = "audit-events";

let auditQueue;

const getAuditQueue = () => {
  if (!auditQueue) {
    auditQueue = registerBullMQQueue(new Queue(AUDIT_QUEUE_NAME, buildBullMQQueueOptions()));
  }

  return auditQueue;
};

const enqueueAuditEventJob = async (jobData) => {
  const payload = auditEventJobSchema.parse(jobData);
  return getAuditQueue().add("append-audit-event", payload, {
    jobId: buildStableJobId("audit", payload.workspaceId, payload.eventType, payload.nodeId || payload.taskId || Date.now()),
  });
};

export { AUDIT_QUEUE_NAME, getAuditQueue, enqueueAuditEventJob };

export default getAuditQueue;