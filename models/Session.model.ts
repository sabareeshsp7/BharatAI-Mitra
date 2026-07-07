import mongoose, { Document, Schema, Model } from "mongoose";

// ─── Session Interface ─────────────────────────────────────────────────────────

export interface ISession extends Document {
  sessionId: string;
  profile: {
    preferredLanguage: string;
    state?: string;
    district?: string;
    age?: number;
    category?: string;
    income?: number;
    occupation?: string;
    gender?: string;
  };
  createdAt: Date;
  lastActiveAt: Date;
}

// ─── Schema ────────────────────────────────────────────────────────────────────

const SessionSchema = new Schema<ISession>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    profile: {
      preferredLanguage: { type: String, default: "en" },
      state: { type: String },
      district: { type: String },
      age: { type: Number },
      category: {
        type: String,
        enum: ["general", "sc", "st", "obc", "minority", "ews"],
        default: "general",
      },
      income: { type: Number },
      occupation: { type: String },
      gender: { type: String, enum: ["male", "female", "other"] },
    },
    lastActiveAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: "sessions",
  }
);

// ─── Model ─────────────────────────────────────────────────────────────────────

export const Session: Model<ISession> =
  mongoose.models.Session || mongoose.model<ISession>("Session", SessionSchema);
