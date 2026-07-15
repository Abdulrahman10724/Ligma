import { ObjectId } from "mongodb";
import { getCollection } from "../config/db.config.js";

const COLLECTION_NAME = "tasks";

const getTasksCollection = () => getCollection(COLLECTION_NAME);

const ensureTaskIndexes = async () => {
  await getTasksCollection().createIndex({ workspaceId: 1 });
  await getTasksCollection().createIndex({ nodeId: 1 });
  await getTasksCollection().createIndex({ parentTaskId: 1 });
  await getTasksCollection().createIndex({ assigneeId: 1 });
  await getTasksCollection().createIndex({ status: 1 });
  await getTasksCollection().createIndex({ priority: 1 });
  await getTasksCollection().createIndex({ createdAt: -1 });
};

const sanitizeTask = (task) => {
  if (!task) return null;
  return {
    ...task,
    id: task._id ? task._id.toString() : task.id,
    workspaceId: task.workspaceId ? task.workspaceId.toString() : task.workspaceId,
    nodeId: task.nodeId ? task.nodeId.toString() : task.nodeId,
    parentTaskId: task.parentTaskId ? task.parentTaskId.toString() : task.parentTaskId,
    assigneeId: task.assigneeId ? task.assigneeId.toString() : task.assigneeId,
  };
};

const createTask = async (doc) => {
  const now = new Date();
  const task = {
    workspaceId: new ObjectId(doc.workspaceId),
    nodeId: doc.nodeId ? new ObjectId(doc.nodeId) : null,
    parentTaskId: doc.parentTaskId ? new ObjectId(doc.parentTaskId) : null,
    title: doc.title || "",
    description: doc.description || "",
    type: doc.type || "Action", // Action, Decision, Information, Reference
    status: doc.status || (doc.type === "Action" ? "To Do" : null),
    assigneeId: doc.assigneeId ? new ObjectId(doc.assigneeId) : null,
    dueDate: doc.dueDate ? new Date(doc.dueDate) : null,
    priority: doc.priority || null,
    order: typeof doc.order === "number" ? doc.order : 0,
    metadata: doc.metadata || {},
    createdAt: now,
    updatedAt: now,
  };

  const result = await getTasksCollection().insertOne(task);
  return { ...task, _id: result.insertedId };
};

const updateTask = async (taskId, workspaceId, updateFields) => {
  const now = new Date();
  const set = { ...updateFields, updatedAt: now };
  if (set.dueDate) set.dueDate = new Date(set.dueDate);

  const result = await getTasksCollection().findOneAndUpdate(
    { _id: new ObjectId(taskId), workspaceId: new ObjectId(workspaceId) },
    { $set: set },
    { returnDocument: "after" }
  );
  return result.value;
};

const deleteTask = async (taskId, workspaceId) =>
  getTasksCollection().deleteOne({ _id: new ObjectId(taskId), workspaceId: new ObjectId(workspaceId) });

const findTasksByWorkspace = async (workspaceId) =>
  getTasksCollection()
    .find({ workspaceId: new ObjectId(workspaceId) })
    .sort({ order: 1, priority: -1, createdAt: 1 })
    .toArray();

const findTaskByNodeId = async (workspaceId, nodeId) =>
  getTasksCollection().findOne({ workspaceId: new ObjectId(workspaceId), nodeId: new ObjectId(nodeId) });

const findTaskById = async (taskId) => getTasksCollection().findOne({ _id: new ObjectId(taskId) });

export {
  COLLECTION_NAME,
  ensureTaskIndexes,
  sanitizeTask,
  createTask,
  updateTask,
  deleteTask,
  findTasksByWorkspace,
  findTaskByNodeId,
  findTaskById,
};

export default {
  ensureTaskIndexes,
  sanitizeTask,
  createTask,
  updateTask,
  deleteTask,
  findTasksByWorkspace,
  findTaskByNodeId,
  findTaskById,
};




const STATUS = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
};

const PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
};


