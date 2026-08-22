import {
  ensureWorkspaceIndexes,
  createWorkspace,
  findWorkspaceById,
  findWorkspacesByIds,
  findWorkspacesByOwner,
  sanitizeWorkspace,
  updateWorkspaceById,
  deleteWorkspaceById,
} from "../models/workspace.model.js";
import { findMembershipsForUser } from "../models/workspace-member.model.js";
import { seedChannelsForWorkspace } from "./channel.service.js";

const listUserWorkspaces = async (ownerId, { includeHidden = false } = {}) => {
  await ensureWorkspaceIndexes();

  const [ownedWorkspaces, memberships] = await Promise.all([
    findWorkspacesByOwner(ownerId),
    findMembershipsForUser(ownerId),
  ]);

  const memberWorkspaceIds = memberships.map((membership) => membership.workspaceId?.toString()).filter(Boolean);
  const memberWorkspaces = memberWorkspaceIds.length ? await findWorkspacesByIds(memberWorkspaceIds) : [];
  const workspacesById = new Map();
  const memberRoleByWorkspaceId = new Map(
    memberships
      .filter((membership) => membership.workspaceId)
      .map((membership) => [membership.workspaceId.toString(), membership.role || "Viewer"])
  );

  for (const workspace of [...ownedWorkspaces, ...memberWorkspaces]) {
    const sanitized = sanitizeWorkspace(workspace);
    const workspaceId = workspace._id.toString();
    const currentUserRole = workspace.ownerId.toString() === ownerId
      ? "Lead"
      : memberRoleByWorkspaceId.get(workspaceId) || "Viewer";

    workspacesById.set(workspaceId, {
      ...sanitized,
      currentUserRole,
    });
  }

   const all = Array.from(workspacesById.values());
  const visible = includeHidden ? all : all.filter((workspace) => !workspace.hidden);

  return visible.sort((left, right) => {
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

  let currentUserRole = "Lead";

  if (workspace.ownerId.toString() !== ownerId) {
    const memberships = await findMembershipsForUser(ownerId);
    const membership = memberships.find((entry) => entry.workspaceId?.toString() === workspaceId);

    if (!membership) {
      const error = new Error("Workspace not found");
      error.statusCode = 404;
      throw error;
    }

    currentUserRole = membership.role || "Viewer";
  }

  return {
    ...sanitizeWorkspace(workspace),
    currentUserRole,
  };
};

const createUserWorkspace = async ({ title, description }, ownerId) => {
  await ensureWorkspaceIndexes();
  const workspace = await createWorkspace({ title, description, ownerId });
  await seedChannelsForWorkspace(workspace._id.toString(), ownerId); //  default channels
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
  const workspace = result;

  if (!workspace) {
    const error = new Error("Workspace not found");
    error.statusCode = 404;
    throw error;
  }

  return sanitizeWorkspace(workspace);
};

const deleteUserWorkspace = async (workspaceId, ownerId, confirmTitle) => {
  const workspace = await findWorkspaceById(workspaceId);

  if (!workspace || workspace.ownerId.toString() !== ownerId) {
    const error = new Error("Workspace not found");
    error.statusCode = 404;
    throw error;
  }

  if ((confirmTitle || "").trim() !== workspace.title) {
    const error = new Error("Workspace name confirmation does not match");
    error.statusCode = 400;
    throw error;
  }

  const result = await deleteWorkspaceById(workspaceId, ownerId);
  if (!result.deletedCount) {
    const error = new Error("Workspace not found");
    error.statusCode = 404;
    throw error;
  }

  return { success: true };
};

const setWorkspaceHidden = async (workspaceId, ownerId, hidden) => {
  const workspace = await findWorkspaceById(workspaceId);

  if (!workspace || workspace.ownerId.toString() !== ownerId) {
    const error = new Error("Workspace not found");
    error.statusCode = 404;
    throw error;
  }

  const updated = await updateWorkspaceById(workspaceId, ownerId, { hidden });
  return sanitizeWorkspace(updated);
};

export { listUserWorkspaces, getWorkspace, createUserWorkspace, updateUserWorkspace, deleteUserWorkspace, setWorkspaceHidden };

export default {
  listUserWorkspaces,
  getWorkspace,
  createUserWorkspace,
  updateUserWorkspace,
  deleteUserWorkspace,
  setWorkspaceHidden,
};