import { z } from "zod";

const workspaceIdSchema = z.object({
  params: z.object({
    workspaceId: z.string().regex(/^[a-f0-9]{24}$/i, "Workspace ID is invalid"),
  }),
});

const tokenSchema = z.object({
  params: z.object({
    token: z.string().min(20, "Invitation token is invalid"),
  }),
});

const createInvitationSchema = z.object({
  body: z.object({
    email: z.string().trim().email("Please provide a valid email address").max(255, "Email must be 255 characters or less"),
    role: z.enum(["Contributor", "Viewer"]),
  }),
});

const createWorkspaceInvitationSchema = z.object({
  params: workspaceIdSchema.shape.params,
  body: createInvitationSchema.shape.body,
});

const revokeWorkspaceInvitationSchema = z.object({
  params: z.object({
    workspaceId: workspaceIdSchema.shape.params.shape.workspaceId,
    invitationId: z.string().regex(/^[a-f0-9]{24}$/i, "Invitation ID is invalid"),
  }),
});

export { workspaceIdSchema, tokenSchema, createInvitationSchema, createWorkspaceInvitationSchema, revokeWorkspaceInvitationSchema };

export default {
  workspaceIdSchema,
  tokenSchema,
  createInvitationSchema,
  createWorkspaceInvitationSchema,
  revokeWorkspaceInvitationSchema,
};