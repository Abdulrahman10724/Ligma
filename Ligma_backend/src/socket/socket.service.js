import { Server } from "socket.io";
import config from "../config/env.config.js";
import { findUserById, sanitizeUser } from "../models/user.model.js";
import { verifyAccessToken } from "../utils/jwt.util.js";
import { assertWorkspaceAccess, assertWorkspaceEditAccess } from "../services/member.service.js";
import logger from "../utils/logger.util.js";

let io;

const socketMetaById = new Map();
const presenceByWorkspace = new Map(); // workspaceId -> Map<userId, userInfo>

const workspaceRoom = (workspaceId) => `workspace:${workspaceId}`;

const emitWorkspacePresence = (workspaceId) => {
  const workspacePresence = presenceByWorkspace.get(workspaceId) || new Map();
  const users = Array.from(workspacePresence.values());
  io.to(workspaceRoom(workspaceId)).emit("workspace:presence", {
    workspaceId,
    users,
  });
};

const joinWorkspacePresence = (workspaceId, user) => {
  if (!presenceByWorkspace.has(workspaceId)) {
    presenceByWorkspace.set(workspaceId, new Map());
  }

  const workspacePresence = presenceByWorkspace.get(workspaceId);
  workspacePresence.set(user.id, {
    userId: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl || null,
    online: true,
    lastSeenAt: new Date().toISOString(),
  });
};

const leaveWorkspacePresence = (workspaceId, userId) => {
  const workspacePresence = presenceByWorkspace.get(workspaceId);
  if (!workspacePresence) return;

  workspacePresence.delete(userId);

  if (workspacePresence.size === 0) {
    presenceByWorkspace.delete(workspaceId);
  }
};

const cleanupSocketRooms = (socket) => {
  const meta = socketMetaById.get(socket.id);
  if (!meta?.joinedWorkspaces?.size) {
    socketMetaById.delete(socket.id);
    return;
  }

  for (const workspaceId of meta.joinedWorkspaces) {
    leaveWorkspacePresence(workspaceId, meta.user.id);
    emitWorkspacePresence(workspaceId);
    socket.leave(workspaceRoom(workspaceId));
  }

  socketMetaById.delete(socket.id);
};

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: config.SOCKET_CORS_ORIGIN || config.CLIENT_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const decoded = verifyAccessToken(token);
      if (!decoded?.id) {
        return next(new Error("Unauthorized"));
      }

      const user = await findUserById(decoded.id);
      if (!user) {
        return next(new Error("Unauthorized"));
      }

      socket.user = sanitizeUser(user);
      return next();
    } catch (error) {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    socketMetaById.set(socket.id, {
      user: socket.user,
      joinedWorkspaces: new Set(),
    });

    logger.info(`🔌 Socket connected: ${socket.id}`);

    socket.on("workspace:join", async ({ workspaceId } = {}, ack) => {
      try {
        if (!workspaceId) {
          throw new Error("Workspace ID is required");
        }

        await assertWorkspaceAccess(workspaceId, socket.user.id);
        socket.join(workspaceRoom(workspaceId));

        const meta = socketMetaById.get(socket.id);
        meta?.joinedWorkspaces.add(workspaceId);

        joinWorkspacePresence(workspaceId, socket.user);
        emitWorkspacePresence(workspaceId);

        ack?.({ success: true });
      } catch (error) {
        ack?.({ success: false, message: error.message || "Unable to join workspace" });
      }
    });

    socket.on("workspace:leave", ({ workspaceId } = {}, ack) => {
      if (!workspaceId) {
        ack?.({ success: false, message: "Workspace ID is required" });
        return;
      }

      const meta = socketMetaById.get(socket.id);
      meta?.joinedWorkspaces.delete(workspaceId);

      leaveWorkspacePresence(workspaceId, socket.user.id);
      emitWorkspacePresence(workspaceId);

      socket.leave(workspaceRoom(workspaceId));
      ack?.({ success: true });
    });

    socket.on("workspace:cursor", ({ workspaceId, x, y } = {}) => {
      if (!workspaceId || typeof x !== "number" || typeof y !== "number") {
        return;
      }

      const meta = socketMetaById.get(socket.id);
      if (!meta?.joinedWorkspaces.has(workspaceId)) {
        return;
      }

      socket.to(workspaceRoom(workspaceId)).emit("workspace:cursor", {
        workspaceId,
        userId: socket.user.id,
        name: socket.user.name,
        avatarUrl: socket.user.avatarUrl || null,
        x,
        y,
      });
    });

    socket.on("canvas:drag", async ({ workspaceId, nodeId, x, y } = {}) => {
      try {
        if (!workspaceId || !nodeId || typeof x !== "number" || typeof y !== "number") {
          return;
        }

        await assertWorkspaceEditAccess(workspaceId, socket.user.id);

        socket.to(workspaceRoom(workspaceId)).emit("canvas:drag", {
          workspaceId,
          nodeId,
          x,
          y,
          actorId: socket.user.id,
        });
      } catch {
        // silently ignore unauthorized updates
      }
    });

    socket.on("canvas:resize", async ({ workspaceId, nodeId, x, y, data } = {}) => {
      try {
        if (!workspaceId || !nodeId || typeof x !== "number" || typeof y !== "number" || typeof data !== "object") {
          return;
        }

        await assertWorkspaceEditAccess(workspaceId, socket.user.id);

        socket.to(workspaceRoom(workspaceId)).emit("canvas:resize", {
          workspaceId,
          nodeId,
          x,
          y,
          data,
          actorId: socket.user.id,
        });
      } catch {
        // silently ignore unauthorized updates
      }
    });

    //two new Handlers  and one rotation
    socket.on("canvas:data", async ({ workspaceId, nodeId, patch } = {}) => {
      try {
        if (!workspaceId || !nodeId || typeof patch !== "object" || patch === null) {
          return;
        }

        await assertWorkspaceEditAccess(workspaceId, socket.user.id);

        socket.to(workspaceRoom(workspaceId)).emit("canvas:data", {
          workspaceId,
          nodeId,
          patch,
          actorId: socket.user.id,
        });
      } catch {
        // silently ignore unauthorized updates
      }
    });

    socket.on("canvas:text", async ({ workspaceId, nodeId, value } = {}) => {
      try {
        if (!workspaceId || !nodeId || typeof value !== "string") {
          return;
        }

        await assertWorkspaceEditAccess(workspaceId, socket.user.id);

        socket.to(workspaceRoom(workspaceId)).emit("canvas:text", {
          workspaceId,
          nodeId,
          value,
          actorId: socket.user.id,
        });
      } catch {
        // silently ignore unauthorized updates
      }
    });

    socket.on("canvas:rotate", async ({ workspaceId, nodeId, rotation } = {}) => {
      try {
        if (!workspaceId || !nodeId || typeof rotation !== "number") {
          return;
        }

        await assertWorkspaceEditAccess(workspaceId, socket.user.id);

        socket.to(workspaceRoom(workspaceId)).emit("canvas:rotate", {
          workspaceId,
          nodeId,
          rotation,
          actorId: socket.user.id,
        });
      } catch {
        // silently ignore unauthorized updates
      }
    });

    socket.on("canvas:draft", async ({ workspaceId, draft } = {}) => {
      try {
        if (!workspaceId || typeof draft !== "object" || draft === null) {
          return;
        }

        await assertWorkspaceEditAccess(workspaceId, socket.user.id);

        socket.to(workspaceRoom(workspaceId)).emit("canvas:draft", {
          workspaceId,
          draft,
          actorId: socket.user.id,
        });
      } catch {
        // silently ignore unauthorized updates
      }
    });

    socket.on("disconnect", (reason) => {
      cleanupSocketRooms(socket);
      logger.info(`🔌 Socket disconnected: ${socket.id} | Reason: ${reason}`);
    });
  });

  logger.info("⚡ Socket.IO initialized successfully.");
  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized. Call initSocket(server) first.");
  }
  return io;
};

const emitWorkspaceEvent = (workspaceId, eventName, payload) => {
  if (!io || !workspaceId || !eventName) {
    return;
  }

  io.to(workspaceRoom(workspaceId)).emit(eventName, payload);
};

export {
  initSocket,
  getIO,
  emitWorkspaceEvent,
};
