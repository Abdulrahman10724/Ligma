import { ObjectId } from "mongodb";

import { getCollection } from "../config/db.config.js";

const COLLECTION_NAME = "eventLogs";

const getEventLogsCollection = () => getCollection(COLLECTION_NAME);

const EVENT_TYPES = Object.freeze({
  NODE_CREATED: "NODE_CREATED",
  NODE_UPDATED: "NODE_UPDATED",
  NODE_MOVED: "NODE_MOVED",
  NODE_RESIZED: "NODE_RESIZED",
  NODE_DELETED: "NODE_DELETED",
  NODE_LOCKED: "NODE_LOCKED",
  NODE_UNLOCKED: "NODE_UNLOCKED",
  NODE_PERMISSION_CHANGED: "NODE_PERMISSION_CHANGED",
  TASK_CREATED: "TASK_CREATED",
  TASK_UPDATED: "TASK_UPDATED",
  TASK_DELETED: "TASK_DELETED",
});

const VALID_EVENT_TYPES = Object.values(EVENT_TYPES);

let eventLogIndexesReady = false;
let eventLogIndexesPromise = null;

const ensureEventLogIndexes = async () => {
  if (eventLogIndexesReady) {
    return;
  }

  if (!eventLogIndexesPromise) {
    eventLogIndexesPromise = (async () => {
      const collection = getEventLogsCollection();
      await collection.createIndex({ workspaceId: 1, createdAt: -1 });
      await collection.createIndex({ workspaceId: 1, eventType: 1, createdAt: -1 });
      await collection.createIndex({ workspaceId: 1, nodeId: 1, createdAt: -1 });
      await collection.createIndex({ workspaceId: 1, taskId: 1, createdAt: -1 });
      eventLogIndexesReady = true;
    })().finally(() => {
      eventLogIndexesPromise = null;
    });
  }

  await eventLogIndexesPromise;
};

const sanitizeEventLog = (event) => {
  if (!event) return null;

  return {
    ...event,
    id: event._id ? event._id.toString() : event.id,
    workspaceId: event.workspaceId ? event.workspaceId.toString() : event.workspaceId,
    nodeId: event.nodeId ? event.nodeId.toString() : null,
    taskId: event.taskId ? event.taskId.toString() : null,
    userId: event.userId ? event.userId.toString() : event.userId,
  };
};

const insertEventLog = async (eventDocument) => {
  const result = await getEventLogsCollection().insertOne(eventDocument);
  return { ...eventDocument, _id: result.insertedId };
};

const listEventLogsByWorkspace = async (workspaceId, limit = 100) =>
  getEventLogsCollection()
    .find({ workspaceId: new ObjectId(workspaceId) })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

export {
  COLLECTION_NAME,
  EVENT_TYPES,
  VALID_EVENT_TYPES,
  ensureEventLogIndexes,
  sanitizeEventLog,
  insertEventLog,
  listEventLogsByWorkspace,
};

export default {
  COLLECTION_NAME,
  EVENT_TYPES,
  VALID_EVENT_TYPES,
  ensureEventLogIndexes,
  sanitizeEventLog,
  insertEventLog,
  listEventLogsByWorkspace,
};