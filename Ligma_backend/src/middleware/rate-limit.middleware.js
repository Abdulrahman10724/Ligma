import rateLimit from "express-rate-limit";
import config from "../config/env.config.js";

const authLimiter = rateLimit({
  windowMs: Number(config.AUTH_RATE_LIMIT_WINDOW_MS),
  max: Number(config.AUTH_RATE_LIMIT_MAX),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },
  statusCode: 429,
});

export default authLimiter;
export { authLimiter };