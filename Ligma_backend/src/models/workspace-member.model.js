import { ObjectId } from "mongodb";

import { getCollection } from "../config/db.config.js";

const COLLECTION_NAME = "workspaceMembers";

const getWorkspaceMembersCollection = () => getCollection(COLLECTION_NAME);

const ensureWorkspaceMemberIndexes = async () => {
  await getWorkspaceMembersCollection().createIndex({ workspaceId: 1, userId: 1 }, { unique: true });
};

const sanitizeWorkspaceMember = (workspaceMember) => {
  if (!workspaceMember) {
    return null;
  }

  return {
    ...workspaceMember,
    id: workspaceMember._id ? workspaceMember._id.toString() : workspaceMember.id,
    workspaceId: workspaceMember.workspaceId ? workspaceMember.workspaceId.toString() : workspaceMember.workspaceId,
    userId: workspaceMember.userId ? workspaceMember.userId.toString() : workspaceMember.userId,
  };
};

const findWorkspaceMember = async (workspaceId, userId) =>
  getWorkspaceMembersCollection().findOne({ workspaceId: new ObjectId(workspaceId), userId: new ObjectId(userId) });

const createWorkspaceMember = async ({ workspaceId, userId, role }) => {
  const now = new Date();
  const memberDocument = {
    workspaceId: new ObjectId(workspaceId),
    userId: new ObjectId(userId),
    role,
    joinedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  const result = await getWorkspaceMembersCollection().insertOne(memberDocument);

  return {
    ...memberDocument,
    _id: result.insertedId,
  };
};

export { COLLECTION_NAME, ensureWorkspaceMemberIndexes, sanitizeWorkspaceMember, findWorkspaceMember, createWorkspaceMember };

export default {
  COLLECTION_NAME,
  ensureWorkspaceMemberIndexes,
  sanitizeWorkspaceMember,
  findWorkspaceMember,
  createWorkspaceMember,
};