import {
  ensureZoneIndexes,
  findZonesByWorkspace,
  findZoneById,
  createZone as createZoneModel,
  updateZone as updateZoneModel,
  deleteZone as deleteZoneModel,
  sanitizeZone,
} from "../models/zone.model.js";
import { assertWorkspaceAccess, assertWorkspaceEditAccess } from "./member.service.js";
import { emitWorkspaceEvent } from "../socket/socket.service.js";
import { invalidateZoneCache } from "./zone-presence.service.js";

const ensureIndexes = async () => {
  await ensureZoneIndexes();
};

const HEX_COLOR = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/;

const validateColor = (color) => {
  if (!color) return "#6366F1";
  if (typeof color !== "string") {
    const err = new Error("Color must be a string");
    err.statusCode = 400;
    throw err;
  }
  if (!HEX_COLOR.test(color)) {
    const err = new Error("Color must be a valid hex color");
    err.statusCode = 400;
    throw err;
  }
  return color;
};

const listZones = async (workspaceId, actorId) => {
  await ensureIndexes();
  await assertWorkspaceAccess(workspaceId, actorId);
  const docs = await findZonesByWorkspace(workspaceId);
  return docs.map(sanitizeZone);
};

const createZone = async (workspaceId, actorId, data) => {
  await ensureIndexes();
  await assertWorkspaceEditAccess(workspaceId, actorId);
  const name = String(data.name || "").trim();
  if (name.length < 1 || name.length > 80) {
    const err = new Error("Zone name must be between 1 and 80 characters");
    err.statusCode = 400;
    throw err;
  }
  invalidateZoneCache(workspaceId);
  const created = await createZoneModel({
    workspaceId,
    createdBy: actorId,
    name,
    description: String(data.description || "").slice(0, 400),
    color: validateColor(data.color),
    x: Number.isFinite(data.x) ? Math.round(data.x) : 0,
    y: Number.isFinite(data.y) ? Math.round(data.y) : 0,
    width: Number.isFinite(data.width) ? Number(data.width) : 400,
    height: Number.isFinite(data.height) ? Number(data.height) : 280,
  });
  const sanitized = sanitizeZone(created);
  try {
    emitWorkspaceEvent(workspaceId, "zone:created", { zone: sanitized });
  } catch {
    /* socket may be offline */
  }
  return sanitized;
};

const updateZone = async (workspaceId, zoneId, actorId, data) => {
  await ensureIndexes();
  await assertWorkspaceEditAccess(workspaceId, actorId);
  const existing = await findZoneById(zoneId);
  if (!existing || existing.workspaceId?.toString() !== workspaceId) {
    const err = new Error("Zone not found");
    err.statusCode = 404;
    throw err;
  }
  const fields = {};
  if (data.name !== undefined) {
    const name = String(data.name).trim();
    if (name.length < 1 || name.length > 80) {
      const err = new Error("Zone name must be between 1 and 80 characters");
      err.statusCode = 400;
      throw err;
    }
    fields.name = name;
  }
  if (data.description !== undefined) {
    fields.description = String(data.description).slice(0, 400);
  }
  if (data.color !== undefined) {
    fields.color = validateColor(data.color);
  }
  if (data.x !== undefined) fields.x = Math.round(Number(data.x));
  if (data.y !== undefined) fields.y = Math.round(Number(data.y));
  if (data.width !== undefined) fields.width = Number(data.width);
  if (data.height !== undefined) fields.height = Number(data.height);
  if (data.collapsed !== undefined) fields.collapsed = Boolean(data.collapsed);   

  invalidateZoneCache(workspaceId);
  const updated = await updateZoneModel(zoneId, workspaceId, fields);
  const sanitized = sanitizeZone(updated);
  try {
    emitWorkspaceEvent(workspaceId, "zone:updated", { zone: sanitized });
  } catch {
    /* ignored */
  }
  return sanitized;
};

const deleteZone = async (workspaceId, zoneId, actorId) => {
  await ensureIndexes();
  await assertWorkspaceEditAccess(workspaceId, actorId);
  const existing = await findZoneById(zoneId);
  if (!existing || existing.workspaceId?.toString() !== workspaceId) {
    const err = new Error("Zone not found");
    err.statusCode = 404;
    throw err;
  }
  invalidateZoneCache(workspaceId);
  await deleteZoneModel(zoneId, workspaceId);
  try {
    emitWorkspaceEvent(workspaceId, "zone:deleted", { zoneId, workspaceId });
  } catch {
    /* ignored */
  }
};

export { ensureIndexes, validateColor, listZones, createZone, updateZone, deleteZone };

export default {
  ensureIndexes,
  validateColor,
  listZones,
  createZone,
  updateZone,
  deleteZone,
};
