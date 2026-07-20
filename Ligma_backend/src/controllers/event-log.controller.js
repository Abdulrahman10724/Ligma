import { listEventLogsByWorkspace, sanitizeEventLog } from "../models/event-log.model.js";
import { getWorkspace } from "../services/workspace.service.js";
import { sanitizeUser } from "../models/user.model.js";
import { getCollection } from "../config/db.config.js";
import { ObjectId } from "mongodb";
import { sendSuccess } from "../utils/api-response.util.js";

// ponytail: check workspace access, then fetch events and batch-populate user details in one query
export const getWorkspaceEventsHandler = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 100;

    // Check workspace access (will throw 404/403 if not authorized)
    await getWorkspace(workspaceId, req.user.id);

    // Fetch events from database
    const rawEvents = await listEventLogsByWorkspace(workspaceId, limit);
    const sanitizedEvents = rawEvents.map(sanitizeEventLog);

    // Batch-populate user details
    const userIds = [...new Set(sanitizedEvents.map((e) => e.userId))].filter(Boolean);
    const userMap = new Map();

    if (userIds.length > 0) {
      const usersCol = getCollection("users");
      const users = await usersCol
        .find({ _id: { $in: userIds.map((id) => new ObjectId(id)) } })
        .toArray();
      users.forEach((u) => {
        userMap.set(u._id.toString(), sanitizeUser(u));
      });
    }

    const events = sanitizedEvents.map((event) => ({
      ...event,
      user: userMap.get(event.userId) || { name: "Unknown User", email: "" },
    }));

    return sendSuccess(res, 200, "Workspace events retrieved successfully", { events });
  } catch (error) {
    return next(error);
  }
};

export default {
  getWorkspaceEventsHandler,
};
