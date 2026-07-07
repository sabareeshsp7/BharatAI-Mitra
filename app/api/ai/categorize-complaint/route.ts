import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { ensembleCategorizeComplaint } from "@/lib/ai/ensemble";
import { detectLanguage, translateText } from "@/lib/ai/sarvam";
import { z } from "zod";

const Schema = z.object({
  description: z.string().min(5).max(5000),
  language: z.string().default("en"),
});

// ─── POST /api/ai/categorize-complaint ────────────────────────────────────────
// Standalone ensemble categorization endpoint (Gemini + Azure cross-validation)
// Can be used independently to preview AI categorization before form submission

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const validation = Schema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { description, language } = validation.data;

    // ── Detect and translate ──────────────────────────────────────────────────
    let englishDescription = description;
    let detectedLanguage = "en";

    try {
      const detected = await detectLanguage(description);
      detectedLanguage = detected.split("-")[0];

      if (detectedLanguage !== "en") {
        const translation = await translateText(description, detectedLanguage, "en");
        englishDescription = translation.translatedText;
      }
    } catch (err) {
      console.warn("Language processing failed:", err);
    }

    // ── Ensemble categorization ───────────────────────────────────────────────
    const ensembleResult = await ensembleCategorizeComplaint(englishDescription);

    // ── Translate formal description back if needed ───────────────────────────
    let translatedFormalDescription = ensembleResult.result.formalDescription;
    if (language !== "en" && language !== detectedLanguage) {
      try {
        const translated = await translateText(
          ensembleResult.result.formalDescription,
          "en",
          language
        );
        translatedFormalDescription = translated.translatedText;
      } catch {
        // keep English version
      }
    }

    return NextResponse.json({
      analysis: {
        ...ensembleResult.result,
        formalDescriptionTranslated: translatedFormalDescription,
      },
      ensemble: {
        confidence: ensembleResult.confidence,
        agreedBy: ensembleResult.agreedBy,
        arbitratedBy: ensembleResult.arbitratedBy,
        geminiCategory: ensembleResult.geminiOutput?.category,
        azureCategory: ensembleResult.azureOutput?.category,
        modelsAgreed: ensembleResult.agreedBy.length > 1,
      },
      detectedLanguage,
      processedInEnglish: detectedLanguage !== "en",
    });
  } catch (err) {
    console.error("Categorization error:", err);
    return NextResponse.json(
      { error: "Failed to categorize complaint", message: (err as Error).message },
      { status: 500 }
    );
  }
}
