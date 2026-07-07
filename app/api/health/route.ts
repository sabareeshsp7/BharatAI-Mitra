import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { azureHealthCheck } from "@/lib/ai/azure";

// ─── GET /api/health ──────────────────────────────────────────────────────────
// Verify all services are reachable with real credentials

export async function GET() {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  };

  // ── MongoDB ──────────────────────────────────────────────────────────────────
  try {
    const start = Date.now();
    await connectDB();
    results.mongodb = { ok: true, latencyMs: Date.now() - start, uri: "connected" };
  } catch (err) {
    results.mongodb = { ok: false, error: (err as Error).message };
  }

  // ── Azure o4-mini ─────────────────────────────────────────────────────────
  try {
    const check = await azureHealthCheck();
    results.azure = check;
  } catch (err) {
    results.azure = { ok: false, error: (err as Error).message };
  }

  // ── Gemini ───────────────────────────────────────────────────────────────────
  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not set");
    const start = Date.now();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent("Reply with exactly: OK");
    results.gemini = {
      ok: true,
      response: result.response.text().trim().substring(0, 20),
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    results.gemini = { ok: false, error: (err as Error).message };
  }

  // ── Sarvam AI ─────────────────────────────────────────────────────────────
  try {
    const start = Date.now();
    const key = process.env.SARVAM_API_KEY;
    if (!key) throw new Error("SARVAM_API_KEY not set");
    // Use translate endpoint — detect-language endpoint may require different subscription tier
    const res = await fetch("https://api.sarvam.ai/translate", {
      method: "POST",
      headers: { "api-subscription-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        input: "Hello",
        source_language_code: "en-IN",
        target_language_code: "hi-IN",
        speaker_gender: "Female",
        mode: "formal",
        model: "mayura:v1",
        enable_preprocessing: false,
      }),
    });
    const data = await res.json();
    results.sarvam = {
      ok: res.ok,
      translatedSample: data.translated_text?.substring(0, 30) || data,
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    results.sarvam = { ok: false, error: (err as Error).message };
  }

  // Overall status
  const allOk = ["mongodb", "azure", "gemini", "sarvam"].every(
    (k) => (results[k] as { ok: boolean })?.ok === true
  );

  return NextResponse.json(
    { status: allOk ? "all_systems_go" : "degraded", services: results },
    { status: allOk ? 200 : 207 }
  );
}
