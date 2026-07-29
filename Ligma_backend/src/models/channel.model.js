import { ObjectId } from "mongodb";
import { getCollection } from "../config/db.config.js";

const COLLECTION_NAME = "channels";

const DEFAULT_CHANNELS = ["general", "development", "design", "random", "announcements"];

const getChannelsCollection = () => getCollection(COLLECTION_NAME);

let channelIndexesReady = false;
let channelIndexesPromise = null;

const ensureChannelIndexes = async () => {
  if (channelIndexesReady) return;
  if (!channelIndexesPromise) {
    channelIndexesPromise = (async () => {
      const c = getChannelsCollection();
      await c.createIndex({ workspaceId: 1, name: 1 }, { unique: true });
      await c.createIndex({ workspaceId: 1, visibility: 1, createdAt: 1 });
      channelIndexesReady = true;
    })().finally(() => {
      channelIndexesPromise = null;
    });
  }
  await channelIndexesPromise;
};

const sanitizeChannel = (channel) => {
  if (!channel) return null;
  return {
    ...channel,
    id: channel._id ? channel._id.toString() : channel.id,
    workspaceId: channel.workspaceId ? channel.workspaceId.toString() : channel.workspaceId,
    createdBy: channel.createdBy ? channel.createdBy.toString() : channel.createdBy,
    createdAt: channel.createdAt ? new Date(channel.createdAt).toISOString() : null,
    updatedAt: channel.updatedAt ? new Date(channel.updatedAt).toISOString() : null,
  };
};

const findChannelsByWorkspace = async (workspaceId) =>
  getChannelsCollection()
    .find({ workspaceId: new ObjectId(workspaceId) })
    .sort({ createdAt: 1 })
    .toArray();

const findChannelById = async (channelId) =>
  getChannelsCollection().findOne({ _id: new ObjectId(channelId) });

const findChannelByWorkspaceAndName = async (workspaceId, name) =>
  getChannelsCollection().findOne({
    workspaceId: new ObjectId(workspaceId),
    name: name.toLowerCase(),
  });

const createChannel = async ({
  workspaceId,
  createdBy,
  name,
  description,
  visibility,
  isDefault,
}) => {
  const now = new Date();
  const doc = {
    workspaceId: new ObjectId(workspaceId),
    createdBy: new ObjectId(createdBy),
    name: name.toLowerCase(),
    displayName: name,
    description: String(description || "").slice(0, 300),
    visibility: visibility === "private" ? "private" : "public",
    isDefault: Boolean(isDefault),
    createdAt: now,
    updatedAt: now,
  };
  const res = await getChannelsCollection().insertOne(doc);
  return { ...doc, _id: res.insertedId };
};

const deleteChannel = async (channelId, workspaceId) =>
  getChannelsCollection().deleteOne({
    _id: new ObjectId(channelId),
    workspaceId: new ObjectId(workspaceId),
  });

// Seeds default channels (idempotent) for a new workspace
const seedDefaultChannels = async (workspaceId, ownerId) => {
  await ensureChannelIndexes();
  const existing = await findChannelsByWorkspace(workspaceId);
  const existingNames = new Set(existing.map((c) => c.name));
  for (const name of DEFAULT_CHANNELS) {
    if (existingNames.has(name)) continue;
    await createChannel({
      workspaceId,
      createdBy: ownerId,
      name,
      description: titleize(name) + " channel",
      visibility: name === "announcements" ? "private" : "public",
      isDefault: true,
    });
  }
};

const titleize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export {
  COLLECTION_NAME,
  DEFAULT_CHANNELS,
  ensureChannelIndexes,
  sanitizeChannel,
  findChannelsByWorkspace,
  findChannelById,
  findChannelByWorkspaceAndName,
  createChannel,
  deleteChannel,
  seedDefaultChannels,
};

export default {
  ensureChannelIndexes,
  sanitizeChannel,
  findChannelsByWorkspace,
  findChannelById,
  findChannelByWorkspaceAndName,
  createChannel,
  deleteChannel,
  seedDefaultChannels,
};
