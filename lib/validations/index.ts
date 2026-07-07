import { z } from "zod";

// ─── Chat ──────────────────────────────────────────────────────────────────────

export const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(10000),
  timestamp: z.string().optional(),
});

export const ChatRequestSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(5000, "Message too long"),
  sessionId: z.string().uuid("Invalid session ID"),
  conversationId: z.string().nullable().optional(),
  language: z.string().default("en"),
  useVoice: z.boolean().default(false),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

// ─── Complaint ─────────────────────────────────────────────────────────────────

export const ComplaintCreateSchema = z.object({
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description too long"),
  sessionId: z.string().uuid("Invalid session ID"),
  location: z.object({
    state: z.string().min(2, "State is required"),
    district: z.string().min(2, "District is required"),
    address: z.string().min(5, "Address is required"),
    pincode: z.string().regex(/^\d{6}$/, "Invalid 6-digit pincode").optional(),
  }),
  language: z.string().default("en"),
  mediaUrls: z.array(z.string()).max(5).default([]),
  imageBase64: z.string().optional(),
  imageMimeType: z.string().optional(),
  isAiGeneratedPhoto: z.boolean().optional(),
  imageInsights: z.string().optional(),
});

export type ComplaintCreate = z.infer<typeof ComplaintCreateSchema>;

export const ComplaintStatusSchema = z.object({
  status: z.enum(["submitted", "acknowledged", "in_progress", "resolved", "closed"]),
  note: z.string().min(1).max(500),
});

// ─── Session ───────────────────────────────────────────────────────────────────

export const SessionProfileSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID"),
  preferredLanguage: z
    .enum(["en", "hi", "ta", "te", "mr", "bn", "gu", "kn", "ml", "pa", "or", "as"])
    .default("en"),
  state: z.string().optional(),
  district: z.string().optional(),
  age: z.number().min(0).max(120).optional(),
  category: z
    .enum(["general", "sc", "st", "obc", "minority", "ews", "bpl", "farmers", "workers", "women", "youth", "senior-citizens", "disabled"])
    .optional(),
  income: z.number().min(0).optional(),
  occupation: z.string().max(100).optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
});

export type SessionProfile = z.infer<typeof SessionProfileSchema>;

// ─── Service Recommendation ────────────────────────────────────────────────────

export const RecommendServicesSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID"),
  profile: SessionProfileSchema.omit({ sessionId: true }).optional(),
});

// ─── Document Checklist ────────────────────────────────────────────────────────

export const DocumentChecklistSchema = z.object({
  serviceId: z.string().min(1, "Service ID is required"),
  language: z.string().default("en"),
  sessionId: z.string().uuid("Invalid session ID").optional(),
});

// ─── Translation ───────────────────────────────────────────────────────────────

export const TranslationSchema = z.object({
  text: z.string().min(1).max(5000),
  sourceLang: z.string().default("en"),
  targetLang: z.string().min(2, "Target language is required"),
});

// ─── Services Search ──────────────────────────────────────────────────────────

export const ServicesQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  state: z.string().optional(),
  beneficiary: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(12),
});
