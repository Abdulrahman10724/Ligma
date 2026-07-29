import { ObjectId } from "mongodb";
import { getCollection } from "../config/db.config.js";

const COLLECTION_NAME = "messages";

const getMessagesCollection = () => getCollection(COLLECTION_NAME);

let messageIndexesReady = false;
let messageIndexesPromise = null;

const ensureMessageIndexes = async () => {
  if (messageIndexesReady) return;
  if (!messageIndexesPromise) {
    messageIndexesPromise = (async () => {
      const m = getMessagesCollection();
      await m.createIndex({ channelId: 1, createdAt: 1 });
      await m.createIndex({ workspaceId: 1, createdAt: -1 });
      await m.createIndex({ channelId: 1, senderId: 1, createdAt: -1 });
      messageIndexesReady = true;
    })().finally(() => {
      messageIndexesPromise = null;
    });
  }
  await messageIndexesPromise;
};

const sanitizeMessage = (message) => {
  if (!message) return null;
  return {
    ...message,
    id: message._id ? message._id.toString() : message.id,
    workspaceId: message.workspaceId ? message.workspaceId.toString() : message.workspaceId,
    channelId: message.channelId ? message.channelId.toString() : message.channelId,
    senderId: message.senderId ? message.senderId.toString() : message.senderId,
    parentMessageId: message.parentMessageId ? message.parentMessageId.toString() : null,
    nodeRefs: Array.isArray(message.nodeRefs) ? message.nodeRefs : [],
    mentions: Array.isArray(message.mentions) ? message.mentions : [],
    createdAt: message.createdAt ? new Date(message.createdAt).toISOString() : null,
    updatedAt: message.updatedAt ? new Date(message.updatedAt).toISOString() : null,
    editedAt: message.editedAt ? new Date(message.editedAt).toISOString() : null,
  };
};

const findMessagesByChannel = async (channelId, { limit = 80, before } = {}) => {
  const query = { channelId: new ObjectId(channelId) };
  if (before) query.createdAt = { $lt: new Date(before) };
  return getMessagesCollection()
    .find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
};

const findMessageById = async (messageId) =>
  getMessagesCollection().findOne({ _id: new ObjectId(messageId) });

const createMessage = async ({
  workspaceId,
  channelId,
  senderId,
  senderName,          
  senderAvatarUrl,    
  content,
  mentions = [],
  nodeRefs = [],
  parentMessageId = null,
}) => {
  const now = new Date();
  const doc = {
    workspaceId: new ObjectId(workspaceId),
    channelId: new ObjectId(channelId),
    senderId: new ObjectId(senderId),
    senderName,                         
    senderAvatarUrl: senderAvatarUrl || null,  
    content: String(content || "").slice(0, 4000),
    mentions: mentions.map((m) => String(m)).filter(Boolean),
    nodeRefs: Array.isArray(nodeRefs) ? nodeRefs.slice(0, 16) : [],
    parentMessageId: parentMessageId ? new ObjectId(parentMessageId) : null,
    edited: false,
    editedAt: null,
    deleted: false,
    createdAt: now,
    updatedAt: now,
  };
  const res = await getMessagesCollection().insertOne(doc);
  return { ...doc, _id: res.insertedId };
};

const updateMessageContent = async (messageId, workspaceId, content) =>
  getMessagesCollection().findOneAndUpdate(
    { _id: new ObjectId(messageId), workspaceId: new ObjectId(workspaceId) },
    {
      $set: {
        content: String(content || "").slice(0, 4000),
        edited: true,
        editedAt: new Date(),
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" }
  );

const softDeleteMessage = async (messageId, workspaceId) =>
  getMessagesCollection().findOneAndUpdate(
    { _id: new ObjectId(messageId), workspaceId: new ObjectId(workspaceId) },
    {
      $set: {
        deleted: true,
        content: "",
        mentions: [],
        nodeRefs: [],
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" }
  );

const deleteMessagesByChannel = async (channelId, workspaceId) =>
  getMessagesCollection().deleteMany({
    channelId: new ObjectId(channelId),
    workspaceId: new ObjectId(workspaceId),
  });

export {
  COLLECTION_NAME,
  ensureMessageIndexes,
  sanitizeMessage,
  findMessagesByChannel,
  findMessageById,
  createMessage,
  updateMessageContent,
  softDeleteMessage,
  deleteMessagesByChannel,
};

export default {
  ensureMessageIndexes,
  sanitizeMessage,
  findMessagesByChannel,
  findMessageById,
  createMessage,
  updateMessageContent,
  softDeleteMessage,
  deleteMessagesByChannel,
};
