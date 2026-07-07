import { z } from "zod";

const titleSchema = z.string().trim().min(2, "Workspace name must be at least 2 characters long").max(120, "Workspace name must be 120 characters or less");
const descriptionSchema = z.string().trim().max(500, "Description must be 500 characters or less").optional().or(z.literal(""));
const workspaceIdSchemaValue = z.string().regex(/^[a-f0-9]{24}$/i, "Workspace ID is invalid");

const createWorkspaceSchema = z.object({
  body: z.object({
    title: titleSchema,
    description: descriptionSchema.default(""),
  }),
});

const updateWorkspaceSchema = z.object({
  body: z.object({
    title: titleSchema.optional(),
    description: descriptionSchema,
  }),
  params: z.object({
    workspaceId: workspaceIdSchemaValue,
  }),
});

const workspaceIdSchema = z.object({
  params: z.object({
    workspaceId: workspaceIdSchemaValue,
  }),
});

export { createWorkspaceSchema, updateWorkspaceSchema, workspaceIdSchema };

export default {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  workspaceIdSchema,
};