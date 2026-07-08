import { z } from "zod";

const workspaceIdParam = z.string().regex(/^[a-f0-9]{24}$/i, "Workspace ID is invalid");
const nodeIdParam = z.string().regex(/^[a-f0-9]{24}$/i, "Node ID is invalid");

const listNodesSchema = z.object({
  params: z.object({
    workspaceId: workspaceIdParam,
  }),
});

const createNodeSchema = z.object({
  params: z.object({
    workspaceId: workspaceIdParam,
  }),
  body: z.object({
    type: z.enum(["sticky", "text", "rectangle", "circle", "arrow"], {
      required_error: "Node type is required",
      invalid_type_error: "Node type must be one of: sticky, text, rectangle, circle, arrow",
    }),
    x: z.number({ required_error: "x position is required" }),
    y: z.number({ required_error: "y position is required" }),
    data: z.record(z.unknown()).optional().default({}),
  }),
});

const updateNodeSchema = z.object({
  params: z.object({
    workspaceId: workspaceIdParam,
    nodeId: nodeIdParam,
  }),
  body: z
    .object({
      x: z.number().optional(),
      y: z.number().optional(),
      data: z.record(z.unknown()).optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: "At least one field must be provided for update",
    }),
});

const deleteNodeSchema = z.object({
  params: z.object({
    workspaceId: workspaceIdParam,
    nodeId: nodeIdParam,
  }),
});

export { listNodesSchema, createNodeSchema, updateNodeSchema, deleteNodeSchema };

export default { listNodesSchema, createNodeSchema, updateNodeSchema, deleteNodeSchema };
