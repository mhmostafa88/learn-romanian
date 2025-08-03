import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { generateRomanianResponse } from "~/lib/openai";
import type { ChatMessage } from "~/types/chat";

export const chatRouter = createTRPCRouter({
  sendMessage: publicProcedure
    .input(z.object({
      message: z.string().min(1),
      conversation: z.array(z.object({
        id: z.string(),
        role: z.enum(['user', 'assistant']),
        content: z.string(),
        timestamp: z.date(),
      })),
    }))
    .mutation(async ({ input }) => {
      try {
        // Add user message to conversation
        const userMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'user',
          content: input.message,
          timestamp: new Date(),
        };

        const conversationWithUserMessage = [...input.conversation, userMessage];

        // Generate Romanian tutor response
        const botResponse = await generateRomanianResponse(conversationWithUserMessage);

        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: botResponse,
          timestamp: new Date(),
        };

        return {
          success: true,
          userMessage,
          assistantMessage,
        };
      } catch (error) {
        console.error('Chat error:', error);
        return {
          success: false,
          error: 'Failed to process message. Please try again.',
        };
      }
    }),

  getGreeting: publicProcedure
    .query(() => {
      // Initial greeting from the Romanian tutor
      return {
        id: crypto.randomUUID(),
        role: 'assistant' as const,
        content: 'Bună! Sunt profesorul tău de română. Cum te numești?',
        timestamp: new Date(),
      };
    }),
}); 