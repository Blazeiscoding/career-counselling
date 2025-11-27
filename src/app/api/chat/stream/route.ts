
import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { db } from "@/server/db";
import { MESSAGE_CONSTANTS } from "@/lib/constants";

const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { 
        status: 401,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  if (!genAI) {
    return new Response(
      JSON.stringify({ error: "GEMINI_API_KEY is not configured" }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  try {
    const body = await req.json();
    const { sessionId, content } = body as { sessionId: string; content: string };

    const trimmedContent = content?.trim() ?? "";
    
    if (!sessionId || !trimmedContent) {
      return new Response(
        JSON.stringify({ error: "Invalid payload: sessionId and content are required" }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    if (trimmedContent.length > MESSAGE_CONSTANTS.MAX_CONTENT_LENGTH) {
      return new Response(
        JSON.stringify({ 
          error: `Message content exceeds maximum length of ${MESSAGE_CONSTANTS.MAX_CONTENT_LENGTH} characters` 
        }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Verify session belongs to user
    const chatSession = await db.chatSession.findFirst({
      where: { id: sessionId, userId: session.user.id },
    });
    if (!chatSession) {
      return new Response(
        JSON.stringify({ error: "Chat session not found" }),
        { 
          status: 404,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Save user message
    const userMessage = await db.message.create({
      data: {
        content: trimmedContent,
        role: "USER",
        chatSessionId: sessionId,
      },
    });

    // Load previous messages for context
    const previousMessages = await db.message.findMany({
      where: { chatSessionId: sessionId },
      orderBy: { createdAt: "asc" },
      take: MESSAGE_CONSTANTS.MAX_CONTEXT_MESSAGES,
    });

    // Build system prompt
    const conversationHistory = previousMessages
      .map((m) => `${m.role === "USER" ? "User" : "Assistant"}: ${m.content}`)
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

Current user message: ${trimmedContent}

Please respond as CareerBot, the career counselor:`;

    // Use the same model as configured in chat router
    // Common model names: gemini-1.5-pro, gemini-1.5-flash, gemini-2.0-flash-exp, gemini-pro, gemini-2.5-pro, gemini-2.5-flash
    // You can set GEMINI_MODEL_NAME in .env to override
    const modelName = process.env.GEMINI_MODEL_NAME || "gemini-2.5-flash";
    const model = genAI.getGenerativeModel({ model: modelName });
    let streamingResult;
    try {
      streamingResult = await model.generateContentStream(systemPrompt);
    } catch (genError) {
      console.error("Gemini API error:", genError);
      const errorMsg = genError instanceof Error ? genError.message : "Failed to generate content";
      return new Response(
        JSON.stringify({ error: `AI service error: ${errorMsg}` }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

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
          } catch (_dbError) {
            console.error("Failed to save fallback message to database:", _dbError);
            // Continue - we've already sent the fallback message to the client
          }
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
    console.error("Stream API error:", e);
    const errorMessage = e instanceof Error ? e.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
