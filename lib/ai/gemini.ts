import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import {
  CIVIC_SYSTEM_PROMPT,
  COMPLAINT_CATEGORIZATION_PROMPT,
  SERVICE_RECOMMENDATION_PROMPT,
  ARBITRATION_PROMPT,
} from "@/lib/ai/prompts";
import type {
  ChatMessage,
  ComplaintAnalysis,
  ServiceRecommendation,
  SessionProfile,
} from "@/lib/ai/types";

// ─── Gemini Clients — Lazy Initialization ─────────────────────────────────────
// IMPORTANT: Clients are created lazily on first use.
// Throwing at module-load time breaks Next.js static build analysis.

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

let _genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!_genAI) {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY (or GOOGLE_GENERATIVE_AI_API_KEY) is not set in .env.local");
    }
    _genAI = new GoogleGenerativeAI(apiKey);
  }
  return _genAI;
}

function getGeminiFlash() {
  return getGenAI().getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: CIVIC_SYSTEM_PROMPT,
    safetySettings,
    generationConfig: {
      temperature: 0.7,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 2048,
    },
  });
}

function getGeminiPro() {
  return getGenAI().getGenerativeModel({
    model: "gemini-2.0-flash",
    safetySettings,
    generationConfig: {
      temperature: 0.2,
      topP: 0.9,
      maxOutputTokens: 4096,
    },
  });
}


// ─── Retry Helper ─────────────────────────────────────────────────────────────

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, delayMs * Math.pow(2, i)));
    }
  }
  throw new Error("Max retries reached");
}

// ─── Streaming Civic Chat ─────────────────────────────────────────────────────

/**
 * Stream a response from Gemini Flash for civic Q&A.
 * Returns a ReadableStream of text chunks.
 */
export async function streamCivicChat(
  messages: ChatMessage[],
  _profile: SessionProfile
): Promise<ReadableStream<Uint8Array>> {
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const lastMessage = messages[messages.length - 1];

  const chat = getGeminiFlash().startChat({ history });

  const result = await withRetry(() => chat.sendMessageStream(lastMessage.content));

  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}

// ─── Complaint Categorization ─────────────────────────────────────────────────

/**
 * Use Gemini Flash to categorize a complaint.
 * Returns structured ComplaintAnalysis JSON.
 */
export async function geminiCategorizeComplaint(
  description: string
): Promise<ComplaintAnalysis> {
  const prompt = COMPLAINT_CATEGORIZATION_PROMPT(description);

  const result = await withRetry(() =>
    getGeminiFlash().generateContent(prompt)
  );

  const text = result.response.text().trim();
  // Strip any markdown code fences if present
  const cleaned = text.replace(/```json?\n?/gi, "").replace(/```/g, "").trim();

  try {
    return JSON.parse(cleaned) as ComplaintAnalysis;
  } catch {
    throw new Error(`Gemini returned invalid JSON for complaint categorization: ${cleaned.substring(0, 200)}`);
  }
}

// ─── Service Recommendation ───────────────────────────────────────────────────

/**
 * Use Gemini Pro to recommend government schemes based on user profile.
 */
export async function geminiRecommendServices(
  profile: SessionProfile
): Promise<ServiceRecommendation[]> {
  const prompt = SERVICE_RECOMMENDATION_PROMPT(profile);

  const result = await withRetry(() =>
    getGeminiPro().generateContent(prompt)
  );

  const text = result.response.text().trim();
  const cleaned = text.replace(/```json?\n?/gi, "").replace(/```/g, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed as ServiceRecommendation[];
    if (parsed?.recommendations && Array.isArray(parsed.recommendations)) return parsed.recommendations;
    return [];
  } catch {
    throw new Error(`Gemini returned invalid JSON for service recommendation: ${cleaned.substring(0, 200)}`);
  }
}

// ─── Arbitration ──────────────────────────────────────────────────────────────

/**
 * Use Gemini Pro to arbitrate between two conflicting model outputs.
 */
export async function geminiArbitrate(
  description: string,
  optionA: ComplaintAnalysis,
  optionB: ComplaintAnalysis
): Promise<ComplaintAnalysis> {
  const prompt = ARBITRATION_PROMPT(description, optionA, optionB);

  const result = await withRetry(() =>
    getGeminiPro().generateContent(prompt)
  );

  const text = result.response.text().trim();
  const cleaned = text.replace(/```json?\n?/gi, "").replace(/```/g, "").trim();

  try {
    return JSON.parse(cleaned) as ComplaintAnalysis;
  } catch {
    // If arbitration fails, default to Gemini's original answer
    console.warn("Gemini arbitration parse failed, defaulting to optionA");
    return optionA;
  }
}
