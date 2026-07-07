import mongoose, { Document, Schema, Model } from "mongoose";

// ─── Service Interface ─────────────────────────────────────────────────────────

export interface IService extends Document {
  name: string;
  nameTranslations: Record<string, string>;
  category: string;
  description: string;
  descriptionTranslations: Record<string, string>;
  eligibility: string[];
  documents: string[];
  applicationUrl?: string;
  ministry: string;
  department?: string;
  targetBeneficiaries: string[];
  state?: string;        // null = central (national) scheme
  keywords: string[];
  helplineNumber?: string;
  isActive: boolean;
  launchYear?: number;
  benefitType: string;   // 'financial' | 'health' | 'housing' | 'education' | 'employment' | 'other'
}

// ─── Schema ────────────────────────────────────────────────────────────────────

const ServiceSchema = new Schema<IService>(
  {
    name: { type: String, required: true, index: true },
    nameTranslations: { type: Map, of: String, default: {} },
    category: {
      type: String,
      required: true,
      enum: [
        "housing", "health", "education", "agriculture", "finance",
        "employment", "social-security", "digital", "infrastructure", "other"
      ],
      index: true,
    },
    description: { type: String, required: true },
    descriptionTranslations: { type: Map, of: String, default: {} },
    eligibility: [{ type: String }],
    documents: [{ type: String }],
    applicationUrl: { type: String },
    ministry: { type: String, required: true },
    department: { type: String },
    targetBeneficiaries: [{ type: String, index: true }],
    state: { type: String, default: null, index: true }, // null = national scheme
    keywords: [{ type: String, index: true }],
    helplineNumber: { type: String },
    isActive: { type: Boolean, default: true, index: true },
    launchYear: { type: Number },
    benefitType: {
      type: String,
      enum: ["financial", "health", "housing", "education", "employment", "other"],
      default: "other",
    },
  },
  {
    timestamps: true,
    collection: "services",
  }
);

// Text search index for full-text search
ServiceSchema.index({ name: "text", description: "text", keywords: "text" });

// ─── Model ─────────────────────────────────────────────────────────────────────

export const Service: Model<IService> =
  mongoose.models.Service ||
  mongoose.model<IService>("Service", ServiceSchema);
