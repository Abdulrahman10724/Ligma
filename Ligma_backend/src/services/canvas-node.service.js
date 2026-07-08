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
import { assertWorkspaceAccess } from "./member.service.js";

const listCanvasNodes = async (workspaceId, userId) => {
  await ensureCanvasNodeIndexes();
  await assertWorkspaceAccess(workspaceId, userId);

  const nodes = await findNodesByWorkspace(workspaceId);
  return nodes.map(sanitizeCanvasNode);
};

const createCanvasNode = async (workspaceId, userId, payload) => {
  await ensureCanvasNodeIndexes();
  await assertWorkspaceAccess(workspaceId, userId);

  const { type, x, y, data } = payload;

  const node = await createNode({ workspaceId, createdById: userId, type, x, y, data });
  return sanitizeCanvasNode(node);
};

const updateCanvasNode = async (workspaceId, userId, nodeId, payload) => {
  await assertWorkspaceAccess(workspaceId, userId);

  const existing = await findNodeById(nodeId);
  if (!existing || existing.workspaceId.toString() !== workspaceId) {
    const error = new Error("Node not found");
    error.statusCode = 404;
    throw error;
  }

  const allowedFields = ["x", "y", "data"];
  const updateFields = {};
  for (const key of allowedFields) {
    if (payload[key] !== undefined) {
      updateFields[key] = payload[key];
    }
  }

  const updated = await updateNode(nodeId, workspaceId, updateFields);
  return sanitizeCanvasNode(updated);
};

const deleteCanvasNode = async (workspaceId, userId, nodeId) => {
  await assertWorkspaceAccess(workspaceId, userId);

  const existing = await findNodeById(nodeId);
  if (!existing || existing.workspaceId.toString() !== workspaceId) {
    const error = new Error("Node not found");
    error.statusCode = 404;
    throw error;
  }

  await deleteNode(nodeId, workspaceId);
};

export { VALID_NODE_TYPES, listCanvasNodes, createCanvasNode, updateCanvasNode, deleteCanvasNode };

export default {
  VALID_NODE_TYPES,
  listCanvasNodes,
  createCanvasNode,
  updateCanvasNode,
  deleteCanvasNode,
};
