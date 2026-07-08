import { findUserById } from "../models/user.model.js";
import { findWorkspaceById, sanitizeWorkspace } from "../models/workspace.model.js";
import {
  ensureWorkspaceMemberIndexes,
  findMembersByWorkspace,
  findWorkspaceMember,
  removeMember,
  sanitizeWorkspaceMember,
  updateMemberRole,
} from "../models/workspace-member.model.js";
import { listInvitationsByWorkspace, sanitizeInvitation } from "../models/invitation.model.js";

const ALLOWED_ROLES = ["Contributor", "Viewer"];

// Asserts the requesting user is a Lead of the workspace (owner or Lead member)
const assertWorkspaceLead = async (workspaceId, userId) => {
  const workspace = await findWorkspaceById(workspaceId);

  if (!workspace) {
    const error = new Error("Workspace not found");
    error.statusCode = 404;
    throw error;
  }

  // Owner is always a Lead
  if (workspace.ownerId.toString() === userId) {
    return sanitizeWorkspace(workspace);
  }

  const member = await findWorkspaceMember(workspaceId, userId);

  if (!member || member.role !== "Lead") {
    const error = new Error("Only workspace Leads can perform this action");
    error.statusCode = 403;
    throw error;
  }

  return sanitizeWorkspace(workspace);
};

// Asserts the requesting user has access to the workspace (any role)
const assertWorkspaceAccess = async (workspaceId, userId) => {
  const workspace = await findWorkspaceById(workspaceId);

  if (!workspace) {
    const error = new Error("Workspace not found");
    error.statusCode = 404;
    throw error;
  }

  if (workspace.ownerId.toString() === userId) {
    return sanitizeWorkspace(workspace);
  }

  const member = await findWorkspaceMember(workspaceId, userId);

  if (!member) {
    const error = new Error("Access denied");
    error.statusCode = 403;
    throw error;
  }

  return sanitizeWorkspace(workspace);
};

const listWorkspaceMembers = async (workspaceId, requesterId) => {
  await ensureWorkspaceMemberIndexes();
  await assertWorkspaceAccess(workspaceId, requesterId);

  const members = await findMembersByWorkspace(workspaceId);
  const workspace = await findWorkspaceById(workspaceId);

  // Hydrate each member with their user profile
  const hydratedMembers = await Promise.all(
    members.map(async (member) => {
      const user = await findUserById(member.userId.toString());
      const sanitized = sanitizeWorkspaceMember(member);
      return {
        ...sanitized,
        name: user?.name || "Unknown",
        email: user?.email || "",
        avatarUrl: user?.avatarUrl || null,
      };
    })
  );

  // Owner entry (not in members collection, synthesized)
  const ownerUser = await findUserById(workspace.ownerId.toString());
  const ownerEntry = {
    id: `owner-${workspace._id.toString()}`,
    workspaceId: workspace._id.toString(),
    userId: workspace.ownerId.toString(),
    role: "Lead",
    isOwner: true,
    name: ownerUser?.name || "Unknown",
    email: ownerUser?.email || "",
    avatarUrl: ownerUser?.avatarUrl || null,
    joinedAt: workspace.createdAt,
  };

  return [ownerEntry, ...hydratedMembers];
};

const changeMemberRole = async (workspaceId, targetUserId, newRole, requesterId) => {
  await ensureWorkspaceMemberIndexes();

  if (!ALLOWED_ROLES.includes(newRole)) {
    const error = new Error(`Invalid role. Allowed roles: ${ALLOWED_ROLES.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }

  await assertWorkspaceLead(workspaceId, requesterId);

  const workspace = await findWorkspaceById(workspaceId);
  if (workspace.ownerId.toString() === targetUserId) {
    const error = new Error("Cannot change the role of the workspace owner");
    error.statusCode = 400;
    throw error;
  }

  const member = await findWorkspaceMember(workspaceId, targetUserId);
  if (!member) {
    const error = new Error("Member not found in this workspace");
    error.statusCode = 404;
    throw error;
  }

  const updated = await updateMemberRole(workspaceId, targetUserId, newRole);
  return sanitizeWorkspaceMember(updated);
};

const removeWorkspaceMember = async (workspaceId, targetUserId, requesterId) => {
  await ensureWorkspaceMemberIndexes();
  await assertWorkspaceLead(workspaceId, requesterId);

  const workspace = await findWorkspaceById(workspaceId);
  if (workspace.ownerId.toString() === targetUserId) {
    const error = new Error("Cannot remove the workspace owner");
    error.statusCode = 400;
    throw error;
  }

  const member = await findWorkspaceMember(workspaceId, targetUserId);
  if (!member) {
    const error = new Error("Member not found in this workspace");
    error.statusCode = 404;
    throw error;
  }

  await removeMember(workspaceId, targetUserId);
};

const listPendingInvitations = async (workspaceId, requesterId) => {
  await assertWorkspaceLead(workspaceId, requesterId);
  const invitations = await listInvitationsByWorkspace(workspaceId);
  return invitations
    .filter((inv) => inv.status === "Pending")
    .map((inv) => sanitizeInvitation(inv));
};

export {
  assertWorkspaceLead,
  assertWorkspaceAccess,
  listWorkspaceMembers,
  changeMemberRole,
  removeWorkspaceMember,
  listPendingInvitations,
};

export default {
  assertWorkspaceLead,
  assertWorkspaceAccess,
  listWorkspaceMembers,
  changeMemberRole,
  removeWorkspaceMember,
  listPendingInvitations,
};
