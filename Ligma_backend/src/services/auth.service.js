import crypto from "crypto";
import bcrypt from "bcryptjs";

import {
  createUser,
  ensureUserIndexes,
  findUserByEmail,
  findUserById,
  sanitizeUser,
  setEmailVerificationToken,
  clearEmailVerificationToken,
  findUserByVerificationToken,
  markEmailVerified,
} from "../models/user.model.js";
import { signAccessToken } from "../utils/jwt.util.js";
import { sendVerificationEmail } from "./email.service.js";

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
  const verificationToken = crypto.randomBytes(32).toString("hex");
  await setEmailVerificationToken(user._id, verificationToken);

  try {
    await sendVerificationEmail({ to: user.email, name: user.name, token: verificationToken });
  } catch (error) {
    // Keep registration successful even if email delivery fails; UI can provide resend.
  }

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

  if (!user.emailVerified) {
    const error = new Error("Please verify your email before continuing.");
    error.statusCode = 403;
    error.code = "EMAIL_NOT_VERIFIED";
    throw error;
  }

  return buildAuthPayload(user);
};

const verifyEmail = async ({ token }) => {
  if (!token) {
    const error = new Error("Verification token is required");
    error.statusCode = 400;
    throw error;
  }

  const user = await findUserByVerificationToken(token);

  if (!user) {
    const error = new Error("This verification link is invalid or has already been used");
    error.statusCode = 400;
    throw error;
  }

  if (user.emailVerified) {
    return { alreadyVerified: true, user: sanitizeUser(user) };
  }

  const expiresAt = user.emailVerificationExpiresAt ? new Date(user.emailVerificationExpiresAt) : null;

  if (!expiresAt || expiresAt.getTime() < Date.now()) {
    await clearEmailVerificationToken(user._id);
    const error = new Error("This verification link has expired");
    error.statusCode = 410;
    throw error;
  }

  await markEmailVerified(user._id);
  return { alreadyVerified: false, user: sanitizeUser({ ...user, emailVerified: true }) };
};

const resendVerificationEmail = async ({ userId }) => {
  const user = await findUserById(userId);

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (user.emailVerified) {
    const error = new Error("This account is already verified");
    error.statusCode = 409;
    throw error;
  }

  const verificationToken = crypto.randomBytes(32).toString("hex");
  await setEmailVerificationToken(user._id, verificationToken);

  try {
    await sendVerificationEmail({ to: user.email, name: user.name, token: verificationToken });
  } catch (error) {
    throw error;
  }

  return { success: true };
};

export { register, login, verifyEmail, resendVerificationEmail };

export default {
  register,
  login,
  verifyEmail,
  resendVerificationEmail,
};