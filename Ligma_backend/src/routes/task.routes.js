import express from "express";
import * as taskController from "../controllers/task.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router({ mergeParams: true });

router.use(authMiddleware);

// /api/workspaces/:workspaceId/tasks
router.get("/", taskController.listTasks);
router.post("/", taskController.createTask);
router.put("/:taskId", taskController.updateTask);
router.patch("/:taskId/status", taskController.updateStatus);
router.delete("/:taskId", taskController.deleteTask);

export default router;
