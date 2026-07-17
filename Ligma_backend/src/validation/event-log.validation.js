import { z } from "zod";

import { VALID_EVENT_TYPES } from "../models/event-log.model.js";

const workspaceIdParam = z.string().regex(/^[a-f0-9]{24}$/i, "Workspace ID is invalid");
const nodeIdParam = z.string().regex(/^[a-f0-9]{24}$/i).nullable().optional();
const taskIdParam = z.string().regex(/^[a-f0-9]{24}$/i).nullable().optional();

const eventPayloadSchema = z.record(z.unknown()).default({});

const createEventLogSchema = z.object({
  body: z.object({
    workspaceId: workspaceIdParam,
    nodeId: nodeIdParam,
    taskId: taskIdParam,
    userId: z.string().regex(/^[a-f0-9]{24}$/i, "User ID is invalid"),
    eventType: z.enum(VALID_EVENT_TYPES, {
      required_error: "Event type is required",
      invalid_type_error: "Invalid event type",
    }),
    payload: eventPayloadSchema,
    createdAt: z.string().datetime().optional(),
  }),
});

const listEventLogsSchema = z.object({
  params: z.object({
    workspaceId: workspaceIdParam,
  }),
  query: z.object({
    limit: z.coerce.number().min(1).max(500).optional(),
  }).optional(),
});

export { createEventLogSchema, listEventLogsSchema };

export default { createEventLogSchema, listEventLogsSchema };