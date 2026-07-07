import { ObjectId } from "mongodb";

import { getCollection } from "../config/db.config.js";

const COLLECTION_NAME = "workspaces";

const getWorkspacesCollection = () => getCollection(COLLECTION_NAME);

const ensureWorkspaceIndexes = async () => {
  await getWorkspacesCollection().createIndex({ ownerId: 1, createdAt: -1 });
};

const sanitizeWorkspace = (workspace) => {
  if (!workspace) {
    return null;
  }

  return {
    ...workspace,
    id: workspace._id ? workspace._id.toString() : workspace.id,
    ownerId: workspace.ownerId ? workspace.ownerId.toString() : workspace.ownerId,
  };
};

const findWorkspaceById = async (workspaceId) => getWorkspacesCollection().findOne({ _id: new ObjectId(workspaceId) });

const findWorkspacesByOwner = async (ownerId) =>
  getWorkspacesCollection().find({ ownerId: new ObjectId(ownerId) }).sort({ createdAt: -1 }).toArray();

const createWorkspace = async ({ title, description, ownerId }) => {
  const now = new Date();
  const workspaceDocument = {
    title: title.trim(),
    description: description?.trim() || "",
    ownerId: new ObjectId(ownerId),
    createdAt: now,
    updatedAt: now,
  };

  const result = await getWorkspacesCollection().insertOne(workspaceDocument);

  return {
    ...workspaceDocument,
    _id: result.insertedId,
  };
};

const updateWorkspaceById = async (workspaceId, ownerId, updateFields) => {
  const now = new Date();
  const updateDocument = {
    ...updateFields,
    updatedAt: now,
  };

  const result = await getWorkspacesCollection().findOneAndUpdate(
    { _id: new ObjectId(workspaceId), ownerId: new ObjectId(ownerId) },
    { $set: updateDocument },
    { returnDocument: "after" }
  );

  return result;
};

export {
  COLLECTION_NAME,
  ensureWorkspaceIndexes,
  sanitizeWorkspace,
  findWorkspaceById,
  findWorkspacesByOwner,
  createWorkspace,
  updateWorkspaceById,
};

export default {
  COLLECTION_NAME,
  ensureWorkspaceIndexes,
  sanitizeWorkspace,
  findWorkspaceById,
  findWorkspacesByOwner,
  createWorkspace,
  updateWorkspaceById,
};