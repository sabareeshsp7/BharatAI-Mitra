import mongoose, { Document, Schema, Model } from "mongoose";

// ─── Document Checklist Interface ─────────────────────────────────────────────

export interface IDocumentItem {
  name: string;
  nameInLanguage?: string;
  description: string;
  isOptional: boolean;
  whereToGet: string;
}

export interface IDocumentChecklist extends Document {
  serviceId: mongoose.Types.ObjectId;
  serviceName: string;
  language: string;
  checklist: {
    documents: IDocumentItem[];
    notes: string[];
    estimatedTime: string;
    applicationSteps: string[];
    fees?: string;
    helplineNumber?: string;
  };
  generatedBy: string;
  createdAt: Date;
  expiresAt: Date;
}

// ─── Schema ────────────────────────────────────────────────────────────────────

const DocumentItemSchema = new Schema<IDocumentItem>(
  {
    name: { type: String, required: true },
    nameInLanguage: { type: String },
    description: { type: String, required: true },
    isOptional: { type: Boolean, default: false },
    whereToGet: { type: String, required: true },
  },
  { _id: false }
);

const DocumentChecklistSchema = new Schema<IDocumentChecklist>(
  {
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: true,
      index: true,
    },
    serviceName: { type: String, required: true },
    language: { type: String, required: true, default: "en" },
    checklist: {
      documents: [DocumentItemSchema],
      notes: [{ type: String }],
      estimatedTime: { type: String },
      applicationSteps: [{ type: String }],
      fees: { type: String },
      helplineNumber: { type: String },
    },
    generatedBy: {
      type: String,
      enum: ["azure-gpt4o", "gemini-pro", "ensemble"],
      default: "azure-gpt4o",
    },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  {
    timestamps: true,
    collection: "document_checklists",
  }
);

// Compound index for efficient lookups
DocumentChecklistSchema.index({ serviceId: 1, language: 1 }, { unique: true });

// ─── Model ─────────────────────────────────────────────────────────────────────

export const DocumentChecklist: Model<IDocumentChecklist> =
  mongoose.models.DocumentChecklist ||
  mongoose.model<IDocumentChecklist>("DocumentChecklist", DocumentChecklistSchema);
