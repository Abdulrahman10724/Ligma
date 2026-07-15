import { z } from "zod";

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  assigneeId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]).optional().nullable(),
  parentTaskId: z.string().optional().nullable(),
  type: z.enum(["Action", "Decision", "Information", "Reference"]).optional().default("Action"),
  order: z.number().optional(), // ponytail: for manual sort persistence
});

const updateTaskSchema = createTaskSchema.partial();

const statusSchema = z.object({ status: z.enum(["To Do", "In Progress", "Completed"]) });

export { createTaskSchema, updateTaskSchema, statusSchema };

export default { createTaskSchema, updateTaskSchema, statusSchema };
