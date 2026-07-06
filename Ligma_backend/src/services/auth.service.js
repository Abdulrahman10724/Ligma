import bcrypt from "bcryptjs";

import { createUser, ensureUserIndexes, findUserByEmail, sanitizeUser } from "../models/user.model.js";
import { signAccessToken } from "../utils/jwt.util.js";

const buildAuthPayload = (user) => {
  const safeUser = sanitizeUser(user);

  return {
    user: safeUser,
    token: signAccessToken({
      id: safeUser.id,
      email: safeUser.email,
    }),
  };
};

const register = async ({ name, email, password }) => {
  await ensureUserIndexes();

  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    const error = new Error("A user with this email already exists");
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await createUser({ name, email, password: hashedPassword });

  return buildAuthPayload(user);
};

const login = async ({ email, password }) => {
  await ensureUserIndexes();

  const user = await findUserByEmail(email);

  if (!user) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  return buildAuthPayload(user);
};

export { register, login };

export default {
  register,
  login,
};