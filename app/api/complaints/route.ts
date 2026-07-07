import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Complaint } from "@/models/Complaint.model";
import { Session } from "@/models/Session.model";
import { ensembleCategorizeComplaint } from "@/lib/ai/ensemble";
import { azureFormalizeComplaint } from "@/lib/ai/azure";
import { detectLanguage, translateText } from "@/lib/ai/sarvam";
import { ComplaintCreateSchema } from "@/lib/validations";

// ─── POST /api/complaints — Create complaint with AI enrichment ───────────────

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const validation = ComplaintCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { description, sessionId, location, language, mediaUrls } = validation.data;

    // ── Ensure session exists ─────────────────────────────────────────────────
    let session = await Session.findOne({ sessionId });
    if (!session) {
      session = await Session.create({ sessionId, profile: { preferredLanguage: language } });
    }

    // ── Language detection + translation to English ───────────────────────────
    let englishDescription = description;
    let detectedLanguage = "en";

    try {
      const detected = await detectLanguage(description);
      detectedLanguage = detected.split("-")[0];

      if (detectedLanguage !== "en") {
        const translation = await translateText(description, detectedLanguage, "en");
        englishDescription = translation.translatedText;
      }
    } catch (err) {
      console.warn("Translation failed for complaint, using original:", err);
    }

    // ── Ensemble AI categorization (Gemini + Azure cross-validation) ──────────
    const ensembleResult = await ensembleCategorizeComplaint(englishDescription);
    const analysis = ensembleResult.result;

    // ── Azure GPT-4o formalization (formal complaint language) ────────────────
    let formalDescription = analysis.formalDescription;
    try {
      formalDescription = await azureFormalizeComplaint(
        englishDescription,
        analysis.category,
        `${location.district}, ${location.state}`
      );
    } catch (err) {
      console.warn("Complaint formalization failed, using AI-generated description:", err);
    }

    // ── Generate complaintId upfront (before Mongoose validation runs) ────────
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    const complaintId = `BM-${year}-${random}`;

    // ── Save complaint to MongoDB ──────────────────────────────────────────────
    const complaint = await Complaint.create({
      complaintId,
      sessionId,
      originalDescription: description,
      originalLanguage: detectedLanguage,
      category: analysis.category,
      subCategory: analysis.subCategory,
      severity: analysis.severity,
      formalDescription,
      suggestedDepartment: analysis.suggestedDepartment,
      keywords: analysis.keywords,
      aiCategoryConfidence: ensembleResult.confidence,
      aiModelsAgreed: ensembleResult.agreedBy,
      location,
      status: "submitted",
      timeline: [
        {
          status: "submitted",
          note: "Complaint received and AI-analyzed successfully",
          timestamp: new Date(),
        },
      ],
      mediaUrls: mediaUrls || [],
    });

    return NextResponse.json(
      {
        success: true,
        complaint: {
          id: complaint._id,
          complaintId: complaint.complaintId,
          category: complaint.category,
          subCategory: complaint.subCategory,
          severity: complaint.severity,
          status: complaint.status,
          formalDescription: complaint.formalDescription,
          suggestedDepartment: complaint.suggestedDepartment,
          aiConfidence: complaint.aiCategoryConfidence,
          aiModelsAgreed: complaint.aiModelsAgreed,
          location: complaint.location,
          createdAt: complaint.createdAt,
          ensembleDetails: {
            confidence: ensembleResult.confidence,
            agreedBy: ensembleResult.agreedBy,
            arbitratedBy: ensembleResult.arbitratedBy,
          },
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Complaint creation error:", err);
    return NextResponse.json(
      { error: "Failed to create complaint", message: (err as Error).message },
      { status: 500 }
    );
  }
}

// ─── GET /api/complaints?sessionId=xxx ────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    const filter: Record<string, unknown> = { sessionId };
    if (status) filter.status = status;
    if (category) filter.category = category;

    const total = await Complaint.countDocuments(filter);
    const complaints = await Complaint.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("-__v")
      .lean();

    return NextResponse.json({
      complaints,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Complaints list error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
