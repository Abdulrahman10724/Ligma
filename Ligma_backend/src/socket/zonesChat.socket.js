// Phase 14 + Phase 15 — Socket layer extensions.
// Reuses the existing `workspace:${workspaceId}` rooms for broadcast and the
// existing RBAC service for access checks. No new connection is opened.
//
// Adds:
//   * workspace:zone-cursor  → best-effort updates of which zone each user is in
//   * zone:created/updated/deleted  → public broadcasts
//   * chat:join-channel / chat:leave-channel → room management
//   * chat:typing / chat:stopped-typing → typing indicator
//   * chat:message / chat:message-updated / chat:message-deleted → broadcasts
//   * chat:channel-created / chat:channel-deleted → broadcasts

import { assertWorkspaceAccess, assertWorkspaceEditAccess } from "../services/member.service.js";
import { findZoneAtPoint, updateUserZonePresence, removeUserFromAllZones } from "../services/zone-presence.service.js";
import { assertChannelVisible } from "../services/channel.service.js";
import { findChannelById } from "../models/channel.model.js";
let _io = null;
let _socket = null;

// Tracks per-channel typing users: workspaceId -> channelId -> Map<userId, userInfo>
const typingState = new Map();

const roomForChannel = (workspaceId, channelId) => `workspace:${workspaceId}:channel:${channelId}`;

const emitZonePresence = (workspaceId) => {
  if (!_io) return;
  const presence = (require("../services/zone-presence.service.js")).getZonePresenceSnapshot(workspaceId);
  _io.to(`workspace:${workspaceId}`).emit("zone:presence", { workspaceId, presence });
};

const registerZoneCursorHandler = (io, socket) => {
  _io = io;
  _socket = socket;
  // No-op: the main socket.service.js already interpolates cursor coords and
  // computes zones; this module exports the functions used by socket.service.js.
};

// Accepts a payload from clients that haven't been able to compute the zone.
const registerChatHandlers = (io, socket) => {
  _io = io;

  socket.on("workspace:zone-cursor", async ({ workspaceId, x, y } = {}) => {
    try {
      if (!workspaceId || typeof x !== "number" || typeof y !== "number") return;
      await assertWorkspaceAccess(workspaceId, socket.user.id);
      const zoneId = await findZoneAtPoint(workspaceId, { x, y });
      updateUserZonePresence(io, { workspaceId, user: socket.user, zoneId });
    } catch { /* best-effort */ }
  });

  socket.on("chat:join-channel", async ({ workspaceId, channelId } = {}, ack) => {
    try {
      if (!workspaceId || !channelId) throw new Error("workspaceId and channelId required");
      await assertWorkspaceAccess(workspaceId, socket.user.id);
      const channel = await findChannelById(channelId);
      if (!channel || channel.workspaceId?.toString() !== workspaceId) {
        throw new Error("Channel not found");
      }
      await assertChannelVisible(channel, workspaceId, socket.user.id);
      socket.join(roomForChannel(workspaceId, channelId));
      ack?.({ success: true });
    } catch (error) {
      ack?.({ success: false, message: error.message || "Unable to join channel" });
    }
  });

  socket.on("chat:leave-channel", async ({ workspaceId, channelId } = {}, ack) => {
    try {
      if (!workspaceId || !channelId) throw new Error("workspaceId and channelId required");
      socket.leave(roomForChannel(workspaceId, channelId));
      ack?.({ success: true });
    } catch (error) {
      ack?.({ success: false, message: error.message || "Unable to leave channel" });
    }
  });

  socket.on("chat:typing", async ({ workspaceId, channelId } = {}, ack) => {
    try {
      if (!workspaceId || !channelId) return;
      await assertWorkspaceAccess(workspaceId, socket.user.id);
      if (!typingState.has(workspaceId)) typingState.set(workspaceId, new Map());
      const wsMap = typingState.get(workspaceId);
      if (!wsMap.has(channelId)) wsMap.set(channelId, new Map());
      wsMap.get(channelId).set(socket.user.id, {
        userId: socket.user.id,
        name: socket.user.name,
        avatarUrl: socket.user.avatarUrl || null,
      });
      socket
        .to(roomForChannel(workspaceId, channelId))
        .emit("chat:typing", {
          workspaceId,
          channelId,
          userId: socket.user.id,
          name: socket.user.name,
          avatarUrl: socket.user.avatarUrl || null,
        });
      ack?.({ success: true });
    } catch (error) {
      ack?.({ success: false, message: error.message || "Unable to emit typing" });
    }
  });

  socket.on("chat:stopped-typing", async ({ workspaceId, channelId } = {}, ack) => {
    try {
      if (!workspaceId || !channelId) return;
      const wsMap = typingState.get(workspaceId);
      wsMap?.get(channelId)?.delete(socket.user.id);
      if (wsMap?.get(channelId)?.size === 0) wsMap.delete(channelId);
      socket
        .to(roomForChannel(workspaceId, channelId))
        .emit("chat:stopped-typing", {
          workspaceId,
          channelId,
          userId: socket.user.id,
        });
      ack?.({ success: true });
    } catch {
      ack?.({ success: false });
    }
  });
};

const cleanupChatForSocket = (socket) => {
  // Remove typing entries for this socket user.
  if (!socket.user) return;
  const userId = socket.user.id;
  for (const [workspaceId, channels] of typingState.entries()) {
    for (const [channelId, users] of channels.entries()) {
      if (users.has(userId)) {
        users.delete(userId);
        if (_io) {
          _io.to(roomForChannel(workspaceId, channelId)).emit("chat:stopped-typing", {
            workspaceId,
            channelId,
            userId,
          });
        }
        if (users.size === 0) channels.delete(channelId);
      }
    }
    if (channels.size === 0) typingState.delete(workspaceId);
  }
};

export {
  registerZoneCursorHandler,
  registerChatHandlers,
  cleanupChatForSocket,
  emitZonePresence,
  roomForChannel,
  updateUserZonePresence,
  removeUserFromAllZones,
  findZoneAtPoint,
};

export default {
  registerZoneCursorHandler,
  registerChatHandlers,
  cleanupChatForSocket,
  emitZonePresence,
};
