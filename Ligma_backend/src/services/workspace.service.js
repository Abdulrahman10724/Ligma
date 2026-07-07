import { ensureWorkspaceIndexes, createWorkspace, findWorkspaceById, findWorkspacesByOwner, sanitizeWorkspace, updateWorkspaceById } from "../models/workspace.model.js";

const listUserWorkspaces = async (ownerId) => {
  await ensureWorkspaceIndexes();

  const workspaces = await findWorkspacesByOwner(ownerId);

  return workspaces.map(sanitizeWorkspace);
};

const getWorkspace = async (workspaceId, ownerId) => {
  const workspace = await findWorkspaceById(workspaceId);

  if (!workspace || workspace.ownerId.toString() !== ownerId) {
    const error = new Error("Workspace not found");
    error.statusCode = 404;
    throw error;
  }

  return sanitizeWorkspace(workspace);
};

const createUserWorkspace = async ({ title, description }, ownerId) => {
  await ensureWorkspaceIndexes();

  const workspace = await createWorkspace({ title, description, ownerId });

  return sanitizeWorkspace(workspace);
};

const updateUserWorkspace = async (workspaceId, ownerId, payload) => {
  await ensureWorkspaceIndexes();

  const updateFields = {};

  if (payload.title !== undefined) {
    updateFields.title = payload.title.trim();
  }

  if (payload.description !== undefined) {
    updateFields.description = payload.description?.trim() || "";
  }

  const result = await updateWorkspaceById(workspaceId, ownerId, updateFields);
  const workspace = result?.value;

  if (!workspace) {
    const error = new Error("Workspace not found");
    error.statusCode = 404;
    throw error;
  }

  return sanitizeWorkspace(workspace);
};

export { listUserWorkspaces, getWorkspace, createUserWorkspace, updateUserWorkspace };

export default {
  listUserWorkspaces,
  getWorkspace,
  createUserWorkspace,
  updateUserWorkspace,
};