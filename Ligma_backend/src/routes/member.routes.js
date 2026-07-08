import { Router } from "express";

import authMiddleware from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { listMembersSchema, changeMemberRoleSchema, removeMemberSchema } from "../validation/member.validation.js";
import {
  listMembersHandler,
  changeMemberRoleHandler,
  removeMemberHandler,
  listPendingInvitationsHandler,
} from "../controllers/member.controller.js";
import { workspaceIdSchema } from "../validation/workspace.validation.js";

const router = Router({ mergeParams: true });

router.use(authMiddleware);

// GET /api/v1/workspaces/:workspaceId/members
router.get("/", validate(listMembersSchema), listMembersHandler);

// GET /api/v1/workspaces/:workspaceId/members/invitations/pending
router.get("/invitations/pending", validate(workspaceIdSchema), listPendingInvitationsHandler);

// PATCH /api/v1/workspaces/:workspaceId/members/:userId/role
router.patch("/:userId/role", validate(changeMemberRoleSchema), changeMemberRoleHandler);

// DELETE /api/v1/workspaces/:workspaceId/members/:userId
router.delete("/:userId", validate(removeMemberSchema), removeMemberHandler);

export default router;
