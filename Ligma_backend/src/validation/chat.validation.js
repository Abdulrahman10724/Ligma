import { z } from "zod";

const workspaceIdSchema = z.string().regex(/^[a-f0-9]{24}$/i, "Workspace ID is invalid");
const channelIdSchema = z.string().regex(/^[a-f0-9]{24}$/i, "Channel ID is invalid");
const messageIdSchema = z.string().regex(/^[a-f0-9]{24}$/i, "Message ID is invalid");

const baseChannel = {
  name: z
    .string()
    .trim()
    .min(1, "Channel name is required")
    .max(40, "Channel name must be 40 characters or less")
    .regex(/^[A-Za-z0-9-_ ]+$/, "Channel name can only contain letters, numbers, dashes, underscores, and spaces"),
  description: z.string().max(300, "Description is too long").optional(),
  visibility: z.enum(["public", "private"]).optional().default("public"),
};

const createChannelSchema = z.object({
  params: z.object({ workspaceId: workspaceIdSchema }),
  body: z.object(baseChannel),
});

const channelIdParamSchema = z.object({
  params: z.object({ workspaceId: workspaceIdSchema, channelId: channelIdSchema }),
});

const listMessagesSchema = z.object({
  params: z.object({ workspaceId: workspaceIdSchema, channelId: channelIdSchema }),
  query: z.object({
    limit: z.coerce.number().int().min(1).max(200).optional(),
    before: z.string().datetime().optional(),
  }),
});

const createMessageSchema = z.object({
  params: z.object({ workspaceId: workspaceIdSchema, channelId: channelIdSchema }),
  body: z.object({
    content: z.string().min(1, "Message cannot be empty").max(4000, "Message is too long"),
    mentions: z.array(z.string().regex(/^[a-f0-9]{24}$/i)).max(32).optional(),
    nodeRefs: z
      .array(
        z.object({
          nodeId: z.string().regex(/^[a-f0-9]{24}$/i),
          label: z.string().max(120).optional(),
        })
      )
      .max(16)
      .optional(),
    parentMessageId: z.string().regex(/^[a-f0-9]{24}$/i).optional().nullable(),
  }),
});

const updateMessageSchema = z.object({
  params: z.object({
    workspaceId: workspaceIdSchema,
    channelId: channelIdSchema,
    messageId: messageIdSchema,
  }),
  body: z.object({
    content: z.string().min(1).max(4000),
  }),
});

const deleteMessageSchema = z.object({
  params: z.object({
    workspaceId: workspaceIdSchema,
    channelId: channelIdSchema,
    messageId: messageIdSchema,
  }),
});

export {
  createChannelSchema,
  channelIdParamSchema,
  listMessagesSchema,
  createMessageSchema,
  updateMessageSchema,
  deleteMessageSchema,
};

export default {
  createChannelSchema,
  channelIdParamSchema,
  listMessagesSchema,
  createMessageSchema,
  updateMessageSchema,
  deleteMessageSchema,
};
