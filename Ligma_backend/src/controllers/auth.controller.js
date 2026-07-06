import { register, login } from "../services/auth.service.js";
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

const logoutUser = async (req, res) => sendSuccess(res, 200, "Logout successful");

export { registerUser, loginUser, getMe, logoutUser };

export default {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
};