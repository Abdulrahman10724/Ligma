import { ObjectId } from "mongodb";

import { getCollection } from "../config/db.config.js";

const COLLECTION_NAME = "invitations";

const getInvitationsCollection = () => getCollection(COLLECTION_NAME);

let invitationIndexesReady = false;
let invitationIndexesPromise = null;

const ensureInvitationIndexes = async () => {
  if (invitationIndexesReady) {
    return;
  }

  if (!invitationIndexesPromise) {
    invitationIndexesPromise = (async () => {
      await getInvitationsCollection().createIndex({ tokenHash: 1 }, { unique: true });
      await getInvitationsCollection().createIndex({ workspaceId: 1, email: 1, status: 1 });
      await getInvitationsCollection().createIndex({ workspaceId: 1, createdAt: -1 });
      invitationIndexesReady = true;
    })().finally(() => {
      invitationIndexesPromise = null;
    });
  }

  await invitationIndexesPromise;
};

const sanitizeInvitation = (invitation) => {
  if (!invitation) {
    return null;
  }

  const { tokenHash, ...safeInvitation } = invitation;

  return {
    ...safeInvitation,
    id: safeInvitation._id ? safeInvitation._id.toString() : safeInvitation.id,
    workspaceId: safeInvitation.workspaceId ? safeInvitation.workspaceId.toString() : safeInvitation.workspaceId,
    invitedById: safeInvitation.invitedById ? safeInvitation.invitedById.toString() : safeInvitation.invitedById,
  };
};

const createInvitationDocument = async (document) => {
  const result = await getInvitationsCollection().insertOne(document);

  return {
    ...document,
    _id: result.insertedId,
  };
};

const findInvitationByTokenHash = async (tokenHash) => getInvitationsCollection().findOne({ tokenHash });

const findInvitationById = async (invitationId) => getInvitationsCollection().findOne({ _id: new ObjectId(invitationId) });

const findInvitationByWorkspaceAndEmail = async (workspaceId, email) =>
  getInvitationsCollection().findOne({
    workspaceId: new ObjectId(workspaceId),
    email: email.toLowerCase(),
    status: "Pending",
  });

const findPendingInvitationsByEmail = async (email) =>
  getInvitationsCollection()
    .find({ email: email.toLowerCase(), status: "Pending" })
    .sort({ createdAt: -1 })
    .toArray();

const listInvitationsByWorkspace = async (workspaceId, status) => {
  const query = { workspaceId: new ObjectId(workspaceId) };

  if (status) {
    query.status = status;
  }

  return getInvitationsCollection().find(query).sort({ createdAt: -1 }).toArray();
};

const updateInvitationByTokenHash = async (tokenHash, updateDocument) =>
  getInvitationsCollection().findOneAndUpdate({ tokenHash }, { $set: updateDocument }, { returnDocument: "after" });

const updateInvitationById = async (invitationId, updateDocument) =>
  getInvitationsCollection().findOneAndUpdate({ _id: new ObjectId(invitationId) }, { $set: updateDocument }, { returnDocument: "after" });

const expirePendingInvitations = async () => {
  const now = new Date();
  await getInvitationsCollection().updateMany(
    { status: "Pending", expiresAt: { $lt: now } },
    { $set: { status: "Expired", respondedAt: now, updatedAt: now } }
  );
};

export {
  COLLECTION_NAME,
  ensureInvitationIndexes,
  sanitizeInvitation,
  createInvitationDocument,
  findInvitationByTokenHash,
  findInvitationById,
  findInvitationByWorkspaceAndEmail,
  findPendingInvitationsByEmail,
  listInvitationsByWorkspace,
  updateInvitationByTokenHash,
  updateInvitationById,
  expirePendingInvitations,
};

export default {
  COLLECTION_NAME,
  ensureInvitationIndexes,
  sanitizeInvitation,
  createInvitationDocument,
  findInvitationByTokenHash,
  findInvitationById,
  findInvitationByWorkspaceAndEmail,
  findPendingInvitationsByEmail,
  listInvitationsByWorkspace,
  updateInvitationByTokenHash,
  updateInvitationById,
  expirePendingInvitations,
};