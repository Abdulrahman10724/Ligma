import { z } from "zod";

const workspaceIdParam = z.string().regex(/^[a-f0-9]{24}$/i, "Workspace ID is invalid");
const userIdParam = z.string().regex(/^[a-f0-9]{24}$/i, "User ID is invalid");

const listMembersSchema = z.object({
  params: z.object({
    workspaceId: workspaceIdParam,
  }),
});

const changeMemberRoleSchema = z.object({
  params: z.object({
    workspaceId: workspaceIdParam,
    userId: userIdParam,
  }),
  body: z.object({
      role: z.enum(["Contributor", "Viewer"], {
        required_error: "Role is required",
        invalid_type_error: "Role must be Contributor or Viewer",
    }),
  }),
});

const removeMemberSchema = z.object({
  params: z.object({
    workspaceId: workspaceIdParam,
    userId: userIdParam,
  }),
});

export { listMembersSchema, changeMemberRoleSchema, removeMemberSchema };

export default { listMembersSchema, changeMemberRoleSchema, removeMemberSchema };
