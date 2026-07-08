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