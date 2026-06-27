import { z } from "zod";

export const sendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1).max(10000),
  senderType: z.enum(["customer", "agent", "ai_system"]),
  attachmentUrl: z.string().url().or(z.literal("")).optional().nullable(),
});

export const claimConversationSchema = z.object({
  conversationId: z.string().uuid(),
  agentId: z.string().uuid(),
});

export const updateConversationStatusSchema = z.object({
  conversationId: z.string().uuid(),
  status: z.enum(["open", "pending", "closed"]),
});

export const addSOPSchema = z.object({
  title: z.string().min(1).max(500),
  content: z.string().min(1).max(10000),
});
