import {
  changeMemberRole,
  listPendingInvitations,
  listWorkspaceMembers,
  removeWorkspaceMember,
} from "../services/member.service.js";
import { sendSuccess } from "../utils/api-response.util.js";

const listMembersHandler = async (req, res, next) => {
  try {
    const members = await listWorkspaceMembers(req.params.workspaceId, req.user.id);
    return sendSuccess(res, 200, "Members retrieved successfully", { members });
  } catch (error) {
    return next(error);
  }
};

const changeMemberRoleHandler = async (req, res, next) => {
  try {
    const member = await changeMemberRole(
      req.params.workspaceId,
      req.params.userId,
      req.body.role,
      req.user.id
    );
    return sendSuccess(res, 200, "Member role updated successfully", { member });
  } catch (error) {
    return next(error);
  }
};

const removeMemberHandler = async (req, res, next) => {
  try {
    await removeWorkspaceMember(req.params.workspaceId, req.params.userId, req.user.id);
    return sendSuccess(res, 200, "Member removed successfully");
  } catch (error) {
    return next(error);
  }
};

const listPendingInvitationsHandler = async (req, res, next) => {
  try {
    const invitations = await listPendingInvitations(req.params.workspaceId, req.user.id);
    return sendSuccess(res, 200, "Pending invitations retrieved successfully", { invitations });
  } catch (error) {
    return next(error);
  }
};

export {
  listMembersHandler,
  changeMemberRoleHandler,
  removeMemberHandler,
  listPendingInvitationsHandler,
};

export default {
  listMembersHandler,
  changeMemberRoleHandler,
  removeMemberHandler,
  listPendingInvitationsHandler,
};
