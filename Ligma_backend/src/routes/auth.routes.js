import { Router } from "express";

import authMiddleware from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import authLimiter from "../middleware/rate-limit.middleware.js";
import { loginSchema, registerSchema } from "../validation/auth.validation.js";
import { getMe, loginUser, logoutUser, registerUser } from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", authLimiter, validate(registerSchema), registerUser);
router.post("/login", authLimiter, validate(loginSchema), loginUser);
router.get("/me", authMiddleware, getMe);
router.post("/logout", logoutUser);

export default router;