import {
  ensureTaskIndexes,
  createTask,
  updateTask,
  deleteTask,
  findTasksByWorkspace,
  findTaskByNodeId,
  sanitizeTask,
  findTaskById,
} from "../models/task.model.js";
import { emitWorkspaceEvent } from "../socket/socket.service.js";
import { appendEvent, EVENT_TYPES } from "./event-log.service.js";
import logger from "../utils/logger.util.js";

const ensureIndexes = async () => {
  await ensureTaskIndexes();
};

const listTasks = async (workspaceId) => {
  await ensureIndexes();
  const tasks = await findTasksByWorkspace(workspaceId);
  return tasks.map(sanitizeTask);
};

const createTaskForNode = async (workspaceId, nodeId, data = {}, actorId = null) => {
  await ensureIndexes();
  const existing = nodeId ? await findTaskByNodeId(workspaceId, nodeId) : null;
  if (existing) {
    logger.info(`task.service: task already exists for node=${nodeId} task=${existing._id}`);
    return sanitizeTask(existing);
  }

  const doc = {
    workspaceId,
    nodeId,
    parentTaskId: data.parentTaskId || null,
    title: data.title || data.text || "Untitled",
    description: data.description || "",
    type: data.type || "Action",
    status: data.type === "Action" ? "To Do" : null,
    assigneeId: data.assigneeId || null,
    dueDate: data.dueDate || null,
    priority: data.priority || null,
    metadata: data.metadata || {},
  };

  const created = await createTask(doc);
  logger.info(`task.service: created task id=${created._id} for node=${nodeId}`);
  const sanitized = sanitizeTask(created);

  try {
    await appendEvent({
      workspaceId,
      userId: actorId || data.userId || created.assigneeId?.toString() || created.workspaceId?.toString(),
      eventType: EVENT_TYPES.TASK_CREATED,
      taskId: sanitized.id,
      nodeId: sanitized.nodeId || null,
      payload: {
        snapshot: {
          id: sanitized.id,
          nodeId: sanitized.nodeId || null,
          parentTaskId: sanitized.parentTaskId || null,
          title: sanitized.title,
          description: sanitized.description,
          type: sanitized.type,
          status: sanitized.status,
          assigneeId: sanitized.assigneeId || null,
          dueDate: sanitized.dueDate || null,
          priority: sanitized.priority || null,
          order: sanitized.order,
          metadata: sanitized.metadata || {},
        },
      },
      validateTask: false,
    });
  } catch (err) {
    logger.warn("event logging failed on task create", err?.message || err);
  }

  try {
    emitWorkspaceEvent(workspaceId, "tasks:created", sanitized);
  } catch (err) {
    logger.warn("emit tasks:created failed", err?.message || err);
  }
  return sanitized;
};

const updateTaskForNode = async (workspaceId, nodeId, data = {}, actorId = null) => {
  await ensureIndexes();
  const existing = await findTaskByNodeId(workspaceId, nodeId);
  if (!existing) return null;

  const fields = {};
  const allowed = ["title", "description", "status", "assigneeId", "dueDate", "priority", "order", "metadata", "type"];
  for (const k of allowed) {
    if (data[k] !== undefined) fields[k] = data[k];
  }

  const updated = await updateTask(existing._id.toString(), workspaceId, fields);
  const sanitized = sanitizeTask(updated);

  try {
    await appendEvent({
      workspaceId,
      userId: actorId || data.userId || sanitized.assigneeId || updated?.workspaceId?.toString(),
      eventType: EVENT_TYPES.TASK_UPDATED,
      taskId: sanitized.id,
      nodeId: sanitized.nodeId || null,
      payload: {
        previousFields: fields,
        nextFields: Object.keys(fields).reduce((acc, key) => ({ ...acc, [key]: sanitized[key] }), {}),
      },
    });
  } catch (err) {
    logger.warn("event logging failed on task update", err?.message || err);
  }

  try {
    emitWorkspaceEvent(workspaceId, "tasks:updated", sanitized);
  } catch (err) {
    logger.warn("emit tasks:updated failed", err?.message || err);
  }
  return sanitized;
};

const removeTaskForNode = async (workspaceId, nodeId, actorId = null) => {
  await ensureIndexes();
  const existing = await findTaskByNodeId(workspaceId, nodeId);
  if (!existing) return;
  if (existing.workspaceId?.toString() !== workspaceId) {
    const err = new Error("Task not found in this workspace");
    err.statusCode = 404;
    throw err;
  }

  await deleteTask(existing._id.toString(), workspaceId);
  logger.info(`task.service: removed task ${existing._id} for node=${nodeId}`);

  try {
    await appendEvent({
      workspaceId,
      userId: actorId || existing.assigneeId?.toString() || existing.workspaceId?.toString(),
      eventType: EVENT_TYPES.TASK_DELETED,
      taskId,
      nodeId: existing.nodeId ? existing.nodeId.toString() : null,
      payload: {
        snapshot: sanitizeTask(existing),
      },
      validateTask: false,
    });
  } catch (err) {
    logger.warn("event logging failed on task delete", err?.message || err);
  }

  await deleteTask(taskId, workspaceId);
  logger.info(`task.service: removed task ${taskId} (nodeId=${existing.nodeId || "null"})`);


  // cascade-delete subtasks
  try {
    const col = await (await import("../config/db.config.js")).getCollection("tasks");
    const { ObjectId } = await import("mongodb");
    const res = await col.deleteMany({ workspaceId: new ObjectId(workspaceId), parentTaskId: new ObjectId(existing._id) });
    if (res.deletedCount > 0) logger.info(`task.service: also removed ${res.deletedCount} subtasks for parent=${existing._id}`);
  } catch (err) {
    logger.warn("task.service: failed to cascade-delete subtasks", err?.message || err);
  }

  try {
    emitWorkspaceEvent(workspaceId, "tasks:deleted", { id: existing._id.toString(), nodeId });
  } catch (err) {
    logger.warn("emit tasks:deleted failed", err?.message || err);
  }
};

/**
 * Delete a task directly by its taskId (not by nodeId).
 * This correctly handles manually-created tasks that have nodeId=null,
 * which would silently fail with removeTaskForNode.
 */
const removeTaskById = async (workspaceId, taskId, actorId = null) => {
  await ensureIndexes();
  const existing = await findTaskById(taskId);
  if (!existing) return;

  // Verify task belongs to this workspace
  if (existing.workspaceId?.toString() !== workspaceId) {
    const err = new Error("Task not found in this workspace");
    err.statusCode = 404;
    throw err;
  }

  await deleteTask(taskId, workspaceId);
  logger.info(`task.service: removed task ${taskId} (nodeId=${existing.nodeId || "null"})`);

  try {
    await appendEvent({
      workspaceId,
      userId: actorId || existing.assigneeId?.toString() || existing.workspaceId?.toString(),
      eventType: EVENT_TYPES.TASK_DELETED,
      taskId,
      nodeId: existing.nodeId ? existing.nodeId.toString() : null,
      payload: {
        snapshot: sanitizeTask(existing),
      },
      validateTask: false,
    });
  } catch (err) {
    logger.warn("event logging failed on task delete", err?.message || err);
  }

  // cascade-delete subtasks
  try {
    const col = await (await import("../config/db.config.js")).getCollection("tasks");
    const { ObjectId } = await import("mongodb");
    const res = await col.deleteMany({ workspaceId: new ObjectId(workspaceId), parentTaskId: new ObjectId(existing._id) });
    if (res.deletedCount > 0) logger.info(`task.service: cascade-deleted ${res.deletedCount} subtasks for parent=${taskId}`);
  } catch (err) {
    logger.warn("task.service: failed to cascade-delete subtasks", err?.message || err);
  }

  try {
    emitWorkspaceEvent(workspaceId, "tasks:deleted", { id: taskId, nodeId: existing.nodeId || null });
  } catch (err) {
    logger.warn("emit tasks:deleted failed", err?.message || err);
  }
};

const getTaskById = async (taskId) => {
  const t = await findTaskById(taskId);
  return sanitizeTask(t);
};

export { ensureIndexes, listTasks, createTaskForNode, updateTaskForNode, removeTaskForNode, removeTaskById, getTaskById };

export default { ensureIndexes, listTasks, createTaskForNode, updateTaskForNode, removeTaskForNode, removeTaskById, getTaskById };
