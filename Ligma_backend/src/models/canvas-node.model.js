import { ObjectId } from "mongodb";

import { getCollection } from "../config/db.config.js";

const COLLECTION_NAME = "canvasNodes";

const getCanvasNodesCollection = () => getCollection(COLLECTION_NAME);

const VALID_NODE_TYPES = ["sticky", "text", "rectangle", "circle", "arrow", "diamond", "triangle", "line"];
// Empty array = unrestricted: every Contributor (+ Lead, always) can edit.
const DEFAULT_ALLOWED_USER_IDS = [];

let canvasNodeIndexesReady = false;
let canvasNodeIndexesPromise = null;

const ensureCanvasNodeIndexes = async () => {
  if (canvasNodeIndexesReady) return;

  if (!canvasNodeIndexesPromise) {
    canvasNodeIndexesPromise = (async () => {
      await getCanvasNodesCollection().createIndex({ workspaceId: 1, createdAt: -1 });
      await getCanvasNodesCollection().createIndex({ workspaceId: 1, type: 1 });
      canvasNodeIndexesReady = true;
    })().finally(() => {
      canvasNodeIndexesPromise = null;
    });
  }

  await canvasNodeIndexesPromise;
};

const sanitizeCanvasNode = (node) => {
  if (!node) return null;

  return {
    ...node,
    id: node._id ? node._id.toString() : node.id,
    workspaceId: node.workspaceId ? node.workspaceId.toString() : node.workspaceId,
    createdById: node.createdById ? node.createdById.toString() : node.createdById,
    lockedBy: node.lockedBy ? node.lockedBy.toString() : null,
    locked: Boolean(node.locked),
    lockedAt: node.lockedAt ? new Date(node.lockedAt).toISOString() : null,
    parentNodeId: node.parentNodeId ? node.parentNodeId.toString() : null,
    allowedUserIds: Array.isArray(node.allowedUserIds)
      ? [...new Set(node.allowedUserIds.map((id) => id.toString()))]
      : [...DEFAULT_ALLOWED_USER_IDS],
    aiClassification: node.aiClassification || null,
    aiClassifiedAt: node.aiClassifiedAt ? new Date(node.aiClassifiedAt).toISOString() : null,
    aiClassificationJobId: node.aiClassificationJobId || null,
    aiClassificationTitle: node.aiClassificationTitle || "",
    aiClassificationDescription: node.aiClassificationDescription || "",
    aiReferences: Array.isArray(node.aiReferences) ? [...node.aiReferences] : [],
    aiEmails: Array.isArray(node.aiEmails) ? [...node.aiEmails] : [],
  };
};

const findNodesByWorkspace = async (workspaceId) =>
  getCanvasNodesCollection()
    .find({ workspaceId: new ObjectId(workspaceId) })
    .sort({ createdAt: 1 })
    .toArray();

const findNodeById = async (nodeId) =>
  getCanvasNodesCollection().findOne({ _id: new ObjectId(nodeId) });
const createNode = async ({ workspaceId, createdById, type, x, y, data, parentNodeId = null }) => {
  const now = new Date();
  const nodeDocument = {
    workspaceId: new ObjectId(workspaceId),
    createdById: new ObjectId(createdById),
    type,
    x,
    y,
    data: data || {},
    locked: false,
    lockedBy: null,
    lockedAt: null,
    allowedUserIds: [...DEFAULT_ALLOWED_USER_IDS],
    aiClassification: null,
    aiClassifiedAt: null,
    aiClassificationJobId: null,
    aiClassificationTitle: "",
    aiClassificationDescription: "",
    aiReferences: [],
    aiEmails: [],
    parentNodeId: parentNodeId ? new ObjectId(parentNodeId) : null,
    createdAt: now,
    updatedAt: now,
  };

  const result = await getCanvasNodesCollection().insertOne(nodeDocument);

  return { ...nodeDocument, _id: result.insertedId };
};
const updateNode = async (nodeId, workspaceId, updateFields) => {
  const now = new Date();
  return getCanvasNodesCollection().findOneAndUpdate(
    { _id: new ObjectId(nodeId), workspaceId: new ObjectId(workspaceId) },
    { $set: { ...updateFields, updatedAt: now } },
    { returnDocument: "after", includeResultMetadata: false }
  );
};

const deleteNode = async (nodeId, workspaceId) =>
  getCanvasNodesCollection().deleteOne({
    _id: new ObjectId(nodeId),
    workspaceId: new ObjectId(workspaceId),
  });

export {
  COLLECTION_NAME,
  VALID_NODE_TYPES,
  DEFAULT_ALLOWED_USER_IDS,
  ensureCanvasNodeIndexes,
  sanitizeCanvasNode,
  findNodesByWorkspace,
  findNodeById,
  createNode,
  updateNode,
  deleteNode,
};

export default {
  COLLECTION_NAME,
  VALID_NODE_TYPES,
  DEFAULT_ALLOWED_USER_IDS,
  ensureCanvasNodeIndexes,
  sanitizeCanvasNode,
  findNodesByWorkspace,
  findNodeById,
  createNode,
  updateNode,
  deleteNode,
};