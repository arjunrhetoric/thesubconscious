import { z } from "zod";

export const createPageSchema = z.object({
  title: z.string().optional().default("Untitled"),
  content: z.any().optional().default(null),
  parentId: z.string().nullable().optional().default(null),
});

export const updatePageSchema = z.object({
  title: z.string().optional(),
  content: z.any().optional(),
  parentId: z.string().nullable().optional(),
  order: z.number().optional(),
});

export const sharePageSchema = z.object({
  isPublic: z.boolean(),
  includeSubpages: z.boolean().optional().default(false),
});

export const updateTagSchema = z.object({
  name: z.string().min(1, "Tag name is required"),
  action: z.enum(["accept", "reject"], {
    required_error: "Action must be 'accept' or 'reject'",
  }),
});

export type CreatePageInput = z.infer<typeof createPageSchema>;
export type UpdatePageInput = z.infer<typeof updatePageSchema>;
export type SharePageInput = z.infer<typeof sharePageSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
