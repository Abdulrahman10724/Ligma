import { Router } from "express";

import authMiddleware from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { tokenSchema } from "../validation/invitation.validation.js";
import {
  acceptInvitationHandler,
  getInvitationHandler,
  rejectInvitationHandler,
  revokeInvitationHandler,
} from "../controllers/invitation.controller.js";

const router = Router();

router.get("/:token", validate(tokenSchema), getInvitationHandler);
router.post("/:token/accept", authMiddleware, validate(tokenSchema), acceptInvitationHandler);
router.patch("/:token/reject", authMiddleware, validate(tokenSchema), rejectInvitationHandler);
router.patch("/:token/revoke", authMiddleware, validate(tokenSchema), revokeInvitationHandler);

export default router;