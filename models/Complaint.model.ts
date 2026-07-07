import mongoose, { Document, Schema, Model } from "mongoose";

// ─── Complaint Interface ───────────────────────────────────────────────────────

export interface IComplaintTimeline {
  status: string;
  note: string;
  timestamp: Date;
}

export interface IComplaint extends Document {
  complaintId: string;       // Human-readable: BM-2026-XXXXX (BharatAI Mitra)
  sessionId: string;

  // Citizen input
  originalDescription: string;
  originalLanguage: string;

  // AI-enriched fields
  category: string;
  subCategory: string;
  severity: "low" | "medium" | "high" | "critical";
  formalDescription: string;
  suggestedDepartment: string;
  keywords: string[];
  aiCategoryConfidence: "HIGH" | "MEDIUM" | "LOW";
  aiModelsAgreed: string[];

  // Location
  location: {
    state: string;
    district: string;
    address: string;
    pincode?: string;
  };

  // Status & lifecycle
  status: "submitted" | "acknowledged" | "in_progress" | "resolved" | "closed";
  timeline: IComplaintTimeline[];

  // Media
  mediaUrls: string[];
  isAiGeneratedPhoto?: boolean;
  imageInsights?: string;

  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ────────────────────────────────────────────────────────────────────

const TimelineSchema = new Schema<IComplaintTimeline>(
  {
    status: { type: String, required: true },
    note: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ComplaintSchema = new Schema<IComplaint>(
  {
    complaintId: {
      type: String,
      unique: true,
      index: true,
      // Not required here — auto-generated in pre('save') hook before DB write
    },
    sessionId: { type: String, required: true, index: true },

    originalDescription: { type: String, required: true },
    originalLanguage: { type: String, default: "en" },

    category: {
      type: String,
      enum: [
        "roads", "water", "electricity", "sanitation", "health",
        "education", "agriculture", "public-safety", "environment", "other"
      ],
      required: true,
      index: true,
    },
    subCategory: { type: String, required: true },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      required: true,
      index: true,
    },
    formalDescription: { type: String, required: true },
    suggestedDepartment: { type: String },
    keywords: [{ type: String }],
    aiCategoryConfidence: {
      type: String,
      enum: ["HIGH", "MEDIUM", "LOW"],
      default: "MEDIUM",
    },
    aiModelsAgreed: [{ type: String }],

    location: {
      state: { type: String, required: true },
      district: { type: String, required: true },
      address: { type: String, required: true },
      pincode: { type: String },
    },

    status: {
      type: String,
      enum: ["submitted", "acknowledged", "in_progress", "resolved", "closed"],
      default: "submitted",
      index: true,
    },
    timeline: [TimelineSchema],
    mediaUrls: [{ type: String }],
    isAiGeneratedPhoto: { type: Boolean, default: false },
    imageInsights: { type: String },
  },
  {
    timestamps: true,
    collection: "complaints",
  }
);

// Compound indexes for common queries
ComplaintSchema.index({ sessionId: 1, createdAt: -1 });
ComplaintSchema.index({ status: 1, severity: -1 });
ComplaintSchema.index({ "location.state": 1, "location.district": 1 });

// ─── Pre-save: generate complaintId ──────────────────────────────────────────

ComplaintSchema.pre("save", async function () {
  if (!this.complaintId) {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    this.complaintId = `BM-${year}-${random}`;
  }
  // Add initial timeline entry on first save
  if (this.isNew && (!this.timeline || this.timeline.length === 0)) {
    this.timeline = [
      {
        status: "submitted",
        note: "Complaint received and registered in the system",
        timestamp: new Date(),
      },
    ];
  }
});

// ─── Model ─────────────────────────────────────────────────────────────────────

export const Complaint: Model<IComplaint> =
  mongoose.models.Complaint ||
  mongoose.model<IComplaint>("Complaint", ComplaintSchema);
