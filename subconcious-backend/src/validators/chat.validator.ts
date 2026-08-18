import { z } from "zod";

export const chatSchema = z.object({
  message: z.string().min(1, "Message is required"),
  scope: z.union([z.literal("all"), z.string()]).optional().default("all"),
});

export type ChatInput = z.infer<typeof chatSchema>;
