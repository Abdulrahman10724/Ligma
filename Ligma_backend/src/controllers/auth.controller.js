import { register, login, verifyEmail, resendVerificationEmail } from "../services/auth.service.js";
import { sendSuccess } from "../utils/api-response.util.js";

const registerUser = async (req, res, next) => {
  try {
    const result = await register(req.body);
    return sendSuccess(res, 201, "Registration successful", result);
  } catch (error) {
    return next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const result = await login(req.body);
    return sendSuccess(res, 200, "Login successful", result);
  } catch (error) {
    return next(error);
  }
};

const getMe = async (req, res) => sendSuccess(res, 200, "Authenticated user retrieved successfully", { user: req.user });

const verifyEmailUser = async (req, res, next) => {
  try {
    const result = await verifyEmail({ token: req.body?.token || req.query?.token });
    return sendSuccess(res, 200, result.alreadyVerified ? "Email was already verified" : "Email verified successfully", result);
  } catch (error) {
    return next(error);
  }
};

const resendVerificationEmailUser = async (req, res, next) => {
  try {
    const result = await resendVerificationEmail({ userId: req.user.id });
    return sendSuccess(res, 200, "Verification email sent", result);
  } catch (error) {
    return next(error);
  }
};

const logoutUser = async (req, res) => sendSuccess(res, 200, "Logout successful");

export { registerUser, loginUser, getMe, verifyEmailUser, resendVerificationEmailUser, logoutUser };

export default {
  registerUser,
  loginUser,
  getMe,
  verifyEmailUser,
  resendVerificationEmailUser,
  logoutUser,
};