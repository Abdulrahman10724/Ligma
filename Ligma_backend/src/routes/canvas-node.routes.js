import { Router } from "express";

import authMiddleware from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import {
  listNodesSchema,
  createNodeSchema,
  updateNodeSchema,
  updateNodePermissionsSchema,
  lockNodeSchema,
  deleteNodeSchema,
} from "../validation/canvas-node.validation.js";
import {
  listNodesHandler,
  createNodeHandler,
  updateNodeHandler,
  deleteNodeHandler,
  lockNodeHandler,
  unlockNodeHandler,
  updateNodePermissionsHandler,
} from "../controllers/canvas-node.controller.js";

const router = Router({ mergeParams: true });

router.use(authMiddleware);

// GET /api/v1/workspaces/:workspaceId/canvas/nodes
router.get("/nodes", validate(listNodesSchema), listNodesHandler);

// POST /api/v1/workspaces/:workspaceId/canvas/nodes
router.post("/nodes", validate(createNodeSchema), createNodeHandler);

// PATCH /api/v1/workspaces/:workspaceId/canvas/nodes/:nodeId
router.patch("/nodes/:nodeId", validate(updateNodeSchema), updateNodeHandler);

// PATCH /api/v1/workspaces/:workspaceId/canvas/nodes/:nodeId/lock
router.patch("/nodes/:nodeId/lock", validate(lockNodeSchema), lockNodeHandler);

// PATCH /api/v1/workspaces/:workspaceId/canvas/nodes/:nodeId/unlock
router.patch("/nodes/:nodeId/unlock", validate(lockNodeSchema), unlockNodeHandler);

// PATCH /api/v1/workspaces/:workspaceId/canvas/nodes/:nodeId/permissions
router.patch("/nodes/:nodeId/permissions", validate(updateNodePermissionsSchema), updateNodePermissionsHandler);

// DELETE /api/v1/workspaces/:workspaceId/canvas/nodes/:nodeId
router.delete("/nodes/:nodeId", validate(deleteNodeSchema), deleteNodeHandler);

export default router;
