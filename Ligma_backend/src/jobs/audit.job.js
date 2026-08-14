import { z } from "zod";

import { EVENT_TYPES } from "../utils/event-types.util.js";

const auditEventJobSchema = z.object({
  workspaceId: z.string().regex(/^[a-f0-9]{24}$/i, "Workspace ID is invalid"),
  userId: z.string().regex(/^[a-f0-9]{24}$/i, "User ID is invalid"),
  eventType: z.enum(Object.values(EVENT_TYPES)),
  nodeId: z.string().regex(/^[a-f0-9]{24}$/i).nullable().optional(),
  taskId: z.string().regex(/^[a-f0-9]{24}$/i).nullable().optional(),
  payload: z.record(z.unknown()).default({}),
});

export { auditEventJobSchema };

export default { auditEventJobSchema };