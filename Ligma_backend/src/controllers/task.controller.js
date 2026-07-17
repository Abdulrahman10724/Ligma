import { sendSuccess, sendError } from "../utils/api-response.util.js";
import * as taskService from "../services/task.service.js";
import { createTaskSchema, updateTaskSchema, statusSchema } from "../validation/task.validation.js";

const listTasks = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const tasks = await taskService.listTasks(workspaceId);
    return sendSuccess(res, 200, "Tasks fetched", tasks);
  } catch (err) {
    return sendError(res, err.statusCode || 500, err.message || "Server error");
  }
};

const createTask = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const parsed = createTaskSchema.parse(req.body);
    const created = await taskService.createTaskForNode(workspaceId, parsed.nodeId || null, parsed, req.user.id);
    return sendSuccess(res, 201, "Task created", created);
  } catch (err) {
    return sendError(res, err.statusCode || 400, err.message || "Invalid request", err?.errors || null);
  }
};

const updateTask = async (req, res) => {
  try {
    const { workspaceId, taskId } = req.params;
    const parsed = updateTaskSchema.parse(req.body);
    const existing = await taskService.getTaskById(taskId);
    if (!existing) {
      const error = new Error("Task not found");
      error.statusCode = 404;
      throw error;
    }
    const updated = await taskService.updateTaskForNode(workspaceId, existing.nodeId || null, parsed, req.user.id);
    return sendSuccess(res, 200, "Task updated", updated);
  } catch (err) {
    return sendError(res, err.statusCode || 400, err.message || "Invalid request", err?.errors || null);
  }
};

const updateStatus = async (req, res) => {
  try {
    const { workspaceId, taskId } = req.params;
    const { status } = statusSchema.parse(req.body);
    const existing = await taskService.getTaskById(taskId);
    if (!existing) {
      const error = new Error("Task not found");
      error.statusCode = 404;
      throw error;
    }
    const updated = await taskService.updateTaskForNode(workspaceId, existing.nodeId || null, { status }, req.user.id);
    return sendSuccess(res, 200, "Status updated", updated);
  } catch (err) {
    return sendError(res, err.statusCode || 400, err.message || "Invalid request", err?.errors || null);
  }
};

const deleteTask = async (req, res) => {
  try {
    const { workspaceId, taskId } = req.params;
    // Use removeTaskById so manual tasks (nodeId=null) are permanently deleted.
    // removeTaskForNode(nodeId) silently skips tasks where nodeId is null.
    await taskService.removeTaskById(workspaceId, taskId, req.user.id);
    return sendSuccess(res, 200, "Task deleted");
  } catch (err) {
    return sendError(res, err.statusCode || 400, err.message || "Invalid request", err?.errors || null);
  }
};

export { listTasks, createTask, updateTask, updateStatus, deleteTask };

export default { listTasks, createTask, updateTask, updateStatus, deleteTask };
