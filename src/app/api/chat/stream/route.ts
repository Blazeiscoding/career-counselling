/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { db } from "@/server/db";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { sessionId, content } = body as { sessionId: string; content: string };

    if (!sessionId || !content || !content.trim()) {
      return new Response("Invalid payload", { status: 400 });
    }

    // Verify session belongs to user
    const chatSession = await db.chatSession.findFirst({
      where: { id: sessionId, userId: session.user.id },
    });
    if (!chatSession) {
      return new Response("Chat session not found", { status: 404 });
    }

    // Save user message
    const userMessage = await db.message.create({
      data: {
        content: content.trim(),
        role: "USER",
        chatSessionId: sessionId,
      },
    });

    // Load previous messages for context
    const previousMessages = await db.message.findMany({
      where: { chatSessionId: sessionId },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    // Build system prompt
    const conversationHistory = previousMessages
      .map((m: any) => `${m.role === "USER" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");

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

Current user message: ${content}

Please respond as CareerBot, the career counselor:`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const streamingResult = await model.generateContentStream(systemPrompt);

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    let fullText = "";

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of streamingResult.stream) {
            const text = chunk.text();
            fullText += text;
            controller.enqueue(encoder.encode(text));
          }

          // Save assistant message when stream completes
          await db.message.create({
            data: {
              content:
                fullText ||
                "I apologize, but I'm having trouble generating a response right now. Please try again.",
              role: "ASSISTANT",
              chatSessionId: sessionId,
            },
          });

          await db.chatSession.update({
            where: { id: sessionId },
            data: { updatedAt: new Date() },
          });

          controller.close();
        } catch (err) {
          // On error, send a minimal message then close
          const fallback =
            "I'm having trouble connecting to my knowledge base right now. Please try again in a moment, and I'll be happy to help with your career questions!";
          if (!fullText) {
            controller.enqueue(encoder.encode(fallback));
          }
          try {
            await db.message.create({
              data: {
                content: fullText || fallback,
                role: "ASSISTANT",
                chatSessionId: sessionId,
              },
            });
          } catch {}
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no", // for some proxies
      },
    });
  } catch (e) {
    return new Response("Bad Request", { status: 400 });
  }
}
