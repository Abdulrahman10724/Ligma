import express from "express";
import * as taskController from "../controllers/task.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { idParamsSchema } from "../validation/task.validation.js";

const router = express.Router({ mergeParams: true });

router.use(authMiddleware);

router.get("/", validate(idParamsSchema), taskController.listTasks);
router.post("/", validate(idParamsSchema), taskController.createTask);
router.put("/:taskId", validate(idParamsSchema), taskController.updateTask);
router.patch("/:taskId/status", validate(idParamsSchema), taskController.updateStatus);
router.delete("/:taskId", validate(idParamsSchema), taskController.deleteTask);

export default router;