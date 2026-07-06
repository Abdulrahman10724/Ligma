import { ObjectId } from "mongodb";

import { findUserById, sanitizeUser } from "../models/user.model.js";
import { verifyAccessToken } from "../utils/jwt.util.js";

const authMiddleware = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      const error = new Error("Unauthorized");
      error.statusCode = 401;
      throw error;
    }

    const token = header.split(" ")[1];
    const decoded = verifyAccessToken(token);

    if (!decoded?.id || !ObjectId.isValid(decoded.id)) {
      const error = new Error("Invalid or expired token");
      error.statusCode = 401;
      throw error;
    }

    const user = await findUserById(decoded.id);

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 401;
      throw error;
    }

    req.user = sanitizeUser(user);
    req.auth = {
      userId: req.user.id,
      email: req.user.email,
    };

    return next();
  } catch (error) {
    error.statusCode = error.statusCode || 401;
    error.message = error.message || "Unauthorized";
    return next(error);
  }
};

export default authMiddleware;