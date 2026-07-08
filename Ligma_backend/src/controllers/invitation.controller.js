import {
  acceptInvitation,
  acceptInvitationById,
  createWorkspaceInvitation,
  getInvitationByToken,
  listPendingInvitationsForUser,
  listWorkspaceInvitations,
  rejectInvitation,
  rejectInvitationById,
  revokeInvitation,
  revokeInvitationById,
} from "../services/invitation.service.js";
import { sendSuccess } from "../utils/api-response.util.js";

const createInvitationHandler = async (req, res, next) => {
  try {
    const result = await createWorkspaceInvitation({
      workspaceId: req.params.workspaceId,
      inviterId: req.user.id,
      ...req.body,
    });

    return sendSuccess(res, 201, "Invitation created successfully", {
      invitation: result.invitation,
      inviteLink: result.inviteLink,
      workspace: result.workspace,
    });
  } catch (error) {
    return next(error);
  }
};

const listInvitationsHandler = async (req, res, next) => {
  try {
    const result = await listWorkspaceInvitations(req.params.workspaceId, req.user.id);
    return sendSuccess(res, 200, "Invitations retrieved successfully", result);
  } catch (error) {
    return next(error);
  }
};

const listInboxHandler = async (req, res, next) => {
  try {
    const invitations = await listPendingInvitationsForUser(req.user.email);
    return sendSuccess(res, 200, "Invitation inbox retrieved successfully", { invitations });
  } catch (error) {
    return next(error);
  }
};

const getInvitationHandler = async (req, res, next) => {
  try {
    const invitation = await getInvitationByToken(req.params.token);
    return sendSuccess(res, 200, "Invitation retrieved successfully", { invitation });
  } catch (error) {
    return next(error);
  }
};

const acceptInvitationHandler = async (req, res, next) => {
  try {
    const result = await acceptInvitation(req.params.token, req.user);
    return sendSuccess(res, 200, "Invitation accepted successfully", result);
  } catch (error) {
    return next(error);
  }
};

const rejectInvitationHandler = async (req, res, next) => {
  try {
    const invitation = await rejectInvitation(req.params.token, req.user);
    return sendSuccess(res, 200, "Invitation rejected successfully", { invitation });
  } catch (error) {
    return next(error);
  }
};

const acceptInvitationByIdHandler = async (req, res, next) => {
  try {
    const result = await acceptInvitationById(req.params.invitationId, req.user);
    return sendSuccess(res, 200, "Invitation accepted successfully", result);
  } catch (error) {
    return next(error);
  }
};

const rejectInvitationByIdHandler = async (req, res, next) => {
  try {
    const invitation = await rejectInvitationById(req.params.invitationId, req.user);
    return sendSuccess(res, 200, "Invitation rejected successfully", { invitation });
  } catch (error) {
    return next(error);
  }
};

const revokeInvitationHandler = async (req, res, next) => {
  try {
    const invitation = await revokeInvitation(req.params.token, req.user.id);
    return sendSuccess(res, 200, "Invitation revoked successfully", { invitation });
  } catch (error) {
    return next(error);
  }
};

const revokeInvitationByIdHandler = async (req, res, next) => {
  try {
    const invitation = await revokeInvitationById(req.params.workspaceId, req.params.invitationId, req.user.id);
    return sendSuccess(res, 200, "Invitation revoked successfully", { invitation });
  } catch (error) {
    return next(error);
  }
};

export {
  createInvitationHandler,
  listInvitationsHandler,
  listInboxHandler,
  getInvitationHandler,
  acceptInvitationHandler,
  rejectInvitationHandler,
  acceptInvitationByIdHandler,
  rejectInvitationByIdHandler,
  revokeInvitationHandler,
  revokeInvitationByIdHandler,
};

export default {
  createInvitationHandler,
  listInvitationsHandler,
  listInboxHandler,
  getInvitationHandler,
  acceptInvitationHandler,
  rejectInvitationHandler,
  acceptInvitationByIdHandler,
  rejectInvitationByIdHandler,
  revokeInvitationHandler,
  revokeInvitationByIdHandler,
};