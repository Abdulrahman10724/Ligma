import { z } from "zod";

import { buildStableJobId } from "./job.utils.js";

const verificationEmailJobSchema = z.object({
  type: z.literal("verification"),
  to: z.string().email(),
  name: z.string().optional().default(""),
  token: z.string().min(1),
  userId: z.string().regex(/^[a-f0-9]{24}$/i, "User ID is invalid").optional().nullable(),
});

const invitationEmailJobSchema = z.object({
  type: z.literal("invitation"),
  to: z.string().email(),
  inviterName: z.string().optional().default(""),
  workspaceTitle: z.string().min(1),
  role: z.string().min(1),
  inviteLink: z.string().url(),
  invitationId: z.string().regex(/^[a-f0-9]{24}$/i, "Invitation ID is invalid"),
});

const emailJobSchema = z.discriminatedUnion("type", [verificationEmailJobSchema, invitationEmailJobSchema]);

const buildEmailJobId = (job) => {
  if (job.type === "verification") {
    return buildStableJobId("verification-email", job.userId || job.to, job.token);
  }

  return buildStableJobId("invitation-email", job.invitationId);
};

export { verificationEmailJobSchema, invitationEmailJobSchema, emailJobSchema, buildEmailJobId };

export default { verificationEmailJobSchema, invitationEmailJobSchema, emailJobSchema, buildEmailJobId };