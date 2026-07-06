import { ObjectId } from "mongodb";

import { getCollection } from "../config/db.config.js";

const COLLECTION_NAME = "users";

const getUsersCollection = () => getCollection(COLLECTION_NAME);

const ensureUserIndexes = async () => {
  await getUsersCollection().createIndex({ email: 1 }, { unique: true });
};

const sanitizeUser = (user) => {
  if (!user) {
    return null;
  }

  const { password, ...safeUser } = user;

  return {
    ...safeUser,
    id: safeUser._id ? safeUser._id.toString() : safeUser.id,
  };
};

const findUserByEmail = async (email) => getUsersCollection().findOne({ email: email.trim().toLowerCase() });

const findUserById = async (id) => getUsersCollection().findOne({ _id: new ObjectId(id) });

const createUser = async ({ name, email, password }) => {
  const now = new Date();
  const userDocument = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    createdAt: now,
    updatedAt: now,
  };

  const result = await getUsersCollection().insertOne(userDocument);

  return {
    ...userDocument,
    _id: result.insertedId,
  };
};

export { COLLECTION_NAME, ensureUserIndexes, sanitizeUser, findUserByEmail, findUserById, createUser };

export default {
  COLLECTION_NAME,
  ensureUserIndexes,
  sanitizeUser,
  findUserByEmail,
  findUserById,
  createUser,
};