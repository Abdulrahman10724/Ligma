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
const NODE_ALLOWED_ROLES = ["Lead", "Contributor", "Viewer"];

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

// Asserts the requesting user can modify workspace resources (owner, Lead, Contributor)
const assertWorkspaceEditAccess = async (workspaceId, userId) => {
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

  if (member.role === "Viewer") {
    const error = new Error("Viewer role has read-only access");
    error.statusCode = 403;
    throw error;
  }

  return sanitizeWorkspace(workspace);
};

const getWorkspaceRole = async (workspaceId, userId) => {
  const workspace = await findWorkspaceById(workspaceId);

  if (!workspace) {
    const error = new Error("Workspace not found");
    error.statusCode = 404;
    throw error;
  }

  if (workspace.ownerId.toString() === userId) {
    return "Lead";
  }

  const member = await findWorkspaceMember(workspaceId, userId);
  return member?.role || "Viewer";
};

const listWorkspaceRoles = async (workspaceId) => {
  const workspace = await findWorkspaceById(workspaceId);

  if (!workspace) {
    const error = new Error("Workspace not found");
    error.statusCode = 404;
    throw error;
  }

  const members = await findMembersByWorkspace(workspaceId);
  const roles = new Set(["Lead"]);

  for (const member of members) {
    if (member?.role) {
      roles.add(member.role);
    }
  }

  return Array.from(roles);
};
// ❌ Hata do: normalizeNodeAllowedRoles

// ✅ Naya function — validate that every submitted userId is actually
// a real workspace member (Lead/Contributor only, never Viewer)
const normalizeNodeAllowedUserIds = async (workspaceId, allowedUserIds) => {
  if (!Array.isArray(allowedUserIds)) {
    const error = new Error("allowedUserIds must be an array");
    error.statusCode = 400;
    throw error;
  }

  const normalized = [...new Set(allowedUserIds.map((id) => String(id || "").trim()).filter(Boolean))];

  // Empty array is valid — it means "unrestricted" (all Contributors can edit)
  if (!normalized.length) {
    return [];
  }

  const workspace = await findWorkspaceById(workspaceId);
  if (!workspace) {
    const error = new Error("Workspace not found");
    error.statusCode = 404;
    throw error;
  }

  const members = await findMembersByWorkspace(workspaceId);
  const eligibleUserIds = new Set(
    members.filter((m) => m.role === "Contributor").map((m) => m.userId.toString())
  );
  // Lead/owner is always implicitly allowed, no need to include them in the list,
  // but if the frontend sends the owner's id too, that's harmless — just filter to
  // valid Contributor ids only (Viewers can never be granted edit access here).
  const invalidIds = normalized.filter(
    (id) => id !== workspace.ownerId.toString() && !eligibleUserIds.has(id)
  );

  if (invalidIds.length) {
    const error = new Error("One or more selected members are not valid Contributors of this workspace");
    error.statusCode = 400;
    throw error;
  }

  // Strip the owner id out if present — it's redundant since Lead always has access
  return normalized.filter((id) => id !== workspace.ownerId.toString());
};

const canViewNode = (node, workspaceRole) => {
  return Boolean(node) && workspaceRole !== "Viewer" ? true : Boolean(node);
};

// ✅ Updated: check specific userId membership instead of generic role
const canMutateNode = (node, workspaceRole, userId) => {
  if (!node) {
    return false;
  }

  if (workspaceRole === "Lead") {
    return true;
  }

  if (workspaceRole === "Viewer" || node.locked) {
    return false;
  }

  // Contributor: unrestricted (empty list) means everyone with Contributor role can edit;
  // otherwise only explicitly-allowed members can edit this specific node.
  const allowedUserIds = Array.isArray(node.allowedUserIds) ? node.allowedUserIds : [];
  if (!allowedUserIds.length) {
    return true;
  }

  return allowedUserIds.includes(String(userId));
};

const canLockNode = (workspaceRole) => workspaceRole === "Lead";
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
  assertWorkspaceEditAccess,
  getWorkspaceRole,
  listWorkspaceRoles,
  normalizeNodeAllowedUserIds,
  canViewNode,
  canMutateNode,
  canLockNode,
  listWorkspaceMembers,
  changeMemberRole,
  removeWorkspaceMember,
  listPendingInvitations,
};

export default {
  assertWorkspaceLead,
  assertWorkspaceAccess,
  assertWorkspaceEditAccess,
  getWorkspaceRole,
  listWorkspaceRoles,
  normalizeNodeAllowedUserIds,
  canViewNode,
  canMutateNode,
  canLockNode,
  listWorkspaceMembers,
  changeMemberRole,
  removeWorkspaceMember,
  listPendingInvitations,
};
