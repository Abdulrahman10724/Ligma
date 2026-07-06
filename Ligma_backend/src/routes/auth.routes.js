import { Router } from "express";

import authMiddleware from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { loginSchema, registerSchema } from "../validation/auth.validation.js";
import { getMe, loginUser, logoutUser, registerUser } from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", validate(registerSchema), registerUser);
router.post("/login", validate(loginSchema), loginUser);
router.get("/me", authMiddleware, getMe);
router.post("/logout", logoutUser);

export default router;