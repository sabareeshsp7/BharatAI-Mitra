import mongoose, { Document, Schema, Model } from "mongoose";

// ─── Conversation Interface ────────────────────────────────────────────────────

export interface IMessage {
  role: "user" | "assistant";
  content: string;
  originalLanguage?: string;
  translatedContent?: string;
  model?: string;
  timestamp: Date;
}

export interface IConversation extends Document {
  sessionId: string;
  messages: IMessage[];
  title?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ────────────────────────────────────────────────────────────────────

const MessageSchema = new Schema<IMessage>(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    originalLanguage: { type: String },
    translatedContent: { type: String },
    model: {
      type: String,
    },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ConversationSchema = new Schema<IConversation>(
  {
    sessionId: { type: String, required: true, index: true },
    messages: [MessageSchema],
    title: { type: String },
  },
  {
    timestamps: true,
    collection: "conversations",
  }
);

// Compound index for efficient session-based queries
ConversationSchema.index({ sessionId: 1, updatedAt: -1 });

// ─── Model ─────────────────────────────────────────────────────────────────────

export const Conversation: Model<IConversation> =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>("Conversation", ConversationSchema);
