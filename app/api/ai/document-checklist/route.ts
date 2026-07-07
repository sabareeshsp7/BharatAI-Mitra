import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Service } from "@/models/Service.model";
import { DocumentChecklist } from "@/models/DocumentChecklist.model";
import { azureGenerateDocumentChecklist } from "@/lib/ai/azure";
import { translateText } from "@/lib/ai/sarvam";
import { DocumentChecklistSchema } from "@/lib/validations";
import mongoose from "mongoose";

// ─── POST /api/ai/document-checklist ─────────────────────────────────────────
// Azure GPT-4o generates document checklist + Sarvam translates if needed
// Results cached in MongoDB for 7 days per service+language combo

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const validation = DocumentChecklistSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { serviceId, language } = validation.data;

    // ── Find service in MongoDB ───────────────────────────────────────────────
    let service = null;
    if (mongoose.Types.ObjectId.isValid(serviceId)) {
      service = await Service.findById(serviceId).lean();
    }
    if (!service) {
      service = await Service.findOne({
        name: { $regex: serviceId, $options: "i" },
      }).lean();
    }

    if (!service) {
      return NextResponse.json(
        { error: "Service not found", serviceId },
        { status: 404 }
      );
    }

    // ── Check MongoDB cache (7-day TTL) ───────────────────────────────────────
    const cachedChecklist = await DocumentChecklist.findOne({
      serviceId: service._id,
      language: language || "en",
      expiresAt: { $gt: new Date() },
    }).lean();

    if (cachedChecklist) {
      return NextResponse.json({
        checklist: cachedChecklist.checklist,
        service: { id: service._id, name: service.name, category: service.category },
        generatedBy: cachedChecklist.generatedBy,
        fromCache: true,
      });
    }

    // ── Generate with Azure GPT-4o ────────────────────────────────────────────
    const checklist = await azureGenerateDocumentChecklist(service.name, "en");

    // ── Translate if needed (Sarvam AI) ───────────────────────────────────────
    if (language && language !== "en") {
      try {
        // Translate document names and descriptions
        for (const doc of checklist.documents) {
          const translated = await translateText(doc.name, "en", language);
          doc.nameInLanguage = translated.translatedText;
        }

        // Translate notes
        const translatedNotes = await Promise.allSettled(
          checklist.notes.map((note) => translateText(note, "en", language))
        );
        checklist.notes = translatedNotes.map((r, i) =>
          r.status === "fulfilled" ? r.value.translatedText : checklist.notes[i]
        );
      } catch (err) {
        console.warn("Checklist translation failed, serving in English:", err);
      }
    }

    // ── Save to MongoDB cache ──────────────────────────────────────────────────
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await DocumentChecklist.findOneAndUpdate(
      { serviceId: service._id, language: language || "en" },
      {
        serviceId: service._id,
        serviceName: service.name,
        language: language || "en",
        checklist,
        generatedBy: "azure-gpt4o",
        expiresAt,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      checklist,
      service: {
        id: service._id,
        name: service.name,
        category: service.category,
        ministry: service.ministry,
        applicationUrl: service.applicationUrl,
      },
      generatedBy: "azure-gpt4o",
      language,
      fromCache: false,
    });
  } catch (err) {
    console.error("Document checklist error:", err);
    return NextResponse.json(
      { error: "Failed to generate checklist", message: (err as Error).message },
      { status: 500 }
    );
  }
}
