import { Router } from "express";

import authMiddleware from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { createWorkspaceSchema, updateWorkspaceSchema, workspaceIdSchema } from "../validation/workspace.validation.js";
import { createWorkspaceInvitationSchema, revokeWorkspaceInvitationSchema } from "../validation/invitation.validation.js";
import { listEventLogsSchema } from "../validation/event-log.validation.js";
import {
  createWorkspaceHandler,
  getWorkspaceHandler,
  listWorkspaces,
  updateWorkspaceHandler,
} from "../controllers/workspace.controller.js";
import { createInvitationHandler, listInvitationsHandler, revokeInvitationByIdHandler } from "../controllers/invitation.controller.js";
import { getWorkspaceEventsHandler } from "../controllers/event-log.controller.js";

const router = Router();

router.use(authMiddleware);
router.get("/", listWorkspaces);
router.post("/", validate(createWorkspaceSchema), createWorkspaceHandler);
router.get("/:workspaceId/invitations", validate(workspaceIdSchema), listInvitationsHandler);
router.post("/:workspaceId/invitations", validate(createWorkspaceInvitationSchema), createInvitationHandler);
router.patch("/:workspaceId/invitations/:invitationId/revoke", validate(revokeWorkspaceInvitationSchema), revokeInvitationByIdHandler);
router.get("/:workspaceId/events", validate(listEventLogsSchema), getWorkspaceEventsHandler);
router.get("/:workspaceId", validate(workspaceIdSchema), getWorkspaceHandler);
router.patch("/:workspaceId", validate(updateWorkspaceSchema), updateWorkspaceHandler);

export default router;