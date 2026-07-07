import { geminiCategorizeComplaint, geminiArbitrate, geminiRecommendServices } from "@/lib/ai/gemini";
import { azureCategorizeComplaint, azureRecommendServices } from "@/lib/ai/azure";
import { detectLanguage, translateText } from "@/lib/ai/sarvam";
import type {
  ComplaintAnalysis,
  EnsembleResult,
  ServiceRecommendation,
  SessionProfile,
  SupportedLanguage,
} from "@/lib/ai/types";

// ─── Complaint Categorization Ensemble ────────────────────────────────────────

/**
 * Run complaint categorization through BOTH Gemini and Azure GPT-4o in parallel.
 * 
 * Logic:
 * - If models AGREE on category → HIGH confidence result
 * - If models DISAGREE → Gemini Pro arbitrates → MEDIUM confidence result
 * 
 * This cross-validation significantly improves accuracy for civic complaints.
 */
export async function ensembleCategorizeComplaint(
  description: string
): Promise<EnsembleResult<ComplaintAnalysis>> {
  // Run both models in parallel for speed
  const [geminiResult, azureResult] = await Promise.allSettled([
    geminiCategorizeComplaint(description),
    azureCategorizeComplaint(description),
  ]);

  // Handle partial failures
  if (geminiResult.status === "rejected" && azureResult.status === "rejected") {
    throw new Error(
      `Both AI models failed to categorize complaint. Gemini: ${geminiResult.reason}. Azure: ${azureResult.reason}`
    );
  }

  // If only one model succeeded, use it with LOW confidence
  if (geminiResult.status === "rejected") {
    console.warn("Gemini-2.0-flash categorization failed, using Azure o4-mini only:", geminiResult.reason);
    return {
      result: (azureResult as PromiseFulfilledResult<ComplaintAnalysis>).value,
      confidence: "LOW",
      agreedBy: ["azure-o4-mini"],
    };
  }

  if (azureResult.status === "rejected") {
    console.warn("Azure o4-mini categorization failed, using Gemini-2.0-flash only:", azureResult.reason);
    return {
      result: (geminiResult as PromiseFulfilledResult<ComplaintAnalysis>).value,
      confidence: "LOW",
      agreedBy: ["gemini-2.0-flash"],
    };
  }

  const geminiOutput = (geminiResult as PromiseFulfilledResult<ComplaintAnalysis>).value;
  const azureOutput = (azureResult as PromiseFulfilledResult<ComplaintAnalysis>).value;

  // Check if models agree on the primary category
  if (geminiOutput.category === azureOutput.category) {
    // Models agree — merge the best of both (Azure for formal description, Gemini for keywords)
    return {
      result: {
        ...geminiOutput,
        formalDescription: azureOutput.formalDescription, // Azure is better at formal writing
        severity: geminiOutput.severity === azureOutput.severity
          ? geminiOutput.severity
          : escalateSeverity(geminiOutput.severity, azureOutput.severity),
        keywords: [...new Set([...geminiOutput.keywords, ...azureOutput.keywords])],
      },
      confidence: "HIGH",
      agreedBy: ["gemini-2.0-flash", "azure-o4-mini"],
      geminiOutput,
      azureOutput,
    };
  }

  // Models disagree — use Gemini Pro to arbitrate
  console.log(`Ensemble disagreement: Gemini=${geminiOutput.category}, Azure=${azureOutput.category}. Arbitrating...`);
  
  try {
    const arbitrationResult = await geminiArbitrate(description, geminiOutput, azureOutput);
    return {
      result: arbitrationResult,
      confidence: "MEDIUM",
      agreedBy: [],
      arbitratedBy: "gemini-pro",
      geminiOutput,
      azureOutput,
    };
  } catch (err) {
    console.error("Arbitration failed, defaulting to Azure (more structured):", err);
    return {
      result: azureOutput,
      confidence: "LOW",
      agreedBy: ["azure-o4-mini"],
      geminiOutput,
      azureOutput,
    };
  }
}

// ─── Service Recommendation Ensemble ─────────────────────────────────────────

/**
 * Run service recommendations through both models and merge results.
 * Models return independent recommendations; we deduplicate and re-rank.
 */
export async function ensembleRecommendServices(
  profile: SessionProfile
): Promise<EnsembleResult<ServiceRecommendation[]>> {
  const [geminiResult, azureResult] = await Promise.allSettled([
    geminiRecommendServices(profile),
    azureRecommendServices(profile),
  ]);

  if (geminiResult.status === "rejected" && azureResult.status === "rejected") {
    throw new Error("Both AI models failed to generate service recommendations");
  }

  const geminiRecs = geminiResult.status === "fulfilled" ? geminiResult.value : [];
  const azureRecs = azureResult.status === "fulfilled" ? azureResult.value : [];

  if (geminiRecs.length === 0) {
    return { result: azureRecs, confidence: "LOW", agreedBy: ["azure-o4-mini"] };
  }
  if (azureRecs.length === 0) {
    return { result: geminiRecs, confidence: "LOW", agreedBy: ["gemini-2.0-flash"] };
  }

  // Merge recommendations: schemes appearing in both lists get boosted relevance
  const merged = mergeRecommendations(geminiRecs, azureRecs);

  return {
    result: merged,
    confidence: "HIGH",
    agreedBy: ["gemini-2.0-flash", "azure-o4-mini"],
    geminiOutput: geminiRecs,
    azureOutput: azureRecs,
  };
}

// ─── Multilingual Processing Pipeline ────────────────────────────────────────

/**
 * Full multilingual pipeline:
 * 1. Detect input language with Sarvam
 * 2. Translate to English if needed
 * 3. Process with AI (Gemini or Azure)
 * 4. Translate response back to original language
 */
export async function multilingualPipeline<T extends string>(
  userInput: string,
  aiProcessor: (englishInput: string) => Promise<T>,
  targetLanguage: SupportedLanguage
): Promise<{
  result: T;
  detectedLanguage: string;
  translatedResponse: string;
  processedInEnglish: string;
}> {
  // Step 1: Detect input language
  const detectedLang = await detectLanguage(userInput);
  const detectedCode = detectedLang.split("-")[0] as SupportedLanguage; // "hi-IN" → "hi"

  // Step 2: Translate to English if not already English
  let englishInput = userInput;
  if (detectedCode !== "en") {
    const translation = await translateText(userInput, detectedCode, "en");
    englishInput = translation.translatedText;
  }

  // Step 3: Process with AI in English
  const result = await aiProcessor(englishInput);

  // Step 4: Translate response back to target language
  let translatedResponse = result;
  if (targetLanguage !== "en") {
    const backTranslation = await translateText(result, "en", targetLanguage);
    translatedResponse = backTranslation.translatedText as T;
  }

  return {
    result,
    detectedLanguage: detectedLang,
    translatedResponse,
    processedInEnglish: englishInput,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Severity = "low" | "medium" | "high" | "critical";
const SEVERITY_ORDER: Severity[] = ["low", "medium", "high", "critical"];

/**
 * When models disagree on severity, always escalate to the higher one
 * (better to over-report than under-report a civic issue).
 */
function escalateSeverity(a: Severity, b: Severity): Severity {
  const indexA = SEVERITY_ORDER.indexOf(a);
  const indexB = SEVERITY_ORDER.indexOf(b);
  return SEVERITY_ORDER[Math.max(indexA, indexB)];
}

/**
 * Merge recommendations from two models.
 * Schemes appearing in both get a 20% relevance boost.
 */
function mergeRecommendations(
  geminiRecs: ServiceRecommendation[],
  azureRecs: ServiceRecommendation[]
): ServiceRecommendation[] {
  const geminiNames = new Set(geminiRecs.map((r) => r.name.toLowerCase()));
  const azureNames = new Set(azureRecs.map((r) => r.name.toLowerCase()));

  const boosted = geminiRecs.map((rec) => {
    const inBothModels = azureNames.has(rec.name.toLowerCase());
    return {
      ...rec,
      relevanceScore: inBothModels ? Math.min(100, rec.relevanceScore * 1.2) : rec.relevanceScore,
      reason: inBothModels
        ? `${rec.reason} (Both AI models recommend this scheme)`
        : rec.reason,
    };
  });

  // Add Azure-exclusive recommendations not already in Gemini's list
  const azureExclusive = azureRecs.filter(
    (rec) => !geminiNames.has(rec.name.toLowerCase())
  );

  return [...boosted, ...azureExclusive]
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 8); // Return top 8
}
