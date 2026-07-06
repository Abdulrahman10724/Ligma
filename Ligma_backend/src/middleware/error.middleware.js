import logger from "../utils/logger.util.js";
import config from "../config/env.config.js";

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  logger.error(`Error: ${message}`, {
    statusCode,
    path: req.originalUrl,
    method: req.method,
    stack: config.NODE_ENV === "development" ? err.stack : undefined,
  });

  const response = {
    success: false,
    message,
  };

  // Add validation errors or details if any
  if (err.errors) {
    response.errors = err.errors;
  }

  // Include stack trace in development mode only
  if (config.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export default errorHandler;
