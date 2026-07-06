import config from "../config/env.config.js";

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const currentLevel = levels[config.LOG_LEVEL] !== undefined ? levels[config.LOG_LEVEL] : 2;

const formatMessage = (level, message, meta) => {
  const timestamp = new Date().toISOString();
  const metaString = meta && Object.keys(meta).length ? ` | Meta: ${JSON.stringify(meta)}` : "";
  return `[${timestamp}] [${level.toUpperCase()}]: ${message}${metaString}`;
};

const logger = {
  error: (message, meta) => {
    if (currentLevel >= levels.error) {
      console.error(formatMessage("error", message, meta));
    }
  },
  warn: (message, meta) => {
    if (currentLevel >= levels.warn) {
      console.warn(formatMessage("warn", message, meta));
    }
  },
  info: (message, meta) => {
    if (currentLevel >= levels.info) {
      console.log(formatMessage("info", message, meta));
    }
  },
  debug: (message, meta) => {
    if (currentLevel >= levels.debug) {
      console.debug(formatMessage("debug", message, meta));
    }
  },
};

export default logger;
