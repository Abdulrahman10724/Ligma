import { ObjectId } from "mongodb";
import { z } from "zod";

import { findNodeById } from "../models/canvas-node.model.js";
import { ensureEventLogIndexes, insertEventLog, sanitizeEventLog, VALID_EVENT_TYPES } from "../models/event-log.model.js";
import { findTaskById } from "../models/task.model.js";
import { findUserById } from "../models/user.model.js";
import { findWorkspaceById } from "../models/workspace.model.js";
import { EVENT_TYPES } from "../utils/event-types.util.js";
import logger from "../utils/logger.util.js";

const optionalId = z.string().regex(/^[a-f0-9]{24}$/i).nullable().optional();

const appendEventSchema = z.object({
  workspaceId: z.string().regex(/^[a-f0-9]{24}$/i, "Workspace ID is invalid"),
  userId: z.string().regex(/^[a-f0-9]{24}$/i, "User ID is invalid"),
  eventType: z.enum(VALID_EVENT_TYPES),
  nodeId: optionalId,
  taskId: optionalId,
  payload: z.record(z.unknown()).default({}),
});

const assertWorkspaceUserAndTargets = async ({ workspaceId, userId, nodeId, taskId }) => {
  const workspace = await findWorkspaceById(workspaceId);
  if (!workspace) {
    const error = new Error("Workspace not found");
    error.statusCode = 404;
    throw error;
  }

  const user = await findUserById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (nodeId) {
    const node = await findNodeById(nodeId);
    if (!node || node.workspaceId.toString() !== workspaceId) {
      const error = new Error("Node not found");
      error.statusCode = 404;
      throw error;
    }
  }

  if (taskId) {
    const task = await findTaskById(taskId);
    if (!task || task.workspaceId?.toString() !== workspaceId) {
      const error = new Error("Task not found");
      error.statusCode = 404;
      throw error;
    }
  }
};

const appendEvent = async (input) => {
  await ensureEventLogIndexes();

  const parsed = appendEventSchema.parse(input);
  await assertWorkspaceUserAndTargets(parsed);

  const eventDocument = {
    workspaceId: new ObjectId(parsed.workspaceId),
    nodeId: parsed.nodeId ? new ObjectId(parsed.nodeId) : null,
    taskId: parsed.taskId ? new ObjectId(parsed.taskId) : null,
    userId: new ObjectId(parsed.userId),
    eventType: parsed.eventType,
    payload: parsed.payload,
    createdAt: new Date(),
  };

  try {
    const event = await insertEventLog(eventDocument);
    logger.info(`event-log.service: created ${parsed.eventType} workspace=${parsed.workspaceId}`);
    return sanitizeEventLog(event);
  } catch (error) {
    logger.error(`event-log.service: failed to create ${parsed.eventType}: ${error.message}`);
    throw error;
  }
};

export { appendEvent, EVENT_TYPES };

export default { appendEvent, EVENT_TYPES };