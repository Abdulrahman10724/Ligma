import { z } from "zod";

import { buildStableJobId } from "./job.utils.js";

const classificationJobSchema = z.object({
  workspaceId: z.string().regex(/^[a-f0-9]{24}$/i, "Workspace ID is invalid"),
  nodeId: z.string().regex(/^[a-f0-9]{24}$/i, "Node ID is invalid"),
  actorId: z.string().regex(/^[a-f0-9]{24}$/i, "User ID is invalid"),
  nodeUpdatedAt: z.string().datetime().optional().nullable(),
});

const buildClassificationJobId = ({ workspaceId, nodeId, nodeUpdatedAt }) =>
  buildStableJobId("classify", workspaceId, nodeId, nodeUpdatedAt || "latest");

export { classificationJobSchema, buildClassificationJobId };

export default { classificationJobSchema, buildClassificationJobId };