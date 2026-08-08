import {
  ensureChannelIndexes,
  sanitizeChannel,
  findChannelsByWorkspace,
  findChannelById,
  findChannelByWorkspaceAndName,
  createChannel as createChannelModel,
  deleteChannel as deleteChannelModel,
  seedDefaultChannels,
} from "../models/channel.model.js";
import { assertWorkspaceAccess, assertWorkspaceEditAccess,getWorkspaceRole } from "./member.service.js";
import { emitWorkspaceEvent } from "../socket/socket.service.js";
const ensureIndexes = async () => {
  await ensureChannelIndexes();
};
const assertChannelVisible = async (channel, workspaceId, userId) => {
  if (channel.visibility !== "private") return;
  const role = await getWorkspaceRole(workspaceId, userId);
  const isCreator = channel.createdBy?.toString() === userId;
  if (role !== "Lead" && !isCreator) {
    const err = new Error("This channel is private");
    err.statusCode = 403;
    throw err;
  }
};

const listChannels = async (workspaceId, actorId) => {
  await ensureIndexes();
  await assertWorkspaceAccess(workspaceId, actorId);
  const channels = await findChannelsByWorkspace(workspaceId);
  const role = await getWorkspaceRole(workspaceId, actorId);
  const visible = channels.filter((c) => {
    if (c.visibility !== "private") return true;
    const isCreator = c.createdBy?.toString() === actorId;
    return role === "Lead" || isCreator;
  });
  return visible.map(sanitizeChannel);
};

const createChannel = async (workspaceId, actorId, data) => {
  await ensureIndexes();
  await assertWorkspaceEditAccess(workspaceId, actorId);
  const rawName = String(data.name || "").trim().toLowerCase();
  if (!rawName) {
    const err = new Error("Channel name is required");
    err.statusCode = 400;
    throw err;
  }
  if (rawName.length < 1 || rawName.length > 40) {
    const err = new Error("Channel name must be between 1 and 40 characters");
    err.statusCode = 400;
    throw err;
  }
  if (!/^[a-z0-9-_ ]+$/.test(rawName)) {
    const err = new Error("Channel name can only contain lowercase letters, numbers, dashes, underscores, and spaces");
    err.statusCode = 400;
    throw err;
  }
  const existing = await findChannelByWorkspaceAndName(workspaceId, rawName);
  if (existing) {
    const err = new Error("A channel with that name already exists");
    err.statusCode = 409;
    throw err;
  }
  const created = await createChannelModel({
    workspaceId,
    createdBy: actorId,
    name: rawName,
    description: String(data.description || "").slice(0, 300),
    visibility: data.visibility === "private" ? "private" : "public",
    isDefault: false,
  });
  const sanitized = sanitizeChannel(created);
  try {
    emitWorkspaceEvent(workspaceId, "chat:channel-created", { channel: sanitized });
  } catch { /* socket may be offline */ }
  return sanitized;
};

const deleteChannel = async (workspaceId, channelId, actorId) => {
  await ensureIndexes();
  await assertWorkspaceEditAccess(workspaceId, actorId);
  const existing = await findChannelById(channelId);
  if (!existing || existing.workspaceId?.toString() !== workspaceId) {
    const err = new Error("Channel not found");
    err.statusCode = 404;
    throw err;
  }
  if (existing.isDefault) {
    const err = new Error("Default channels cannot be deleted");
    err.statusCode = 403;
    throw err;
  }
  await deleteChannelModel(channelId, workspaceId);
  try {
    emitWorkspaceEvent(workspaceId, "chat:channel-deleted", { channelId, workspaceId });
  } catch { /* ignored */ }
};

const seedChannelsForWorkspace = async (workspaceId, ownerId) => {
  await ensureIndexes();
  await seedDefaultChannels(workspaceId, ownerId);
};

export {
  ensureIndexes,
  listChannels,
  createChannel,
  deleteChannel,
  seedChannelsForWorkspace,
  assertChannelVisible,
};

export default {
  ensureIndexes,
  listChannels,
  createChannel,
  deleteChannel,
  seedChannelsForWorkspace,
  assertChannelVisible,
};
