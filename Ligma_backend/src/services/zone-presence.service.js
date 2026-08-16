// Phase 14 — In-memory map for zone → users presence.
//
// Each user has a "current zone id" while their cursor sits inside it. We
// expose only the mutation API required by sockets; the model and REST layer
// are the source of truth. This file is intentionally minimal.

import { findZonesByWorkspace, sanitizeZone } from "../models/zone.model.js";

const zonesCache = new Map(); // workspaceId -> { zones: [{...}], ts: timestamp }
const CACHE_TTL_MS = 4000;

// Ligma_backend/src/services/zone-presence.service.js
// (add near top, after CACHE_TTL_MS)

const MAX_CACHE_ENTRIES = 500;

const getCachedZones = async (workspaceId) => {
  const cached = zonesCache.get(workspaceId);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.zones;
  }
  const raw = await findZonesByWorkspace(workspaceId);
  const zones = raw.map(sanitizeZone);
  zonesCache.set(workspaceId, { zones, ts: Date.now() });

  // Cheap unbounded-growth guard: if too many distinct workspaces have been
  // cached, drop the oldest entries rather than let the Map grow forever.
  if (zonesCache.size > MAX_CACHE_ENTRIES) {
    const entries = [...zonesCache.entries()].sort((a, b) => a[1].ts - b[1].ts);
    const toRemove = entries.slice(0, zonesCache.size - MAX_CACHE_ENTRIES);
    for (const [key] of toRemove) zonesCache.delete(key);
  }

  return zones;
};
// workspaceId → Map<zoneId, Map<userId, userInfo>>
const zonePresence = new Map();

// workspaceId → userId → zoneId (their current zone)
const userCurrentZone = new Map();

const findZoneAtPoint = async (workspaceId, { x, y }) => {
  if (!workspaceId || typeof x !== "number" || typeof y !== "number") return null;
  const zones = await getCachedZones(workspaceId);
  // Zones are exclusive; last-created wins on overlap (newer zones float on top).
  let hit = null;
  for (const zone of zones) {
    if (
      x >= zone.x &&
      x <= zone.x + zone.width &&
      y >= zone.y &&
      y <= zone.y + zone.height
    ) {
      hit = zone.id;
    }
  }
  return hit;
};

const invalidateZoneCache = (workspaceId) => {
  zonesCache.delete(workspaceId);
};

const updateUserZonePresence = (io, { workspaceId, user, zoneId }) => {
  if (!workspaceId || !user) return;

  if (!userCurrentZone.has(workspaceId)) {
    userCurrentZone.set(workspaceId, new Map());
  }

  const previousZoneId = userCurrentZone.get(workspaceId).get(user.id) || null;
  if (previousZoneId === zoneId) {
    // Still in the same zone — just refresh its user record.
    if (zoneId && zonePresence.has(workspaceId)) {
      const byZone = zonePresence.get(workspaceId);
      const z = byZone.get(zoneId);
      if (z) {
        z.set(user.id, {
          userId: user.id,
          name: user.name,
          avatarUrl: user.avatarUrl || null,
          lastSeenAt: new Date().toISOString(),
        });
      }
    }
    return;
  }

  // Drop user from their previous zone.
  if (previousZoneId && zonePresence.has(workspaceId)) {
    zonePresence.get(workspaceId).get(previousZoneId)?.delete(user.id);
  }

  // Place user into the new zone if provided.
  if (zoneId) {
    if (!zonePresence.has(workspaceId)) zonePresence.set(workspaceId, new Map());
    const byZone = zonePresence.get(workspaceId);
    if (!byZone.has(zoneId)) byZone.set(zoneId, new Map());
    byZone.get(zoneId).set(user.id, {
      userId: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl || null,
      lastSeenAt: new Date().toISOString(),
    });
  }

  userCurrentZone.get(workspaceId).set(user.id, zoneId || null);

  if (io) {
    const presence = getZonePresenceSnapshot(workspaceId);
    io.to(`workspace:${workspaceId}`).emit("zone:presence", { workspaceId, presence });
  }
};

const removeUserFromAllZones = (io, workspaceId, userId) => {
  if (!workspaceId || !userId) return;
  userCurrentZone.get(workspaceId)?.delete(userId);
  if (zonePresence.has(workspaceId)) {
    for (const z of zonePresence.get(workspaceId).values()) {
      z.delete(userId);
    }
  }
  if (io) {
    const presence = getZonePresenceSnapshot(workspaceId);
    io.to(`workspace:${workspaceId}`).emit("zone:presence", { workspaceId, presence });
  }
};

const getZonePresenceSnapshot = (workspaceId) => {
  const result = {};
  const byZone = zonePresence.get(workspaceId);
  if (!byZone) return result;
  for (const [zoneId, users] of byZone.entries()) {
    if (users.size === 0) continue;
    result[zoneId] = Array.from(users.values());
  }
  return result;
};

export {
  zonesCache,
  zonePresence,
  userCurrentZone,
  invalidateZoneCache,
  findZoneAtPoint,
  updateUserZonePresence,
  removeUserFromAllZones,
  getZonePresenceSnapshot,
};

export default {
  findZoneAtPoint,
  updateUserZonePresence,
  removeUserFromAllZones,
  getZonePresenceSnapshot,
  invalidateZoneCache,
};
