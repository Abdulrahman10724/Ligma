import { ObjectId } from "mongodb";
import {
  VALID_NODE_TYPES,
  createNode,
  deleteNode,
  ensureCanvasNodeIndexes,
  findNodeById,
  findNodesByWorkspace,
  sanitizeCanvasNode,
  updateNode,
} from "../models/canvas-node.model.js";
import {
  assertWorkspaceAccess,
  assertWorkspaceEditAccess,
  assertWorkspaceLead,
  canLockNode,
  canMutateNode,
  getWorkspaceRole,
  normalizeNodeAllowedUserIds,
} from "./member.service.js";
import { appendEvent, EVENT_TYPES } from "./event-log.service.js";
import logger from "../utils/logger.util.js";
import { getNodeText } from "../utils/node-text.util.js";
import { enqueueClassificationJob } from "../queues/classification.queue.js";
import { enqueueTaskJob } from "../queues/task.queue.js";

const toIsoString = (value) => (value ? new Date(value).toISOString() : null);

const NODE_GEOMETRY_KEYS = new Set(["width", "height", "radius", "dx", "dy"]);

const pickKeys = (object, keys) => {
  const result = {};
  for (const key of keys) {
    if (object?.[key] !== undefined) {
      result[key] = object[key];
    }
  }
  return result;
};

const buildNodeUpdateEvent = (beforeNode, afterNode, payload) => {
  const hasX = payload?.x !== undefined;
  const hasY = payload?.y !== undefined;
  const hasData = payload?.data !== undefined;
  const dataKeys =
    hasData && payload.data && typeof payload.data === "object"
      ? Object.keys(payload.data)
      : [];
  const geometryTouched = dataKeys.some((key) => NODE_GEOMETRY_KEYS.has(key));

  if ((hasX || hasY) && !hasData) {
    return {
      eventType: EVENT_TYPES.NODE_MOVED,
      payload: {
        previousPosition: { x: beforeNode.x, y: beforeNode.y },
        nextPosition: { x: afterNode.x, y: afterNode.y },
      },
    };
  }

  if ((hasX || hasY) && geometryTouched) {
    return {
      eventType: EVENT_TYPES.NODE_RESIZED,
      payload: {
        previousPosition: { x: beforeNode.x, y: beforeNode.y },
        nextPosition: { x: afterNode.x, y: afterNode.y },
        previousData: pickKeys(beforeNode.data || {}, dataKeys),
        nextData: pickKeys(afterNode.data || {}, dataKeys),
      },
    };
  }

  return {
    eventType: EVENT_TYPES.NODE_UPDATED,
    payload: {
      previousData: hasData
        ? pickKeys(beforeNode.data || {}, dataKeys)
        : beforeNode.data || {},
      nextData: hasData
        ? pickKeys(afterNode.data || {}, dataKeys)
        : afterNode.data || {},
      nextPosition: { x: afterNode.x, y: afterNode.y },
    },
  };
};

const listCanvasNodes = async (workspaceId, userId) => {
  await ensureCanvasNodeIndexes();
  await assertWorkspaceAccess(workspaceId, userId);

  const nodes = await findNodesByWorkspace(workspaceId);
  return nodes.map(sanitizeCanvasNode);
};

const assertNodeAccess = async (workspaceId, userId, nodeId) => {
  const workspaceRole = await getWorkspaceRole(workspaceId, userId);
  const existing = await findNodeById(nodeId);

  if (!existing || existing.workspaceId.toString() !== workspaceId) {
    const error = new Error("Node not found");
    error.statusCode = 404;
    throw error;
  }

  if (!canMutateNode(existing, workspaceRole, userId)) {
    const error = new Error("Forbidden");
    error.statusCode = 403;
    throw error;
  }

  return { existing, workspaceRole };
};

const createCanvasNode = async (workspaceId, userId, payload) => {
  await ensureCanvasNodeIndexes();
  await assertWorkspaceEditAccess(workspaceId, userId);

  const { type, x, y, data, parentNodeId } = payload;

  const node = await createNode({
    workspaceId,
    createdById: userId,
    type,
    x,
    y,
    data,
    parentNodeId,
  });
  const sanitized = sanitizeCanvasNode(node);

  appendEvent({
    workspaceId,
    userId,
    eventType: EVENT_TYPES.NODE_CREATED,
    nodeId: sanitized.id,
    payload: {
      snapshot: {
        id: sanitized.id,
        type: sanitized.type,
        x: sanitized.x,
        y: sanitized.y,
        data: sanitized.data || {},
        locked: sanitized.locked,
        lockedBy: sanitized.lockedBy,
        lockedAt: sanitized.lockedAt,
        allowedUserIds: sanitized.allowedUserIds || [],
        createdById: sanitized.createdById,
      },
    },
  }).catch((error) => {
    logger.warn("event logging failed on node create", error?.message || error);
  });

  const text = getNodeText(sanitized);
  if (text.trim()) {
    void enqueueClassificationJob({
      workspaceId,
      nodeId: sanitized.id,
      actorId: userId,
      nodeUpdatedAt: toIsoString(sanitized.updatedAt),
    }).catch((error) => {
      logger.warn("classification job enqueue failed on node create", {
        message: error?.message,
        nodeId: sanitized.id,
      });
    });
  }

  return sanitized;
};

const updateCanvasNode = async (workspaceId, userId, nodeId, payload) => {
  const { existing } = await assertNodeAccess(workspaceId, userId, nodeId);

  const allowedFields = ["x", "y", "data", "parentNodeId"];
  const updateFields = {};
  for (const key of allowedFields) {
    if (payload[key] !== undefined) {
      updateFields[key] = payload[key];
    }
  }

  if (Object.prototype.hasOwnProperty.call(updateFields, "parentNodeId")) {
    updateFields.parentNodeId = updateFields.parentNodeId
      ? new ObjectId(updateFields.parentNodeId)
      : null;
  }

  const updated = await updateNode(nodeId, workspaceId, updateFields);
  const sanitized = sanitizeCanvasNode(updated);

  const event = buildNodeUpdateEvent(existing, sanitized, payload);
  appendEvent({
    workspaceId,
    userId,
    eventType: event.eventType,
    nodeId: sanitized.id,
    payload: event.payload,
  }).catch((error) => {
    logger.warn("event logging failed on node update", error?.message || error);
  });
  const previousText = getNodeText(existing);
  const nextText = getNodeText(sanitized);
  const textKey = existing.type
    ? existing.type === "rectangle" ||
      existing.type === "circle" ||
      existing.type === "arrow" ||
      existing.type === "diamond" ||
      existing.type === "triangle" ||
      existing.type === "line"
      ? "label"
      : "text"
    : null;
  const textFieldWasUpdated =
    payload.data &&
    textKey &&
    Object.prototype.hasOwnProperty.call(payload.data, textKey);
  const textActuallyChanged = textFieldWasUpdated && nextText !== previousText;

  if (textActuallyChanged) {
    void enqueueClassificationJob({
      workspaceId,
      nodeId: sanitized.id,
      actorId: userId,
      nodeUpdatedAt: toIsoString(sanitized.updatedAt),
    }).catch((error) => {
      logger.warn("classification job enqueue failed on node update", {
        message: error?.message,
        nodeId: sanitized.id,
      });
    });
  }

  return sanitized;
};
const deleteCanvasNode = async (workspaceId, userId, nodeId) => {
  const { existing } = await assertNodeAccess(workspaceId, userId, nodeId);

  appendEvent({
    workspaceId,
    userId,
    eventType: EVENT_TYPES.NODE_DELETED,
    nodeId: existing._id.toString(),
    payload: {
      snapshot: {
        id: existing._id.toString(),
        type: existing.type,
        x: existing.x,
        y: existing.y,
        data: existing.data || {},
        locked: existing.locked,
        lockedBy: existing.lockedBy ? existing.lockedBy.toString() : null,
        lockedAt: existing.lockedAt || null,
        allowedUserIds: existing.allowedUserIds || [],
        createdById: existing.createdById
          ? existing.createdById.toString()
          : existing.createdById,
      },
    },
    validateNode: false,
  }).catch((error) => {
    logger.warn("event logging failed on node delete", error?.message || error);
  });

  await deleteNode(nodeId, workspaceId);
  void enqueueTaskJob({
    workspaceId,
    nodeId,
    actorId: userId,
    action: "delete",
    nodeUpdatedAt: toIsoString(existing.updatedAt),
  }).catch((error) => {
    logger.warn("task delete job enqueue failed on node delete", {
      message: error?.message,
      nodeId,
    });
  });
};

const lockCanvasNode = async (workspaceId, userId, nodeId) => {
  await assertWorkspaceLead(workspaceId, userId);

  const existing = await findNodeById(nodeId);
  if (!existing || existing.workspaceId.toString() !== workspaceId) {
    const error = new Error("Node not found");
    error.statusCode = 404;
    throw error;
  }

  const updated = await updateNode(nodeId, workspaceId, {
    locked: true,
    lockedBy: userId,
    lockedAt: new Date(),
  });

    appendEvent({
    workspaceId,
    userId,
    eventType: EVENT_TYPES.NODE_LOCKED,
    nodeId,
    payload: {
      locked: true,
      lockedBy: userId,
      lockedAt: updated?.lockedAt || new Date().toISOString(),
    },
  }).catch((error) => {
    logger.warn("event logging failed on node lock", error?.message || error);
  });

  return sanitizeCanvasNode(updated);
};

const unlockCanvasNode = async (workspaceId, userId, nodeId) => {
  await assertWorkspaceLead(workspaceId, userId);

  const existing = await findNodeById(nodeId);
  if (!existing || existing.workspaceId.toString() !== workspaceId) {
    const error = new Error("Node not found");
    error.statusCode = 404;
    throw error;
  }

  const updated = await updateNode(nodeId, workspaceId, {
    locked: false,
    lockedBy: null,
    lockedAt: null,
  });

   appendEvent({
    workspaceId,
    userId,
    eventType: EVENT_TYPES.NODE_UNLOCKED,
    nodeId,
    payload: {
      locked: false,
      lockedBy: null,
      lockedAt: null,
    },
  }).catch((error) => {
    logger.warn("event logging failed on node unlock", error?.message || error);
  });

  return sanitizeCanvasNode(updated);
};

const updateCanvasNodePermissions = async (
  workspaceId,
  userId,
  nodeId,
  allowedUserIds,
) => {
  await assertWorkspaceLead(workspaceId, userId);

  const existing = await findNodeById(nodeId);
  if (!existing || existing.workspaceId.toString() !== workspaceId) {
    const error = new Error("Node not found");
    error.statusCode = 404;
    throw error;
  }

  const normalizedAllowedUserIds = await normalizeNodeAllowedUserIds(
    workspaceId,
    allowedUserIds,
  );
  const beforeAllowedUserIds = Array.isArray(existing.allowedUserIds)
    ? existing.allowedUserIds.map((id) => id.toString())
    : [];
  const updated = await updateNode(nodeId, workspaceId, {
    allowedUserIds: normalizedAllowedUserIds,
  });

    appendEvent({
    workspaceId,
    userId,
    eventType: EVENT_TYPES.NODE_PERMISSION_CHANGED,
    nodeId,
    payload: {
      previousAllowedUserIds: beforeAllowedUserIds,
      nextAllowedUserIds: normalizedAllowedUserIds,
    },
  }).catch((error) => {
    logger.warn("event logging failed on node permission change", error?.message || error);
  });

  return sanitizeCanvasNode(updated);
};

export {
  VALID_NODE_TYPES,
  listCanvasNodes,
  createCanvasNode,
  updateCanvasNode,
  deleteCanvasNode,
  lockCanvasNode,
  unlockCanvasNode,
  updateCanvasNodePermissions,
  assertNodeAccess,
};

export default {
  VALID_NODE_TYPES,
  listCanvasNodes,
  createCanvasNode,
  updateCanvasNode,
  deleteCanvasNode,
  lockCanvasNode,
  unlockCanvasNode,
  updateCanvasNodePermissions,
  assertNodeAccess,
};
