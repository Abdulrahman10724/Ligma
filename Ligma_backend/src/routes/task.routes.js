import express from "express";
import * as taskController from "../controllers/task.controller.js";

const router = express.Router({ mergeParams: true });

// /api/workspaces/:workspaceId/tasks
router.get("/", taskController.listTasks);
router.post("/", taskController.createTask);
router.put("/:taskId", taskController.updateTask);
router.patch("/:taskId/status", taskController.updateStatus);
router.delete("/:taskId", taskController.deleteTask);

export default router;
