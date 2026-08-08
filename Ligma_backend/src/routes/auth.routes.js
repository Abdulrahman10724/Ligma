import { Router } from "express";
import rateLimit from "express-rate-limit";

import authMiddleware from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import authLimiter from "../middleware/rate-limit.middleware.js";
import { loginSchema, registerSchema } from "../validation/auth.validation.js";
import { getMe, loginUser, logoutUser, registerUser, verifyEmailUser, resendVerificationEmailUser } from "../controllers/auth.controller.js";

const router = Router();
const verificationResendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many verification emails requested. Please try again later.",
  },
  statusCode: 429,
});

router.post("/register", authLimiter, validate(registerSchema), registerUser);
router.post("/login", authLimiter, validate(loginSchema), loginUser);
router.post("/verify-email", verifyEmailUser);
router.post("/resend-verification", authMiddleware, verificationResendLimiter, resendVerificationEmailUser);
router.get("/me", authMiddleware, getMe);
router.post("/logout", logoutUser);

export default router;