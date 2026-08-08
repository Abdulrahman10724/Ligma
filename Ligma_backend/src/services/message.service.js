import {
  ensureMessageIndexes,
  sanitizeMessage,
  findMessagesByChannel,
  findMessageById,
  createMessage as createMessageModel,
  updateMessageContent as updateMessageModel,
  softDeleteMessage as softDeleteModel,
  deleteMessagesByChannel,
} from "../models/message.model.js";
import { findChannelById, sanitizeChannel } from "../models/channel.model.js";
import {
  assertWorkspaceAccess,
  assertWorkspaceEditAccess,
} from "./member.service.js";
import { findWorkspaceById } from "../models/workspace.model.js";
import { emitWorkspaceEvent } from "../socket/socket.service.js";
import { assertChannelVisible } from "./channel.service.js";

const ensureIndexes = async () => {
  await ensureMessageIndexes();
};

const verifyChannelAccess = async (workspaceId, channelId, userId) => {
  const channel = await findChannelById(channelId);
  if (!channel || channel.workspaceId?.toString() !== workspaceId) {
    const err = new Error("Channel not found");
    err.statusCode = 404;
    throw err;
  }
  await assertWorkspaceAccess(workspaceId, userId);
  await assertChannelVisible(channel, workspaceId, userId);
  return sanitizeChannel(channel);
};

const listMessages = async (workspaceId, channelId, userId, { limit, before } = {}) => {
  await ensureIndexes();
  await verifyChannelAccess(workspaceId, channelId, userId);
  const raw = await findMessagesByChannel(channelId, { limit, before });
  return raw.map(sanitizeMessage).reverse();
};

const createMessage = async (workspaceId, channelId,actor, data) => {
  await ensureIndexes();
  const channel = await verifyChannelAccess(workspaceId, channelId, actor.id);
  await assertWorkspaceEditAccess(workspaceId, actor.id);
  const content = String(data.content || "").slice(0, 4000);
  if (!content.trim()) {
    const err = new Error("Message cannot be empty");
    err.statusCode = 400;
    throw err;
  }
  if (content.length > 4000) {
    const err = new Error("Message is too long");
    err.statusCode = 400;
    throw err;
  }
  const created = await createMessageModel({
    workspaceId,
    channelId,
    senderId: actor.id,
    senderName: actor.name,
    senderAvatarUrl: actor.avatarUrl || null,
    content,
    mentions: Array.isArray(data.mentions) ? data.mentions.slice(0, 32) : [],
    nodeRefs: Array.isArray(data.nodeRefs) ? data.nodeRefs.slice(0, 16) : [],
    parentMessageId: data.parentMessageId || null,
  });
  const sanitized = sanitizeMessage(created);
  try {
    emitWorkspaceEvent(workspaceId, "chat:message", {
      channelId: channel.id,
      message: sanitized,
    });
  } catch { /* ignored */ }
  return sanitized;
};

const updateMessage = async (workspaceId, channelId, messageId, userId, data) => {
  await ensureIndexes();
  await verifyChannelAccess(workspaceId, channelId, userId);

  const existing = await findMessageById(messageId);
  if (!existing || existing.workspaceId?.toString() !== workspaceId) {
    const err = new Error("Message not found");
    err.statusCode = 404;
    throw err;
  }
  if (existing.channelId?.toString() !== channelId) {
    const err = new Error("Message does not belong to this channel");
    err.statusCode = 400;
    throw err;
  }
  if (existing.senderId?.toString() !== userId) {
    const err = new Error("Only the message author can edit this message");
    err.statusCode = 403;
    throw err;
  }
  await assertWorkspaceEditAccess(workspaceId, userId);
  const updated = await updateMessageModel(messageId, workspaceId, data.content);
  const sanitized = sanitizeMessage(updated);
  try {
    emitWorkspaceEvent(workspaceId, "chat:message-updated", {
      channelId,
      message: sanitized,
    });
  } catch { /* ignored */ }
  return sanitized;
};

const deleteMessage = async (workspaceId, channelId, messageId, userId) => {
  await ensureIndexes();
  await verifyChannelAccess(workspaceId, channelId, userId);
  const existing = await findMessageById(messageId);
  if (!existing || existing.workspaceId?.toString() !== workspaceId) {
    const err = new Error("Message not found");
    err.statusCode = 404;
    throw err;
  }
  if (existing.channelId?.toString() !== channelId) {
    const err = new Error("Message does not belong to this channel");
    err.statusCode = 400;
    throw err;
  }
  const workspace = await findWorkspaceById(workspaceId);
  const isOwner = workspace?.ownerId?.toString() === userId;
  if (existing.senderId?.toString() !== userId && !isOwner) {
    const err = new Error("Only the author or workspace owner can delete this message");
    err.statusCode = 403;
    throw err;
  }
  await softDeleteModel(messageId, workspaceId);
  const sanitized = sanitizeMessage({ ...existing, deleted: true, content: "" });
  try {
    emitWorkspaceEvent(workspaceId, "chat:message-deleted", {
      channelId,
      messageId,
      workspaceId,
    });
  } catch { /* ignored */ }
  return sanitized;
};

export {
  ensureIndexes,
  verifyChannelAccess,
  listMessages,
  createMessage,
  updateMessage,
  deleteMessage,
};

export default {
  ensureIndexes,
  verifyChannelAccess,
  listMessages,
  createMessage,
  updateMessage,
  deleteMessage,
};
