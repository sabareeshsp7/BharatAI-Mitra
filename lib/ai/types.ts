// ─── Shared AI Types for Smart Bharat ─────────────────────────────────────────

export type SupportedLanguage =
  | "en"
  | "hi"
  | "ta"
  | "te"
  | "mr"
  | "bn"
  | "gu"
  | "kn"
  | "ml"
  | "pa"
  | "or"
  | "as";

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: "English",
  hi: "हिन्दी (Hindi)",
  ta: "தமிழ் (Tamil)",
  te: "తెలుగు (Telugu)",
  mr: "मराठी (Marathi)",
  bn: "বাংলা (Bengali)",
  gu: "ગુજરાતી (Gujarati)",
  kn: "ಕನ್ನಡ (Kannada)",
  ml: "മലയാളം (Malayalam)",
  pa: "ਪੰਜਾਬੀ (Punjabi)",
  or: "ଓଡ଼ିଆ (Odia)",
  as: "অসমীয়া (Assamese)",
};

// ─── Chat ──────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
  model?: AIModel;
  originalLanguage?: string;
  translatedContent?: string;
}

export type AIModel = "gemini-flash" | "gemini-pro" | "azure-gpt4o" | "sarvam" | "ensemble";

// ─── Complaint Analysis ────────────────────────────────────────────────────────

export type ComplaintCategory =
  | "roads"
  | "water"
  | "electricity"
  | "sanitation"
  | "health"
  | "education"
  | "agriculture"
  | "public-safety"
  | "environment"
  | "other";

export type ComplaintSeverity = "low" | "medium" | "high" | "critical";

export interface ComplaintAnalysis {
  category: ComplaintCategory;
  subCategory: string;
  severity: ComplaintSeverity;
  formalDescription: string;
  suggestedDepartment: string;
  keywords: string[];
}

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

export interface EnsembleResult<T> {
  result: T;
  confidence: ConfidenceLevel;
  agreedBy: AIModel[];
  arbitratedBy?: AIModel;
  geminiOutput?: T;
  azureOutput?: T;
}

// ─── Service Recommendation ───────────────────────────────────────────────────

export interface ServiceRecommendation {
  serviceId: string;
  name: string;
  category: string;
  relevanceScore: number;
  reason: string;
  eligibilityMatch: string[];
  applicationUrl?: string;
}

// ─── Document Checklist ───────────────────────────────────────────────────────

export interface DocumentItem {
  name: string;
  nameInLanguage?: string;
  description: string;
  isOptional: boolean;
  whereToGet: string;
}

export interface DocumentChecklist {
  documents: DocumentItem[];
  notes: string[];
  estimatedTime: string;
  applicationSteps: string[];
  fees?: string;
  helplineNumber?: string;
}

// ─── Translation ──────────────────────────────────────────────────────────────

export interface TranslationResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  model: "sarvam-mayura";
}

// ─── Speech ───────────────────────────────────────────────────────────────────

export interface SpeechToTextResult {
  transcript: string;
  detectedLanguage: string;
  confidence?: number;
}

export interface TextToSpeechResult {
  audioBase64: string;
  mimeType: string;
  language: string;
}

// ─── Session Profile ──────────────────────────────────────────────────────────

export interface SessionProfile {
  preferredLanguage: SupportedLanguage;
  state?: string;
  district?: string;
  age?: number;
  category?: "general" | "sc" | "st" | "obc" | "minority" | "ews";
  income?: number;
  occupation?: string;
  gender?: "male" | "female" | "other";
}
