import { z } from "zod";

const workspaceIdSchema = z.string().regex(/^[a-f0-9]{24}$/i, "Workspace ID is invalid");
const zoneIdSchema = z.string().regex(/^[a-f0-9]{24}$/i, "Zone ID is invalid");

const finiteNumber = z.number().refine(Number.isFinite, "Must be a number");

const createZoneSchema = z.object({
  params: z.object({ workspaceId: workspaceIdSchema }),
  body: z.object({
    name: z.string().trim().min(1, "Name is required").max(80, "Name is too long"),
    description: z.string().max(400).optional(),
    color: z.string().regex(/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/, "Invalid hex color").optional(),
    x: finiteNumber.optional(),
    y: finiteNumber.optional(),
    width: finiteNumber.optional(),
    height: finiteNumber.optional(),
        collapsed: z.boolean().optional(),  
  }),
});

const updateZoneSchema = z.object({
  params: z.object({ workspaceId: workspaceIdSchema, zoneId: zoneIdSchema }),
  body: z.object({
    name: z.string().trim().min(1).max(80).optional(),
    description: z.string().max(400).optional(),
    color: z.string().regex(/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/).optional(),
    x: finiteNumber.optional(),
    y: finiteNumber.optional(),
    width: finiteNumber.optional(),
    height: finiteNumber.optional(),
    collapsed: z.boolean().optional(),
  }),
});

const deleteZoneSchema = z.object({
  params: z.object({ workspaceId: workspaceIdSchema, zoneId: zoneIdSchema }),
});

export { createZoneSchema, updateZoneSchema, deleteZoneSchema };

export default { createZoneSchema, updateZoneSchema, deleteZoneSchema };
