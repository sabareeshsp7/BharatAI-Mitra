import { NextRequest, NextResponse } from "next/server";
import { translateText, detectLanguage } from "@/lib/ai/sarvam";
import { TranslationSchema } from "@/lib/validations";

// ─── POST /api/ai/translate ───────────────────────────────────────────────────
// Sarvam Mayura translation — 22 Indian languages

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = TranslationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { text, sourceLang, targetLang } = validation.data;

    // Auto-detect source language if not specified or set to "auto"
    let resolvedSourceLang = sourceLang;
    if (!sourceLang || sourceLang === "auto") {
      const detected = await detectLanguage(text);
      resolvedSourceLang = detected.split("-")[0];
    }

    const result = await translateText(text, resolvedSourceLang, targetLang);

    return NextResponse.json({
      translatedText: result.translatedText,
      sourceLanguage: result.sourceLanguage,
      targetLanguage: result.targetLanguage,
      model: result.model,
      detectedSourceLang: resolvedSourceLang,
    });
  } catch (err) {
    console.error("Translation error:", err);
    return NextResponse.json(
      { error: "Translation failed", message: (err as Error).message },
      { status: 500 }
    );
  }
}
