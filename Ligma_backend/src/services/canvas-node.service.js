//canvas-node.service.js
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
  normalizeNodeAllowedUserIds ,
} from "./member.service.js";
import { classifyNodeContent } from "./classification.service.js";
import * as taskService from "./task.service.js";
import logger from "../utils/logger.util.js";

// ── Text extraction — one map covers all current and future node types ────────
// Add new node types here; the classification pipeline picks them up automatically.
const NODE_TEXT_KEYS = {
  sticky:    "text",
  text:      "text",
  rectangle: "label",
  circle:    "label",
  arrow:     "label",
};

/**
 * Extract the editable text from any node, regardless of type.
 * Returns an empty string for types with no text or no data.
 */
function getNodeText(node) {
  if (!node?.data) return "";
  const key = NODE_TEXT_KEYS[node.type];
  if (!key) return "";
  return node.data[key] || "";
}

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

  if (!canMutateNode(existing, workspaceRole,userId)) {
    const error = new Error("Forbidden");
    error.statusCode = 403;
    throw error;
  }

  return { existing, workspaceRole };
};

const createCanvasNode = async (workspaceId, userId, payload) => {
  await ensureCanvasNodeIndexes();
  await assertWorkspaceEditAccess(workspaceId, userId);

  const { type, x, y, data } = payload;

  const node = await createNode({ workspaceId, createdById: userId, type, x, y, data });
  const sanitized = sanitizeCanvasNode(node);

  // classify and sync asynchronously — works for every node type
  (async () => {
    try {
      const text = getNodeText(sanitized);
      logger.info(`canvas.node.create: node=${sanitized.id} type=${sanitized.type} text='${String(text).slice(0, 200)}'`);
      if (!text.trim()) {
        logger.info(`canvas.node.create: skipping classification (empty text) for node=${sanitized.id}`);
        return;
      }

      const result = await classifyNodeContent(text);
      logger.info(`canvas.node.create: classification result for node=${sanitized.id}: ${JSON.stringify(result)}`);
      if (result?.classification || (result?.references && result.references.length)) {
        await taskService.createTaskForNode(workspaceId, sanitized.id, {
          title: result.title || text || "",
          description: result.description || "",
          type: result.classification || (result.references?.length ? "Reference" : "Action"),
          metadata: { references: result.references || [], emails: result.emails || [] },
        });
        logger.info(`canvas.node.create: task created for node=${sanitized.id}`);
      } else {
        logger.info(`canvas.node.create: no task created for node=${sanitized.id} (no classification/references)`);
      }
    } catch (err) {
      logger.warn("classification sync failed on node create", err?.message || err);
    }
  })();
  return sanitized;
};

const updateCanvasNode = async (workspaceId, userId, nodeId, payload) => {
  const { existing } = await assertNodeAccess(workspaceId, userId, nodeId);

  const allowedFields = ["x", "y", "data"];
  const updateFields = {};
  for (const key of allowedFields) {
    if (payload[key] !== undefined) {
      updateFields[key] = payload[key];
    }
  }

  const updated = await updateNode(nodeId, workspaceId, updateFields);
  const sanitized = sanitizeCanvasNode(updated);

  // Determine the correct text key for this node type
  const textKey = NODE_TEXT_KEYS[existing.type];

  // Only re-classify when the text field was explicitly sent AND actually changed.
  // This skips drag/resize/color updates (they don't include the text field).
  const previousText = textKey ? (existing.data?.[textKey] || "") : "";
  const nextText     = textKey ? (sanitized.data?.[textKey] || "") : "";
  const textFieldWasUpdated = payload.data && textKey && Object.prototype.hasOwnProperty.call(payload.data, textKey);
  const textActuallyChanged = textFieldWasUpdated && nextText !== previousText;

  if (textActuallyChanged) {
    (async () => {
      try {
        logger.info(`canvas.node.update: node=${sanitized.id} type=${sanitized.type} prev='${String(previousText).slice(0, 200)}' next='${String(nextText).slice(0, 200)}'`);
        const result = await classifyNodeContent(nextText);
        logger.info(`canvas.node.update: classification result for node=${sanitized.id}: ${JSON.stringify(result)}`);
        if (result?.classification || (result?.references && result.references.length)) {
          await taskService.updateTaskForNode(workspaceId, sanitized.id, {
            title: result.title || nextText || "",
            description: result.description || "",
            type: result.classification || (result.references?.length ? "Reference" : undefined),
            metadata: { references: result.references || [], emails: result.emails || [] },
          });
          logger.info(`canvas.node.update: task updated/created for node=${sanitized.id}`);
        } else {
          logger.info(`canvas.node.update: no task created/updated for node=${sanitized.id}`);
        }
      } catch (err) {
        logger.warn("classification sync failed on node update", err?.message || err);
      }
    })();
  }

  return sanitized;
};

const deleteCanvasNode = async (workspaceId, userId, nodeId) => {
  await assertNodeAccess(workspaceId, userId, nodeId);

  await deleteNode(nodeId, workspaceId);
  // remove linked task asynchronously
  (async () => {
    try {
      await taskService.removeTaskForNode(workspaceId, nodeId);
    } catch (err) {
      logger.warn("task removal failed on node delete", err?.message || err);
    }
  })();
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

  return sanitizeCanvasNode(updated);
};

const updateCanvasNodePermissions = async (workspaceId, userId, nodeId, allowedUserIds) => {
  await assertWorkspaceLead(workspaceId, userId);

  const existing = await findNodeById(nodeId);
  if (!existing || existing.workspaceId.toString() !== workspaceId) {
    const error = new Error("Node not found");
    error.statusCode = 404;
    throw error;
  }

  const normalizedAllowedUserIds = await normalizeNodeAllowedUserIds(workspaceId, allowedUserIds);
  const updated = await updateNode(nodeId, workspaceId, { allowedUserIds: normalizedAllowedUserIds });
  return sanitizeCanvasNode(updated);
};

export { VALID_NODE_TYPES, listCanvasNodes, createCanvasNode, updateCanvasNode, deleteCanvasNode, lockCanvasNode, unlockCanvasNode, updateCanvasNodePermissions, assertNodeAccess };

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
