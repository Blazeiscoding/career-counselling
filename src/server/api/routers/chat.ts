import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const chatRouter = createTRPCRouter({
  // Create a new chat session
  createSession: protectedProcedure
    .input(
      z.object({
        title: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.chatSession.create({
        data: {
          title: input.title || "New Career Chat",
          userId: ctx.session.user.id,
        },
      });
    }),

  // Get all chat sessions for the user
  getSessions: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      const sessions = await ctx.db.chatSession.findMany({
        where: { userId: ctx.session.user.id },
        orderBy: { updatedAt: "desc" },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
          },
          _count: {
            select: { messages: true },
          },
        },
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (sessions.length > input.limit) {
        const nextItem = sessions.pop();
        nextCursor = nextItem!.id;
      }

      return {
        sessions,
        nextCursor,
      };
    }),

  // Get messages for a specific chat session
  getMessages: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify session belongs to user
      const session = await ctx.db.chatSession.findFirst({
        where: {
          id: input.sessionId,
          userId: ctx.session.user.id,
        },
      });

      if (!session) {
        throw new Error("Chat session not found");
      }

      const messages = await ctx.db.message.findMany({
        where: { chatSessionId: input.sessionId },
        orderBy: { createdAt: "asc" },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (messages.length > input.limit) {
        const nextItem = messages.pop();
        nextCursor = nextItem!.id;
      }

      return {
        messages,
        nextCursor,
      };
    }),

  // Send a message and get AI response
  sendMessage: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify session belongs to user
      const session = await ctx.db.chatSession.findFirst({
        where: {
          id: input.sessionId,
          userId: ctx.session.user.id,
        },
      });

      if (!session) {
        throw new Error("Chat session not found");
      }

      // Save user message
      const userMessage = await ctx.db.message.create({
        data: {
          content: input.content,
          role: "USER",
          chatSessionId: input.sessionId,
        },
      });

      // Get previous messages for context
      const previousMessages = await ctx.db.message.findMany({
        where: { chatSessionId: input.sessionId },
        orderBy: { createdAt: "asc" },
        take: 20, // Last 20 messages for context
      });

      try {
        // Initialize Gemini model - use GEMINI_MODEL_NAME env var or default
        const modelName = process.env.GEMINI_MODEL_NAME || "gemini-2.5-flash";
        const model = genAI.getGenerativeModel({ model: modelName });

        // Prepare conversation history for Gemini
        const conversationHistory = previousMessages
          .map(
            (msg) =>
              `${msg.role === "USER" ? "User" : "Assistant"}: ${msg.content}`
          )
          .join("\n");

        // Create the prompt with system instructions and conversation context
        const systemPrompt = `You are an experienced career counselor named CareerBot. You provide thoughtful, personalized career advice based on the user's situation, interests, skills, and goals. 

Your responsibilities:
- Provide actionable career guidance and advice
- Ask clarifying questions when you need more information
- Be supportive, professional, and encouraging
- Be realistic about career prospects and challenges
- Help with resume advice, interview preparation, career transitions, and professional development
- Suggest specific resources, skills to develop, or next steps when appropriate

Guidelines:
- Keep responses conversational and friendly but professional
- Provide specific, actionable advice rather than generic statements
- If you need more information to give good advice, ask targeted questions
- Be encouraging while being honest about challenges

Previous conversation:
${conversationHistory}

Current user message: ${input.content}

Please respond as CareerBot, the career counselor:`;

        // Generate response using Gemini
        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        const aiResponse = response.text();

        // Save AI response
        const assistantMessage = await ctx.db.message.create({
          data: {
            content:
              aiResponse ||
              "I apologize, but I'm having trouble generating a response right now. Please try again.",
            role: "ASSISTANT",
            chatSessionId: input.sessionId,
          },
        });

        // Update session timestamp
        await ctx.db.chatSession.update({
          where: { id: input.sessionId },
          data: { updatedAt: new Date() },
        });

        return {
          userMessage,
          assistantMessage,
        };
      } catch (error) {
        console.error("Gemini AI error:", error);

        // Save fallback AI response
        const fallbackMessage = await ctx.db.message.create({
          data: {
            content:
              "I'm having trouble connecting to my knowledge base right now. Please try again in a moment, and I'll be happy to help with your career questions!",
            role: "ASSISTANT",
            chatSessionId: input.sessionId,
          },
        });

        return {
          userMessage,
          assistantMessage: fallbackMessage,
        };
      }
    }),

  // Update session title
  updateSessionTitle: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        title: z.string().min(1).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.chatSession.update({
        where: {
          id: input.sessionId,
          userId: ctx.session.user.id,
        },
        data: {
          title: input.title,
        },
      });
    }),

  // Delete a chat session
  deleteSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.chatSession.delete({
        where: {
          id: input.sessionId,
          userId: ctx.session.user.id,
        },
      });
    }),
});
