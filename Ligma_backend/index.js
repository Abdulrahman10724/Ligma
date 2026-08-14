import express from "express";
import http from "http";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import connectRedis, { closeRedis as closeRedisConnection } from "./src/config/redis.config.js";
import { closeBullMQInfrastructure, ensureBullMQConnection, getBullMQHealth } from "./src/config/bullmq.config.js";

import config from "./src/config/env.config.js";
import connectDB, { closeDB } from "./src/config/db.config.js";
import errorHandler from "./src/middleware/error.middleware.js";
import { initSocket } from "./src/socket/socket.service.js";
import logger from "./src/utils/logger.util.js";
import { enqueueInfrastructureCheckJob } from "./src/queues/infrastructure.queue.js";
import "./src/workers/infrastructure.worker.js";
import "./src/workers/classification.worker.js";
import "./src/workers/task.worker.js";
import "./src/workers/email.worker.js";
import "./src/workers/audit.worker.js";

import authRoutes from "./src/routes/auth.routes.js";
import invitationRoutes from "./src/routes/invitation.routes.js";
import workspaceRoutes from "./src/routes/workspace.routes.js";
import memberRoutes from "./src/routes/member.routes.js";
import canvasNodeRoutes from "./src/routes/canvas-node.routes.js";
import taskRoutes from "./src/routes/task.routes.js";
import zoneRoutes from "./src/routes/zone.routes.js";
import chatRoutes from "./src/routes/chat.routes.js";

const app = express();
const server = http.createServer(app);
let isShuttingDown = false;

// Security & core middleware
app.use(helmet());
app.use(
  cors({
    origin: config.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: "4mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  morgan(config.NODE_ENV === "development" ? "dev" : "combined")
);

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  message: { success: false, message: "Too many requests, please try again later." },
  statusCode: 429,
});
app.use(globalLimiter);

const startServer = async () => {
  await connectDB();
  logger.info(`✅ Connected to MongoDB at ${config.MONGODB_URI.replace(/:[^:@]+@/, ":***@")} `);

  // Redis: connection only (no features wired up yet — see redis.config.js).
  // Startup does not hard-fail if Redis is briefly unavailable; it logs and
  // continues, matching the app's existing "best-effort" style for
  // non-critical infra (see e.g. socket emit try/catch blocks below).
  try {
    await connectRedis();
  } catch (error) {
    logger.error(`❌ Redis Connection Error: ${error.message}`);
  }

  await ensureBullMQConnection("producer");
  await ensureBullMQConnection("worker");

  // Health check
  app.get("/", (req, res) =>
    res.json({
      success: true,
      message: "Ligma API is running",
      version: "14.0",
      env: config.NODE_ENV,
    })
  );
  app.get("/health", (req, res) => res.json({ success: true, status: "healthy" }));
  app.get("/health/queues", (req, res) =>
    res.json({
      success: true,
      status: "healthy",
      bullmq: getBullMQHealth(),
    })
  );

  // Versioned API
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/invitations", invitationRoutes);
  app.use("/api/v1/workspaces", workspaceRoutes);
  app.use("/api/v1/workspaces/:workspaceId/members", memberRoutes);
  app.use("/api/v1/workspaces/:workspaceId/canvas", canvasNodeRoutes);
  app.use("/api/v1/workspaces/:workspaceId/tasks", taskRoutes);
  app.use("/api/v1/workspaces/:workspaceId/zones", zoneRoutes);
  app.use("/api/v1/workspaces/:workspaceId/chat", chatRoutes);

  // Initialize Socket.IO
  initSocket(server);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `Route ${req.method} ${req.path} not found`,
    });
  });

  // Global error handler (must be last)
  app.use(errorHandler);

  server.listen(config.PORT, () => {
    logger.info(`🚀 Ligma backend running on port ${config.PORT} (${config.NODE_ENV})`);
  });

  await enqueueInfrastructureCheckJob({ source: "startup" });
};

const shutdown = async (signal) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  logger.info(`🛑 Received ${signal}; starting graceful shutdown.`);

  await new Promise((resolve) => server.close(resolve));

  await Promise.allSettled([
    closeBullMQInfrastructure(),
    closeRedisConnection(),
    closeDB(),
  ]);

  logger.info("✅ Graceful shutdown complete.");
  process.exit(0);
};

process.once("SIGINT", () => {
  void shutdown("SIGINT");
});

process.once("SIGTERM", () => {
  void shutdown("SIGTERM");
});

startServer().catch((error) => {
  logger.error("Failed to start server", { message: error?.message });
  process.exit(1);
});

export default app;
