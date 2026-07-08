import { ObjectId } from "mongodb";

import { getCollection } from "../config/db.config.js";

const COLLECTION_NAME = "workspaceMembers";

const getWorkspaceMembersCollection = () => getCollection(COLLECTION_NAME);

let workspaceMemberIndexesReady = false;
let workspaceMemberIndexesPromise = null;

const ensureWorkspaceMemberIndexes = async () => {
  if (workspaceMemberIndexesReady) {
    return;
  }

  if (!workspaceMemberIndexesPromise) {
    workspaceMemberIndexesPromise = (async () => {
      await getWorkspaceMembersCollection().createIndex({ workspaceId: 1, userId: 1 }, { unique: true });
      workspaceMemberIndexesReady = true;
    })().finally(() => {
      workspaceMemberIndexesPromise = null;
    });
  }

  await workspaceMemberIndexesPromise;
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

const findMembersByWorkspace = async (workspaceId) =>
  getWorkspaceMembersCollection()
    .find({ workspaceId: new ObjectId(workspaceId) })
    .sort({ joinedAt: 1 })
    .toArray();

const findMembershipsForUser = async (userId) =>
  getWorkspaceMembersCollection()
    .find({ userId: new ObjectId(userId) })
    .project({ workspaceId: 1, role: 1 })
    .toArray();

const updateMemberRole = async (workspaceId, userId, newRole) => {
  const now = new Date();
  return getWorkspaceMembersCollection().findOneAndUpdate(
    { workspaceId: new ObjectId(workspaceId), userId: new ObjectId(userId) },
    { $set: { role: newRole, updatedAt: now } },
    { returnDocument: "after" }
  );
};

const removeMember = async (workspaceId, userId) =>
  getWorkspaceMembersCollection().deleteOne({
    workspaceId: new ObjectId(workspaceId),
    userId: new ObjectId(userId),
  });

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

export {
  COLLECTION_NAME,
  ensureWorkspaceMemberIndexes,
  sanitizeWorkspaceMember,
  findWorkspaceMember,
  findMembersByWorkspace,
  findMembershipsForUser,
  updateMemberRole,
  removeMember,
  createWorkspaceMember,
};

export default {
  COLLECTION_NAME,
  ensureWorkspaceMemberIndexes,
  sanitizeWorkspaceMember,
  findWorkspaceMember,
  findMembersByWorkspace,
  findMembershipsForUser,
  updateMemberRole,
  removeMember,
  createWorkspaceMember,
};