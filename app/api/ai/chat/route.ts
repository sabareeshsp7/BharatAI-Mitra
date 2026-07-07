import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Conversation } from "@/models/Conversation.model";
import { Session } from "@/models/Session.model";
import { azureStreamChat } from "@/lib/ai/azure";
import { detectLanguage, translateText } from "@/lib/ai/sarvam";
import { ChatRequestSchema } from "@/lib/validations";
import type { ChatMessage, SessionProfile } from "@/lib/ai/types";

// ─── POST /api/ai/chat ─────────────────────────────────────────────────────────
// Streaming civic chat with multilingual support
// Uses: Gemini Flash (primary) + Sarvam AI (language detection + translation)

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // ── Validate input ────────────────────────────────────────────────────────
    const body = await req.json();
    const validation = ChatRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { message, sessionId, conversationId, language } = validation.data;

    // ── Get or create session ─────────────────────────────────────────────────
    let session = await Session.findOne({ sessionId });
    if (!session) {
      session = await Session.create({
        sessionId,
        profile: { preferredLanguage: language },
      });
    } else {
      await Session.updateOne({ sessionId }, { lastActiveAt: new Date() });
    }

    const profile: SessionProfile = {
      preferredLanguage: (session.profile.preferredLanguage || "en") as "en",
      state: session.profile.state,
      district: session.profile.district,
      age: session.profile.age,
      category: session.profile.category as "general",
      income: session.profile.income,
    };

    // ── Language detection and translation ────────────────────────────────────
    let processedMessage = message;
    let detectedLanguage = "en";
    let wasTranslated = false;

    try {
      const detected = await detectLanguage(message);
      detectedLanguage = detected.split("-")[0]; // "hi-IN" → "hi"

      if (detectedLanguage !== "en") {
        const translation = await translateText(message, detectedLanguage, "en");
        processedMessage = translation.translatedText;
        wasTranslated = true;
      }
    } catch (err) {
      console.warn("Language detection/translation failed, proceeding in English:", err);
    }

    // ── Load conversation history ──────────────────────────────────────────────
    const hasConversationId = conversationId && conversationId !== "null" && conversationId !== "undefined";
    let conversation = hasConversationId
      ? await Conversation.findById(conversationId)
      : await Conversation.findOne({ sessionId }).sort({ updatedAt: -1 });

    if (!conversation) {
      conversation = await Conversation.create({ sessionId, messages: [] });
    }

    // Build messages array for Gemini (last 20 messages for context window)
    const historyMessages: ChatMessage[] = conversation.messages
      .slice(-20)
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    // Add current user message (in English for AI processing)
    const allMessages: ChatMessage[] = [
      ...historyMessages,
      { role: "user", content: processedMessage },
    ];

    const conversationIdStr = String(conversation._id);

    // ── Stream response from Azure OpenAI (o4-mini reasoning model) ─────────────
    let aiStream: ReadableStream<Uint8Array>;
    const activeModel = "azure-o4-mini";

    try {
      aiStream = await azureStreamChat(processedMessage, historyMessages, language);
    } catch (err) {
      console.error("Azure OpenAI stream failed:", err);
      throw err;
    }

    // ── Save user message to DB ───────────────────────────────────────────────
    conversation.messages.push({
      role: "user",
      content: message,                // Save original language
      originalLanguage: detectedLanguage,
      translatedContent: wasTranslated ? processedMessage : undefined,
      model: activeModel,
      timestamp: new Date(),
    });
    await conversation.save();

    // ── Collect full response for saving to DB ────────────────────────────────
    const encoder = new TextEncoder();

    let fullResponse = "";

    const responseStream = new ReadableStream({
      async start(controller) {
        const reader = aiStream.getReader();

        // Stream initial metadata
        const metadata = JSON.stringify({
          type: "metadata",
          conversationId: conversationIdStr,
          detectedLanguage,
          wasTranslated,
          model: activeModel,
        });
        controller.enqueue(encoder.encode(`data: ${metadata}\n\n`));

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = new TextDecoder().decode(value);
            fullResponse += chunk;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "text", content: chunk })}\n\n`)
            );
          }

          // Save assistant response to conversation (already in user's selected language)
          await Conversation.findByIdAndUpdate(conversation!._id, {
            $push: {
              messages: {
                role: "assistant",
                content: fullResponse,
                originalLanguage: language,
                model: activeModel,
                timestamp: new Date(),
              },
            },
          });

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done", conversationId: conversationIdStr })}\n\n`));
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(responseStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Conversation-Id": String(conversation!._id),
      },
    });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      { error: "Internal server error", message: (err as Error).message },
      { status: 500 }
    );
  }
}

// ─── GET /api/ai/chat?conversationId=xxx ──────────────────────────────────────
// Retrieve conversation history

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");
    const sessionId = searchParams.get("sessionId");

    if (!conversationId && !sessionId) {
      return NextResponse.json(
        { error: "conversationId or sessionId required" },
        { status: 400 }
      );
    }

    const query = conversationId ? { _id: conversationId } : { sessionId };
    const conversations = await Conversation.find(query)
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();

    return NextResponse.json({ conversations });
  } catch (err) {
    console.error("Chat history error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
