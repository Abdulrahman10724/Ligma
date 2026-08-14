import { Worker } from "bullmq";

import { buildBullMQWorkerOptions, registerBullMQWorker } from "../config/bullmq.config.js";
import { emailJobSchema } from "../jobs/email.job.js";
import { EMAIL_QUEUE_NAME } from "../queues/email.queue.js";
import { sendInvitationEmail, sendVerificationEmail } from "../services/email.service.js";
import logger from "../utils/logger.util.js";

const EMAIL_WORKER_NAME = "email-worker";

let emailWorker;

const processEmailJob = async (job) => {
  const payload = emailJobSchema.parse(job.data);

  if (payload.type === "verification") {
    const result = await sendVerificationEmail({ to: payload.to, name: payload.name, token: payload.token });
    logger.info("email.worker: verification email sent", { jobId: job.id, to: payload.to, skipped: Boolean(result?.skipped) });
    return result;
  }

  const result = await sendInvitationEmail({
    to: payload.to,
    inviterName: payload.inviterName,
    workspaceTitle: payload.workspaceTitle,
    role: payload.role,
    inviteLink: payload.inviteLink,
  });
  logger.info("email.worker: invitation email sent", { jobId: job.id, to: payload.to, skipped: Boolean(result?.skipped) });
  return result;
};

const createEmailWorker = () => {
  if (emailWorker) {
    return emailWorker;
  }

  emailWorker = registerBullMQWorker(new Worker(EMAIL_QUEUE_NAME, processEmailJob, buildBullMQWorkerOptions()));

  emailWorker.on("active", (job) => logger.info("email.worker: started", { jobId: job.id, type: job.data?.type }));
  emailWorker.on("completed", (job) => logger.info("email.worker: completed", { jobId: job.id }));
  emailWorker.on("failed", (job, error) => logger.error("email.worker: failed", { jobId: job?.id, message: error?.message }));
  emailWorker.on("error", (error) => logger.error(`email.worker: error ${error.message}`));

  return emailWorker;
};

createEmailWorker();

export { createEmailWorker, EMAIL_WORKER_NAME };

export default createEmailWorker;