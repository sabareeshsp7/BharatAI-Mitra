import { NextRequest, NextResponse } from "next/server";
import { textToSpeech } from "@/lib/ai/sarvam";
import { z } from "zod";
import type { SupportedLanguage } from "@/lib/ai/types";

const Schema = z.object({
  text: z.string().min(1, "Text is required").max(500, "Text too long for TTS (max 500 chars)"),
  language: z.string().default("hi"),
  speaker: z.string().optional(),
});

// ─── POST /api/voice/text-to-speech ──────────────────────────────────────────
// Sarvam Bulbul model — natural Indian language speech synthesis
// Returns base64-encoded WAV audio

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = Schema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { text, language, speaker } = validation.data;

    const result = await textToSpeech(
      text,
      language as SupportedLanguage,
      speaker || "meera"
    );

    return NextResponse.json({
      audioBase64: result.audioBase64,
      mimeType: result.mimeType,
      language: result.language,
      model: "bulbul:v1",
      textLength: text.length,
    });
  } catch (err) {
    console.error("Text-to-speech error:", err);
    return NextResponse.json(
      { error: "Speech synthesis failed", message: (err as Error).message },
      { status: 500 }
    );
  }
}
