import {
  ensureWorkspaceIndexes,
  createWorkspace,
  findWorkspaceById,
  findWorkspacesByIds,
  findWorkspacesByOwner,
  sanitizeWorkspace,
  updateWorkspaceById,
} from "../models/workspace.model.js";
import { findMembershipsForUser } from "../models/workspace-member.model.js";

const listUserWorkspaces = async (ownerId) => {
  await ensureWorkspaceIndexes();

  const [ownedWorkspaces, memberships] = await Promise.all([
    findWorkspacesByOwner(ownerId),
    findMembershipsForUser(ownerId),
  ]);

  const memberWorkspaceIds = memberships.map((membership) => membership.workspaceId?.toString()).filter(Boolean);
  const memberWorkspaces = memberWorkspaceIds.length ? await findWorkspacesByIds(memberWorkspaceIds) : [];
  const workspacesById = new Map();

  for (const workspace of [...ownedWorkspaces, ...memberWorkspaces]) {
    workspacesById.set(workspace._id.toString(), sanitizeWorkspace(workspace));
  }

  return Array.from(workspacesById.values()).sort((left, right) => {
    const leftDate = new Date(left.updatedAt || left.createdAt || 0).getTime();
    const rightDate = new Date(right.updatedAt || right.createdAt || 0).getTime();
    return rightDate - leftDate;
  });
};

const getWorkspace = async (workspaceId, ownerId) => {
  const workspace = await findWorkspaceById(workspaceId);

  if (!workspace) {
    const error = new Error("Workspace not found");
    error.statusCode = 404;
    throw error;
  }

  if (workspace.ownerId.toString() !== ownerId) {
    const membership = await findMembershipsForUser(ownerId);
    const isMember = membership.some((entry) => entry.workspaceId?.toString() === workspaceId);

    if (!isMember) {
      const error = new Error("Workspace not found");
      error.statusCode = 404;
      throw error;
    }
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