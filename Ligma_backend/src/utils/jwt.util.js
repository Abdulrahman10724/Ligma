import jwt from "jsonwebtoken";

import config from "../config/env.config.js";

const signAccessToken = (payload) => jwt.sign(payload, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });

const verifyAccessToken = (token) => jwt.verify(token, config.JWT_SECRET);

export { signAccessToken, verifyAccessToken };

export default {
  signAccessToken,
  verifyAccessToken,
};