import crypto from "crypto";

import config from "../config/env.config.js";
import { findUserByEmail } from "../models/user.model.js";
import { findWorkspaceById, sanitizeWorkspace } from "../models/workspace.model.js";
import {
  createInvitationDocument,
  expirePendingInvitations,
  ensureInvitationIndexes,
  findInvitationByTokenHash,
  findInvitationById,
  findInvitationByWorkspaceAndEmail,
  findPendingInvitationsByEmail,
  listInvitationsByWorkspace,
  sanitizeInvitation,
  updateInvitationByTokenHash,
  updateInvitationById,
} from "../models/invitation.model.js";
import {
  createWorkspaceMember,
  ensureWorkspaceMemberIndexes,
  findWorkspaceMember,
} from "../models/workspace-member.model.js";
import { ObjectId } from "mongodb";

const INVITATION_TTL_DAYS = 7;
const INVITATION_BASE_URL = config.CLIENT_URL;

const toTokenHash = (token) => crypto.createHash("sha256").update(token).digest("hex");

const createInvitationLink = (token) => new URL(`/invite/${token}`, INVITATION_BASE_URL).toString();

const assertWorkspaceOwner = async (workspaceId, userId) => {
  const workspace = await findWorkspaceById(workspaceId);

  if (!workspace || workspace.ownerId.toString() !== userId) {
    const error = new Error("Workspace not found");
    error.statusCode = 404;
    throw error;
  }

  return sanitizeWorkspace(workspace);
};

const hydrateInvitation = (invitation) => {
  if (!invitation) {
    return null;
  }

  return sanitizeInvitation(invitation);
};

const buildPublicInvitation = (invitation, workspace) => ({
  id: invitation.id,
  workspaceId: invitation.workspaceId,
  workspaceTitle: workspace.title,
  email: invitation.email,
  role: invitation.role,
  status: invitation.status,
  expiresAt: invitation.expiresAt,
  createdAt: invitation.createdAt,
  respondedAt: invitation.respondedAt || null,
});

const createWorkspaceInvitation = async ({ workspaceId, inviterId, email, role }) => {
  await ensureInvitationIndexes();
  await ensureWorkspaceMemberIndexes();

  const workspace = await assertWorkspaceOwner(workspaceId, inviterId);
  const normalizedEmail = email.trim().toLowerCase();

  if (role === "Lead") {
    const error = new Error("Lead invitations are not allowed");
    error.statusCode = 400;
    throw error;
  }

  const existingInvitation = await findInvitationByWorkspaceAndEmail(workspaceId, normalizedEmail);
  if (existingInvitation) {
    const error = new Error("A pending invitation already exists for this email");
    error.statusCode = 409;
    throw error;
  }

  const invitedUser = await findUserByEmail(normalizedEmail);
  if (invitedUser) {
    const member = await findWorkspaceMember(workspaceId, invitedUser._id.toString());
    if (member) {
      const error = new Error("This user is already a workspace member");
      error.statusCode = 409;
      throw error;
    }
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000);

  const invitationDocument = {
    workspaceId: new ObjectId(workspaceId),
    email: normalizedEmail,
    role,
    tokenHash: toTokenHash(rawToken),
    status: "Pending",
    expiresAt,
    createdAt: now,
    updatedAt: now,
    respondedAt: null,
    invitedById: inviterId,
  };

  const savedInvitation = await createInvitationDocument(invitationDocument);

  return {
    invitation: hydrateInvitation(savedInvitation),
    inviteLink: createInvitationLink(rawToken),
    workspace,
  };
};

const listWorkspaceInvitations = async (workspaceId, userId) => {
  await ensureInvitationIndexes();
  await expirePendingInvitations();
  await assertWorkspaceOwner(workspaceId, userId);
  const workspace = await findWorkspaceById(workspaceId);
  const invitations = await listInvitationsByWorkspace(workspaceId);

  return {
    workspace: sanitizeWorkspace(workspace),
    invitations: invitations.map((invitation) => ({
      ...hydrateInvitation(invitation),
      inviteLink: null,
    })),
  };
};

const listPendingInvitationsForUser = async (email) => {
  await ensureInvitationIndexes();
  await expirePendingInvitations();

  const invitations = await findPendingInvitationsByEmail(email);

  const inbox = await Promise.all(
    invitations.map(async (invitation) => {
      const workspace = await findWorkspaceById(invitation.workspaceId.toString());
      if (!workspace) return null;

      return {
        ...buildPublicInvitation(hydrateInvitation(invitation), sanitizeWorkspace(workspace)),
        workspace: sanitizeWorkspace(workspace),
      };
    })
  );

  return inbox.filter(Boolean);
};

const getInvitationByToken = async (token) => {
  await ensureInvitationIndexes();
  await expirePendingInvitations();
  const invitation = await findInvitationByTokenHash(toTokenHash(token));

  if (!invitation) {
    const error = new Error("Invitation not found");
    error.statusCode = 404;
    throw error;
  }

  const workspace = await findWorkspaceById(invitation.workspaceId.toString());

  if (!workspace) {
    const error = new Error("Workspace not found");
    error.statusCode = 404;
    throw error;
  }

  return buildPublicInvitation(hydrateInvitation(invitation), sanitizeWorkspace(workspace));
};

const acceptInvitation = async (token, user) => {
  await ensureInvitationIndexes();
  await ensureWorkspaceMemberIndexes();
  await expirePendingInvitations();
  const invitation = await findInvitationByTokenHash(toTokenHash(token));

  if (!invitation) {
    const error = new Error("Invitation not found");
    error.statusCode = 404;
    throw error;
  }

  if (invitation.status !== "Pending") {
    const error = new Error(`Invitation is already ${invitation.status.toLowerCase()}`);
    error.statusCode = 409;
    throw error;
  }

  if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
    const error = new Error("This invitation is not assigned to the current user");
    error.statusCode = 403;
    throw error;
  }

  const workspace = await findWorkspaceById(invitation.workspaceId.toString());
  if (!workspace) {
    const error = new Error("Workspace not found");
    error.statusCode = 404;
    throw error;
  }

  const existingMember = await findWorkspaceMember(invitation.workspaceId.toString(), user.id);
  if (!existingMember) {
    await createWorkspaceMember({
      workspaceId: invitation.workspaceId.toString(),
      userId: user.id,
      role: invitation.role,
    });
  }

  const now = new Date();
  const updated = await updateInvitationByTokenHash(toTokenHash(token), {
    status: "Accepted",
    respondedAt: now,
    updatedAt: now,
  });

  return {
    invitation: hydrateInvitation(updated.value),
    workspace: sanitizeWorkspace(workspace),
  };
};

const acceptInvitationById = async (invitationId, user) => {
  await ensureInvitationIndexes();
  await ensureWorkspaceMemberIndexes();
  await expirePendingInvitations();

  const invitation = await findInvitationById(invitationId);

  if (!invitation) {
    const error = new Error("Invitation not found");
    error.statusCode = 404;
    throw error;
  }

  if (invitation.status !== "Pending") {
    const error = new Error(`Invitation is already ${invitation.status.toLowerCase()}`);
    error.statusCode = 409;
    throw error;
  }

  if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
    const error = new Error("This invitation is not assigned to the current user");
    error.statusCode = 403;
    throw error;
  }

  const workspace = await findWorkspaceById(invitation.workspaceId.toString());
  if (!workspace) {
    const error = new Error("Workspace not found");
    error.statusCode = 404;
    throw error;
  }

  const existingMember = await findWorkspaceMember(invitation.workspaceId.toString(), user.id);
  if (!existingMember) {
    await createWorkspaceMember({
      workspaceId: invitation.workspaceId.toString(),
      userId: user.id,
      role: invitation.role,
    });
  }

  const now = new Date();
  const updated = await updateInvitationById(invitationId, {
    status: "Accepted",
    respondedAt: now,
    updatedAt: now,
  });

  return {
    invitation: hydrateInvitation(updated.value),
    workspace: sanitizeWorkspace(workspace),
  };
};

const rejectInvitation = async (token, user) => {
  await ensureInvitationIndexes();
  await expirePendingInvitations();
  const invitation = await findInvitationByTokenHash(toTokenHash(token));

  if (!invitation) {
    const error = new Error("Invitation not found");
    error.statusCode = 404;
    throw error;
  }

  if (invitation.status !== "Pending") {
    const error = new Error(`Invitation is already ${invitation.status.toLowerCase()}`);
    error.statusCode = 409;
    throw error;
  }

  if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
    const error = new Error("This invitation is not assigned to the current user");
    error.statusCode = 403;
    throw error;
  }

  const now = new Date();
  const updated = await updateInvitationByTokenHash(toTokenHash(token), {
    status: "Rejected",
    respondedAt: now,
    updatedAt: now,
  });

  return hydrateInvitation(updated.value);
};

const rejectInvitationById = async (invitationId, user) => {
  await ensureInvitationIndexes();
  await expirePendingInvitations();

  const invitation = await findInvitationById(invitationId);

  if (!invitation) {
    const error = new Error("Invitation not found");
    error.statusCode = 404;
    throw error;
  }

  if (invitation.status !== "Pending") {
    const error = new Error(`Invitation is already ${invitation.status.toLowerCase()}`);
    error.statusCode = 409;
    throw error;
  }

  if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
    const error = new Error("This invitation is not assigned to the current user");
    error.statusCode = 403;
    throw error;
  }

  const now = new Date();
  const updated = await updateInvitationById(invitationId, {
    status: "Rejected",
    respondedAt: now,
    updatedAt: now,
  });

  return hydrateInvitation(updated.value);
};

const revokeInvitation = async (token, userId) => {
  await ensureInvitationIndexes();
  await expirePendingInvitations();
  const invitation = await findInvitationByTokenHash(toTokenHash(token));

  if (!invitation) {
    const error = new Error("Invitation not found");
    error.statusCode = 404;
    throw error;
  }

  await assertWorkspaceOwner(invitation.workspaceId.toString(), userId);

  if (invitation.status !== "Pending") {
    const error = new Error(`Invitation is already ${invitation.status.toLowerCase()}`);
    error.statusCode = 409;
    throw error;
  }

  const now = new Date();
  const updated = await updateInvitationByTokenHash(toTokenHash(token), {
    status: "Revoked",
    respondedAt: now,
    updatedAt: now,
  });

  return hydrateInvitation(updated.value);
};

const revokeInvitationById = async (workspaceId, invitationId, userId) => {
  await ensureInvitationIndexes();
  await expirePendingInvitations();
  await assertWorkspaceOwner(workspaceId, userId);

  const invitation = await findInvitationById(invitationId);

  if (!invitation || invitation.workspaceId.toString() !== workspaceId) {
    const error = new Error("Invitation not found");
    error.statusCode = 404;
    throw error;
  }

  if (invitation.status !== "Pending") {
    const error = new Error(`Invitation is already ${invitation.status.toLowerCase()}`);
    error.statusCode = 409;
    throw error;
  }

  const now = new Date();
  const updated = await updateInvitationById(invitationId, {
    status: "Revoked",
    respondedAt: now,
    updatedAt: now,
  });

  return hydrateInvitation(updated.value);
};

export {
  createWorkspaceInvitation,
  listWorkspaceInvitations,
  listPendingInvitationsForUser,
  getInvitationByToken,
  acceptInvitation,
  acceptInvitationById,
  rejectInvitation,
  rejectInvitationById,
  revokeInvitation,
  revokeInvitationById,
};

export default {
  createWorkspaceInvitation,
  listWorkspaceInvitations,
  listPendingInvitationsForUser,
  getInvitationByToken,
  acceptInvitation,
  acceptInvitationById,
  rejectInvitation,
  rejectInvitationById,
  revokeInvitation,
  revokeInvitationById,
};