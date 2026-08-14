import { ObjectId } from "mongodb";
import { getCollection } from "../config/db.config.js";

const COLLECTION_NAME = "zones";

const getZonesCollection = () => getCollection(COLLECTION_NAME);

const ensureZoneIndexes = async () => {
  const collection = getZonesCollection();
  await collection.createIndex({ workspaceId: 1, createdAt: 1 });
  await collection.createIndex({ workspaceId: 1, updatedAt: -1 });
};

const sanitizeZone = (zone) => {
  if (!zone) return null;
  return {
    ...zone,
    id: zone._id ? zone._id.toString() : zone.id,
    workspaceId: zone.workspaceId ? zone.workspaceId.toString() : zone.workspaceId,
    createdBy: zone.createdBy ? zone.createdBy.toString() : zone.createdBy,
    createdAt: zone.createdAt ? new Date(zone.createdAt).toISOString() : null,
    updatedAt: zone.updatedAt ? new Date(zone.updatedAt).toISOString() : null,
  };
};

const findZonesByWorkspace = async (workspaceId) =>
  getZonesCollection()
    .find({ workspaceId: new ObjectId(workspaceId) })
    .sort({ createdAt: 1 })
    .toArray();

const findZoneById = async (zoneId) =>
  getZonesCollection().findOne({ _id: new ObjectId(zoneId) });

const createZone = async ({
  workspaceId,
  createdBy,
  name,
  description,
  color,
  x,
  y,
  width,
  height,
  collapsed,   // 👈 add karo
}) => {
  const now = new Date();
  const doc = {
    workspaceId: new ObjectId(workspaceId),
    createdBy: new ObjectId(createdBy),
    name: String(name || "Untitled zone").trim().slice(0, 80),
    description: String(description || "").slice(0, 400),
    color: String(color || "#6366F1"),
    x: Number(x) || 0,
    y: Number(y) || 0,
    width: Math.max(160, Number(width) || 400),
    height: Math.max(100, Number(height) || 280),
    collapsed: Boolean(collapsed),  
    createdAt: now,
    updatedAt: now,
  };
  const res = await getZonesCollection().insertOne(doc);
  return { ...doc, _id: res.insertedId };
};

const updateZone = async (zoneId, workspaceId, fields) => {
  const set = { updatedAt: new Date() };
  const allowed = ["name", "description", "color", "x", "y", "width", "height", "collapsed"];  
  for (const k of allowed) {
    if (fields[k] !== undefined) set[k] = fields[k];
  }
  if (typeof set.width === "number") set.width = Math.max(160, set.width);
  if (typeof set.height === "number") set.height = Math.max(100, set.height);
  return getZonesCollection().findOneAndUpdate(
    { _id: new ObjectId(zoneId), workspaceId: new ObjectId(workspaceId) },
    { $set: set },
    { returnDocument: "after", includeResultMetadata: false }
  );
};

const deleteZone = async (zoneId, workspaceId) =>
  getZonesCollection().deleteOne({
    _id: new ObjectId(zoneId),
    workspaceId: new ObjectId(workspaceId),
  });

export {
  COLLECTION_NAME,
  ensureZoneIndexes,
  sanitizeZone,
  findZonesByWorkspace,
  findZoneById,
  createZone,
  updateZone,
  deleteZone,
};

export default {
  ensureZoneIndexes,
  sanitizeZone,
  findZonesByWorkspace,
  findZoneById,
  createZone,
  updateZone,
  deleteZone,
};
