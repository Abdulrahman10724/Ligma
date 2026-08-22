import { z } from "zod";

import { buildStableJobId } from "./job.utils.js";

const taskPayloadSchema = z.object({
  title: z.string().optional().default("") ,
  description: z.string().optional().default(""),
  type: z.enum(["Action", "Decision", "Information", "Reference"]).optional().default("Action"),
  metadata: z.record(z.unknown()).optional().default({}),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]).nullable().optional(),
  parentTaskId: z.string().nullable().optional(),
  order: z.number().optional(),
});

const taskJobSchema = z.object({
  workspaceId: z.string().regex(/^[a-f0-9]{24}$/i, "Workspace ID is invalid"),
  nodeId: z.string().regex(/^[a-f0-9]{24}$/i, "Node ID is invalid"),
  actorId: z.string().regex(/^[a-f0-9]{24}$/i, "User ID is invalid").nullable(),
  action: z.enum(["upsert", "delete"]),
  nodeUpdatedAt: z.string().datetime().optional().nullable(),
  classification: z.enum(["Action", "Decision", "Information", "Reference"]).nullable().optional(),
  taskData: taskPayloadSchema.optional().default({}),
});

const buildTaskJobId = ({ action, workspaceId, nodeId, nodeUpdatedAt }) =>
  buildStableJobId(action, workspaceId, nodeId, nodeUpdatedAt || "latest");

export { taskPayloadSchema, taskJobSchema, buildTaskJobId };

export default { taskPayloadSchema, taskJobSchema, buildTaskJobId };