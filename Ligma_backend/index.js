import express from "express";
import http from "http";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";

import config from "./src/config/env.config.js";
import connectDB from "./src/config/db.config.js";
import errorHandler from "./src/middleware/error.middleware.js";
import { initSocket } from "./src/socket/socket.service.js";
import logger from "./src/utils/logger.util.js";

const app = express();
const server = http.createServer(app);

// 1. Establish Database Connection
connectDB();

// 2. Setup Security & Base Middlewares
app.use(helmet());
app.use(
  cors({
    origin: config.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Morgan Logging Integration
if (config.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Global Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes",
  },
});
app.use(limiter);

// 3. API Base & Health Check Routes
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Ligma API is healthy",
    timestamp: new Date().toISOString(),
    env: config.NODE_ENV,
  });
});

// A placeholder api route for future phases
app.get("/api", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Ligma REST API base entrypoint",
  });
});

// 4. Initialize Socket.IO
initSocket(server);

// 5. Global Error Handling Middleware (must be registered last)
app.use(errorHandler);

// 6. Start HTTP Server
const PORT = config.PORT;
server.listen(PORT, () => {
  logger.info(`🚀 Server running in ${config.NODE_ENV} mode on port ${PORT}`);
});
