import { Router } from "express";

import authMiddleware from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { invitationIdSchema, tokenSchema } from "../validation/invitation.validation.js";
import {
  acceptInvitationByIdHandler,
  acceptInvitationHandler,
  getInvitationHandler,
  listInboxHandler,
  rejectInvitationByIdHandler,
  rejectInvitationHandler,
  revokeInvitationHandler,
} from "../controllers/invitation.controller.js";

const router = Router();

router.get("/inbox", authMiddleware, listInboxHandler);
router.get("/:token", validate(tokenSchema), getInvitationHandler);
router.post("/:token/accept", authMiddleware, validate(tokenSchema), acceptInvitationHandler);
router.patch("/:token/reject", authMiddleware, validate(tokenSchema), rejectInvitationHandler);
router.patch("/:token/revoke", authMiddleware, validate(tokenSchema), revokeInvitationHandler);
router.post("/by-id/:invitationId/accept", authMiddleware, validate(invitationIdSchema), acceptInvitationByIdHandler);
router.patch("/by-id/:invitationId/reject", authMiddleware, validate(invitationIdSchema), rejectInvitationByIdHandler);

export default router;