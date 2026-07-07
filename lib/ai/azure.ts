import OpenAI from "openai";
import {
  COMPLAINT_CATEGORIZATION_PROMPT,
  DOCUMENT_CHECKLIST_PROMPT,
  COMPLAINT_FORMALIZATION_PROMPT,
  SERVICE_RECOMMENDATION_PROMPT,
} from "@/lib/ai/prompts";
import type {
  ComplaintAnalysis,
  DocumentChecklist,
  ServiceRecommendation,
  SessionProfile,
} from "@/lib/ai/types";

// ─── Azure OpenAI Client (o4-mini deployment) ─────────────────────────────────
// Uses openai SDK pointed at agentseva.openai.azure.com
// Deployment: o4-mini (reasoning model — does NOT support temperature)

const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_API_KEY;
const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2025-01-01-preview";
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "o4-mini";

if (!endpoint || !apiKey) {
  console.warn("⚠️ Azure OpenAI credentials not set — Azure AI features will be unavailable");
}

// The OpenAI SDK with Azure requires the baseURL to point at the deployment.
// Format: {endpoint}/openai/deployments/{deployment}
export const azureClient = new OpenAI({
  apiKey: apiKey || "placeholder",
  baseURL: endpoint
    ? `${endpoint.replace(/\/$/, "")}/openai/deployments/${deployment}`
    : "https://placeholder.openai.azure.com/openai/deployments/o4-mini",
  defaultQuery: { "api-version": apiVersion },
  defaultHeaders: { "api-key": apiKey || "" },
});

// ─── Retry Helper ─────────────────────────────────────────────────────────────

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const error = err as { status?: number; message?: string };
      // Don't retry on auth errors
      if (error?.status === 401 || error?.status === 403) throw err;
      if (i === retries - 1) throw err;
      console.warn(`Azure retry ${i + 1}/${retries}:`, error?.message);
      await new Promise((r) => setTimeout(r, delayMs * Math.pow(2, i)));
    }
  }
  throw new Error("Max retries reached");
}

// ─── Parse JSON Helper ────────────────────────────────────────────────────────

function parseJSON<T>(text: string, context: string): T {
  // Strip markdown code fences if model wraps output
  const cleaned = text
    .replace(/^```json?\s*/gim, "")
    .replace(/^```\s*/gim, "")
    .replace(/```$/gim, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Try to extract JSON from within the text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]) as T;
      } catch { /* fall through */ }
    }
    throw new Error(`Azure o4-mini returned invalid JSON for ${context}: ${cleaned.substring(0, 300)}`);
  }
}

// NOTE: o4-mini is a reasoning model.
// - Does NOT support: temperature, top_p, frequency_penalty, presence_penalty
// - Uses: max_completion_tokens instead of max_tokens
// - Supports: response_format: json_object ✅

// ─── Complaint Categorization ─────────────────────────────────────────────────

/**
 * Azure o4-mini — structured complaint categorization with JSON mode.
 * o4-mini excels at structured reasoning tasks.
 */
export async function azureCategorizeComplaint(
  description: string
): Promise<ComplaintAnalysis> {
  if (!endpoint || !apiKey) {
    throw new Error("Azure OpenAI not configured. Set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY.");
  }

  const prompt = COMPLAINT_CATEGORIZATION_PROMPT(description);

  const response = await withRetry(() =>
    azureClient.chat.completions.create({
      model: deployment,
      messages: [
        {
          role: "user",
          content: `You are a civic complaint analysis system for India. Analyze the complaint and return ONLY a valid JSON object with no extra text.\n\n${prompt}`,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 1024,
    })
  );

  const text = response.choices[0]?.message?.content || "{}";
  return parseJSON<ComplaintAnalysis>(text, "complaint categorization");
}

// ─── Document Checklist Generation ───────────────────────────────────────────

/**
 * Azure o4-mini — generates a highly accurate document checklist.
 * Reasoning model gives detailed, step-by-step checklist generation.
 */
export async function azureGenerateDocumentChecklist(
  serviceName: string,
  language: string = "en"
): Promise<DocumentChecklist> {
  if (!endpoint || !apiKey) {
    throw new Error("Azure OpenAI not configured.");
  }

  const prompt = DOCUMENT_CHECKLIST_PROMPT(serviceName, language);

  const response = await withRetry(() =>
    azureClient.chat.completions.create({
      model: deployment,
      messages: [
        {
          role: "user",
          content: `You are an expert on Indian government documentation and processes. Generate a complete document checklist. Return ONLY a valid JSON object.\n\n${prompt}`,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2048,
    })
  );

  const text = response.choices[0]?.message?.content || "{}";
  return parseJSON<DocumentChecklist>(text, "document checklist");
}

// ─── Complaint Formalization ──────────────────────────────────────────────────

/**
 * Azure o4-mini — rewrites informal citizen complaint into formal language.
 */
export async function azureFormalizeComplaint(
  rawDescription: string,
  category: string,
  location: string
): Promise<string> {
  if (!endpoint || !apiKey) return rawDescription;

  const prompt = COMPLAINT_FORMALIZATION_PROMPT(rawDescription, category, location);

  const response = await withRetry(() =>
    azureClient.chat.completions.create({
      model: deployment,
      messages: [
        {
          role: "user",
          content: `You are a professional writer for Indian government correspondence. Formalize the following complaint.\n\n${prompt}\n\nReturn ONLY the formal complaint text, no JSON, no extra commentary.`,
        },
      ],
      max_completion_tokens: 512,
    })
  );

  return response.choices[0]?.message?.content?.trim() || rawDescription;
}

// ─── Service Recommendation ───────────────────────────────────────────────────

/**
 * Azure o4-mini — recommends government schemes with reasoning.
 */
export async function azureRecommendServices(
  profile: SessionProfile
): Promise<ServiceRecommendation[]> {
  if (!endpoint || !apiKey) {
    throw new Error("Azure OpenAI not configured.");
  }

  const prompt = SERVICE_RECOMMENDATION_PROMPT(profile);

  const response = await withRetry(() =>
    azureClient.chat.completions.create({
      model: deployment,
      messages: [
        {
          role: "user",
          content: `You are a government scheme expert for India. Return ONLY a JSON object with a "recommendations" array.\n\n${prompt}`,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2048,
    })
  );

  const text = response.choices[0]?.message?.content || "{}";
  const parsed = parseJSON<{ recommendations?: ServiceRecommendation[] } | ServiceRecommendation[]>(
    text,
    "service recommendation"
  );
  return Array.isArray(parsed)
    ? parsed
    : ((parsed as { recommendations?: ServiceRecommendation[] }).recommendations || []);
}

// ─── Streaming Chat (Azure o4-mini) ──────────────────────────────────────────

/**
 * Stream a civic chat response using Azure o4-mini.
 * Note: o4-mini does not support stream=true in all API versions;
 * this falls back to non-streaming if needed.
 */
const LANG_MAP: Record<string, string> = {
  en: "English",
  hi: "Hindi (हिन्दी)",
  ta: "Tamil (தமிழ்)",
  te: "Telugu (తెలుగు)",
  mr: "Marathi (मराठी)",
  bn: "Bengali (বাংলা)",
  gu: "Gujarati (ગુજરાતી)",
  kn: "Kannada (ಕನ್ನಡ)",
  ml: "Malayalam (മലയാളം)",
  pa: "Punjabi (ਪੰਜਾਬੀ)",
};

export async function azureStreamChat(
  userMessage: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[],
  preferredLanguage: string = "en"
): Promise<ReadableStream<Uint8Array>> {
  if (!endpoint || !apiKey) {
    throw new Error("Azure OpenAI not configured.");
  }

  const encoder = new TextEncoder();
  const targetLang = LANG_MAP[preferredLanguage] || "English";

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    ...conversationHistory,
    {
      role: "user",
      content: `You are Mitra (मित्र), the AI companion of BharatAI Mitra — a platform that helps Indian citizens access government services, understand schemes, and resolve civic issues. Be warm, helpful, and concise. Respond in the user's selected language: ${targetLang}.\n\n${userMessage}`,
    },
  ];

  return new ReadableStream({
    async start(controller) {
      try {
        // Try streaming first
        const stream = await withRetry(() =>
          azureClient.chat.completions.create({
            model: deployment,
            messages,
            stream: true,
            max_completion_tokens: 2048,
          })
        );

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) {
            controller.enqueue(encoder.encode(delta));
          }
        }
        controller.close();
      } catch (err: unknown) {
        const error = err as { message?: string };
        // If streaming not supported by this API version, fall back to non-streaming
        if (error?.message?.includes("stream")) {
          const response = await azureClient.chat.completions.create({
            model: deployment,
            messages,
            max_completion_tokens: 2048,
          });
          const text = response.choices[0]?.message?.content || "";
          controller.enqueue(encoder.encode(text));
          controller.close();
        } else {
          controller.error(err);
        }
      }
    },
  });
}

// ─── Health Check ─────────────────────────────────────────────────────────────

/**
 * Quick health check to verify Azure o4-mini connection works.
 */
export async function azureHealthCheck(): Promise<{ ok: boolean; model: string; latencyMs: number }> {
  const start = Date.now();
  try {
    const response = await azureClient.chat.completions.create({
      model: deployment,
      messages: [{ role: "user", content: "Reply with: OK" }],
      max_completion_tokens: 10,
    });
    return {
      ok: true,
      model: response.model || deployment,
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    return { ok: false, model: deployment, latencyMs: Date.now() - start };
  }
}
