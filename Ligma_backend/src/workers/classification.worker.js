import { Worker } from "bullmq";
import { toIsoString } from "../jobs/job.utils.js";

import {
  buildBullMQWorkerOptions,
  registerBullMQWorker,
} from "../config/bullmq.config.js";
import { classificationJobSchema } from "../jobs/classification.job.js";
import { CLASSIFICATION_QUEUE_NAME } from "../queues/classification.queue.js";
import { enqueueTaskJob } from "../queues/task.queue.js";
import {
  findNodeById,
  sanitizeCanvasNode,
  updateNode,
} from "../models/canvas-node.model.js";
import { appendEvent, EVENT_TYPES } from "../services/event-log.service.js";
import { classifyNodeContent } from "../services/classification.service.js";
import { getNodeText } from "../utils/node-text.util.js";
import logger from "../utils/logger.util.js";

const CLASSIFICATION_WORKER_NAME = "classification-worker";

let classificationWorker;

const buildTaskPayloadFromClassification = (
  node,
  classificationResult,
  actorId,
) => ({
  workspaceId: node.workspaceId,
  nodeId: node.id,
  actorId,
  action: "upsert",
  nodeUpdatedAt: toIsoString(node.updatedAt),
  classification: classificationResult.classification,
  taskData: {
    title: classificationResult.title || getNodeText(node) || "",
    description: classificationResult.description || "",
    type:
      classificationResult.classification ||
      (classificationResult.references?.length ? "Reference" : "Action"),
    metadata: {
      references: classificationResult.references || [],
      emails: classificationResult.emails || [],
    },
  },
});

const processClassificationJob = async (job) => {
  const payload = classificationJobSchema.parse(job.data);
  const node = await findNodeById(payload.nodeId);

  if (!node) {
    logger.warn("classification.worker: node missing before processing", {
      jobId: job.id,
      nodeId: payload.nodeId,
    });
    return { skipped: "missing-node" };
  }

  if (node.workspaceId.toString() !== payload.workspaceId) {
    throw new Error("Node does not belong to the target workspace");
  }

  const currentNode = sanitizeCanvasNode(node);
  const currentNodeUpdatedAt = currentNode.updatedAt
    ? new Date(currentNode.updatedAt).toISOString()
    : null;
  if (
    payload.nodeUpdatedAt &&
    currentNodeUpdatedAt &&
    currentNodeUpdatedAt !== payload.nodeUpdatedAt
  ) {
    logger.info("classification.worker: stale job skipped", {
      jobId: job.id,
      nodeId: payload.nodeId,
    });
    return { skipped: "stale-node-revision" };
  }

  const existingClassification = currentNode.aiClassification || null;
  const text = getNodeText(currentNode);

  if (!text.trim()) {
    logger.info("classification.worker: empty text skipped", {
      jobId: job.id,
      nodeId: payload.nodeId,
    });
    return { skipped: "empty-text" };
  }

  if (currentNode.aiClassificationJobId === job.id && existingClassification) {
    logger.info("classification.worker: duplicate job rehydrated", {
      jobId: job.id,
      nodeId: payload.nodeId,
    });
     if (existingClassification) {
      await enqueueTaskJob({
        workspaceId: payload.workspaceId,
        nodeId: payload.nodeId,
        actorId: payload.actorId,
        action: "upsert",
        nodeUpdatedAt: toIsoString(currentNode.updatedAt),
        classification: existingClassification,
        taskData: {
          title: currentNode.aiClassificationTitle || text,
          description: currentNode.aiClassificationDescription || "",
          type: existingClassification,
          metadata: {
            references: currentNode.aiReferences || [],
            emails: currentNode.aiEmails || [],
          },
        },
      });
    }

    return { skipped: "already-processed" };
  }

  const classificationResult = await classifyNodeContent(text, {
    strict: true,
  });
  const classification =
    classificationResult.classification ||
    (classificationResult.references?.length ? "Reference" : null);

  if (!classification) {
    logger.info("classification.worker: no classification returned", {
      jobId: job.id,
      nodeId: payload.nodeId,
    });
    return { skipped: "no-classification" };
  }

  const now = new Date();
  const updatedNode = await updateNode(payload.nodeId, payload.workspaceId, {
    aiClassification: classification,
    aiClassifiedAt: now,
    aiClassificationJobId: job.id,
    aiClassificationTitle: classificationResult.title || "",
    aiClassificationDescription: classificationResult.description || "",
    aiReferences: classificationResult.references || [],
    aiEmails: classificationResult.emails || [],
  });

  const sanitized = sanitizeCanvasNode(updatedNode);
  const updatedAt = sanitized.updatedAt
    ? new Date(sanitized.updatedAt).toISOString()
    : null;

  await appendEvent({
    workspaceId: payload.workspaceId,
    userId: payload.actorId,
    eventType: EVENT_TYPES.NODE_UPDATED,
    nodeId: payload.nodeId,
    payload: {
      previousData: { aiClassification: existingClassification },
      nextData: {
        aiClassification: classification,
        aiClassifiedAt: sanitized.aiClassifiedAt,
      },
    },
  });

 if (classification) {
    await enqueueTaskJob(
      buildTaskPayloadFromClassification(
        sanitized,
        classificationResult,
        payload.actorId,
      ),
    );
  }
  

  logger.info(`classification.worker: processed node ${payload.nodeId}`, {
    jobId: job.id,
    classification,
  });
  return { classification };
};

const createClassificationWorker = () => {
  if (classificationWorker) {
    return classificationWorker;
  }

  classificationWorker = registerBullMQWorker(
    new Worker(
      CLASSIFICATION_QUEUE_NAME,
      processClassificationJob,
      buildBullMQWorkerOptions(),
    ),
  );

  classificationWorker.on("active", (job) => {
    logger.info("classification.worker: started", {
      jobId: job.id,
      nodeId: job.data?.nodeId,
    });
  });
  classificationWorker.on("completed", (job) => {
    logger.info("classification.worker: completed", { jobId: job.id });
  });
  classificationWorker.on("failed", (job, error) => {
    logger.error("classification.worker: failed", {
      jobId: job?.id,
      message: error?.message,
    });
  });
  classificationWorker.on("error", (error) => {
    logger.error(`classification.worker: error ${error.message}`);
  });

  return classificationWorker;
};

createClassificationWorker();

export { createClassificationWorker, CLASSIFICATION_WORKER_NAME };

export default createClassificationWorker;
