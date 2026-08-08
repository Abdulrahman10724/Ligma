import crypto from "crypto";
import { ObjectId } from "mongodb";

import { getCollection } from "../config/db.config.js";

const COLLECTION_NAME = "users";

const getUsersCollection = () => getCollection(COLLECTION_NAME);

const ensureUserIndexes = async () => {
  await getUsersCollection().createIndex({ email: 1 }, { unique: true });
  await getUsersCollection().createIndex({ emailVerificationTokenHash: 1 });
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
    emailVerified: false,
    emailVerificationTokenHash: null,
    emailVerificationExpiresAt: null,
    createdAt: now,
    updatedAt: now,
  };

  const result = await getUsersCollection().insertOne(userDocument);

  return {
    ...userDocument,
    _id: result.insertedId,
  };
};

const hashVerificationToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const setEmailVerificationToken = async (userId, token) => {
  const tokenHash = hashVerificationToken(token);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await getUsersCollection().updateOne(
    { _id: new ObjectId(userId) },
    {
      $set: {
        emailVerificationTokenHash: tokenHash,
        emailVerificationExpiresAt: expiresAt,
        updatedAt: new Date(),
      },
    }
  );

  return { tokenHash, expiresAt };
};

const clearEmailVerificationToken = async (userId) => {
  await getUsersCollection().updateOne(
    { _id: new ObjectId(userId) },
    {
      $set: {
        emailVerificationTokenHash: null,
        emailVerificationExpiresAt: null,
        updatedAt: new Date(),
      },
    }
  );
};

const findUserByVerificationToken = async (token) => {
  const tokenHash = hashVerificationToken(token);
  return getUsersCollection().findOne({
    emailVerificationTokenHash: tokenHash,
  });
};

const markEmailVerified = async (userId) => {
  await getUsersCollection().updateOne(
    { _id: new ObjectId(userId) },
    {
      $set: {
        emailVerified: true,
        emailVerificationTokenHash: null,
        emailVerificationExpiresAt: null,
        updatedAt: new Date(),
      },
    }
  );
};

export {
  COLLECTION_NAME,
  ensureUserIndexes,
  sanitizeUser,
  findUserByEmail,
  findUserById,
  createUser,
  hashVerificationToken,
  setEmailVerificationToken,
  clearEmailVerificationToken,
  findUserByVerificationToken,
  markEmailVerified,
};

export default {
  COLLECTION_NAME,
  ensureUserIndexes,
  sanitizeUser,
  findUserByEmail,
  findUserById,
  createUser,
  hashVerificationToken,
  setEmailVerificationToken,
  clearEmailVerificationToken,
  findUserByVerificationToken,
  markEmailVerified,
};