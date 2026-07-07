import mongoose, { Document, Schema, Model } from "mongoose";

// ─── AI Cache Interface ────────────────────────────────────────────────────────

export type CacheType =
  | "document_checklist"
  | "service_recommendation"
  | "translation"
  | "complaint_analysis";

export interface IAICache extends Document {
  cacheKey: string;
  type: CacheType;
  result: unknown;
  modelsUsed: string[];
  confidence?: string;
  createdAt: Date;
  expiresAt: Date;
}

// ─── Schema ────────────────────────────────────────────────────────────────────

const AICacheSchema = new Schema<IAICache>(
  {
    cacheKey: { type: String, required: true, unique: true, index: true },
    type: {
      type: String,
      enum: [
        "document_checklist",
        "service_recommendation",
        "translation",
        "complaint_analysis",
      ],
      required: true,
    },
    result: { type: Schema.Types.Mixed, required: true },
    modelsUsed: [{ type: String }],
    confidence: { type: String, enum: ["HIGH", "MEDIUM", "LOW"] },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }, // TTL index
  },
  {
    timestamps: true,
    collection: "ai_cache",
  }
);

// ─── Model ─────────────────────────────────────────────────────────────────────

export const AICache: Model<IAICache> =
  mongoose.models.AICache ||
  mongoose.model<IAICache>("AICache", AICacheSchema);

// ─── Helper Functions ─────────────────────────────────────────────────────────

import crypto from "crypto";

export function generateCacheKey(type: CacheType, ...inputs: string[]): string {
  const raw = [type, ...inputs].join("|");
  return crypto.createHash("sha256").update(raw).digest("hex").substring(0, 32);
}

export async function getCached<T>(cacheKey: string): Promise<T | null> {
  const cached = await AICache.findOne({ cacheKey, expiresAt: { $gt: new Date() } });
  return cached ? (cached.result as T) : null;
}

export async function setCache(
  cacheKey: string,
  type: CacheType,
  result: unknown,
  modelsUsed: string[],
  ttlHours: number,
  confidence?: string
): Promise<void> {
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
  await AICache.findOneAndUpdate(
    { cacheKey },
    { cacheKey, type, result, modelsUsed, expiresAt, confidence },
    { upsert: true, new: true }
  );
}
