import { MongoClient } from "mongodb";

import config from "./env.config.js";
import logger from "../utils/logger.util.js";

let client;
let db;

const connectDB = async () => {
  if (db) {
    return db;
  }

  try {
    client = new MongoClient(config.MONGODB_URI);
    await client.connect();
    db = client.db();

    await db.command({ ping: 1 });
    logger.info("🔌 MongoDB connected successfully.");

    return db;
  } catch (error) {
    logger.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

const getDb = () => {
  if (!db) {
    throw new Error("Database not initialized. Call connectDB() first.");
  }

  return db;
};

const getCollection = (collectionName) => getDb().collection(collectionName);

const closeDB = async () => {
  if (!client) {
    return;
  }

  const activeClient = client;
  client = undefined;
  db = undefined;

  await activeClient.close();
  logger.info("🔌 MongoDB connection closed through app termination.");
};

export { connectDB, getDb, getCollection, closeDB };

export default connectDB;
