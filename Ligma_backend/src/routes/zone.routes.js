import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import {
  listZonesHandler,
  createZoneHandler,
  updateZoneHandler,
  deleteZoneHandler,
} from "../controllers/zone.controller.js";

const router = Router({ mergeParams: true });
router.use(authMiddleware);

// /api/v1/workspaces/:workspaceId/zones
router.get("/", listZonesHandler);
router.post("/", createZoneHandler);

// /api/v1/workspaces/:workspaceId/zones/:zoneId
router.patch("/:zoneId", updateZoneHandler);
router.delete("/:zoneId", deleteZoneHandler);

export default router;
