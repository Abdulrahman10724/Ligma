import { Server } from "socket.io";
import config from "../config/env.config.js";
import logger from "../utils/logger.util.js";

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: config.SOCKET_CORS_ORIGIN || config.CLIENT_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  io.on("connection", (socket) => {
    logger.info(`🔌 Socket connected: ${socket.id}`);

    socket.on("disconnect", (reason) => {
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

export {
  initSocket,
  getIO,
};
