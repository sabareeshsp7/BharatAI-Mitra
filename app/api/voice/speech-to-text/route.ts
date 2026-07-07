import { NextRequest, NextResponse } from "next/server";
import { speechToText, speechToTextAndTranslate } from "@/lib/ai/sarvam";

// ─── POST /api/voice/speech-to-text ──────────────────────────────────────────
// Sarvam Saaras model — transcribes audio with Indian language support
// Accepts multipart/form-data with 'audio' file field

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Request must be multipart/form-data with an 'audio' field" },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const languageHint = formData.get("language") as string | null;
    const translateToEnglish = formData.get("translateToEnglish") === "true";

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided. Include 'audio' field in form data" },
        { status: 400 }
      );
    }

    // Validate file type and size
    const allowedTypes = ["audio/wav", "audio/mpeg", "audio/mp3", "audio/webm", "audio/ogg"];
    if (!allowedTypes.includes(audioFile.type) && !audioFile.type.startsWith("audio/")) {
      return NextResponse.json(
        { error: `Unsupported audio type: ${audioFile.type}. Supported: WAV, MP3, WebM, OGG` },
        { status: 400 }
      );
    }

    const maxSizeMB = 10;
    if (audioFile.size > maxSizeMB * 1024 * 1024) {
      return NextResponse.json(
        { error: `Audio file too large. Maximum size: ${maxSizeMB}MB` },
        { status: 400 }
      );
    }

    const audioBuffer = await audioFile.arrayBuffer();

    if (translateToEnglish) {
      // Use Sarvam's combined STT + translate endpoint
      const result = await speechToTextAndTranslate(audioBuffer, audioFile.name);
      return NextResponse.json({
        transcript: result.englishText,
        detectedLanguage: result.detectedLanguage,
        translatedToEnglish: true,
        model: "saaras:v2",
      });
    } else {
      // Standard STT — returns transcript in detected language
      const result = await speechToText(audioBuffer, languageHint || undefined, audioFile.name);
      return NextResponse.json({
        transcript: result.transcript,
        detectedLanguage: result.detectedLanguage,
        confidence: result.confidence,
        translatedToEnglish: false,
        model: "saaras:v2",
      });
    }
  } catch (err) {
    console.error("Speech-to-text error:", err);
    return NextResponse.json(
      { error: "Speech recognition failed", message: (err as Error).message },
      { status: 500 }
    );
  }
}
