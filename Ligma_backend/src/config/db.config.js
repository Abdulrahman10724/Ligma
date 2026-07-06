import mongoose from "mongoose";
import config from "./env.config.js";
import logger from "../utils/logger.util.js";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.MONGODB_URI);

    logger.info(`🔌 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
   console.log(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

mongoose.connection.on("connected", () => {
  logger.info("🟢 Mongoose connected to database.");
});

mongoose.connection.on("error", (err) => {
  logger.error(`🔴 Mongoose connection error: ${err.message}`);
});

mongoose.connection.on("disconnected", () => {
  logger.warn("🟡 Mongoose connection disconnected.");
});

// Graceful shutdown on app termination
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  logger.info("🔌 Mongoose connection closed through app termination.");
  process.exit(0);
});

export default connectDB;
