import { Router } from "express";

import authMiddleware from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { createWorkspaceSchema, updateWorkspaceSchema, workspaceIdSchema } from "../validation/workspace.validation.js";
import {
  createWorkspaceHandler,
  getWorkspaceHandler,
  listWorkspaces,
  updateWorkspaceHandler,
} from "../controllers/workspace.controller.js";

const router = Router();

router.use(authMiddleware);
router.get("/", listWorkspaces);
router.post("/", validate(createWorkspaceSchema), createWorkspaceHandler);
router.get("/:workspaceId", validate(workspaceIdSchema), getWorkspaceHandler);
router.patch("/:workspaceId", validate(updateWorkspaceSchema), updateWorkspaceHandler);

export default router;