import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Complaint } from "@/models/Complaint.model";
import { ComplaintStatusSchema } from "@/lib/validations";

// ─── GET /api/complaints/[complaintId] — Public status tracking ───────────────
// No auth required — complaintId is the public token

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ complaintId: string }> }
) {
  try {
    await connectDB();

    const { complaintId } = await params;

    if (!complaintId || !complaintId.startsWith("BM-")) {
      return NextResponse.json(
        { error: "Invalid complaint ID format. Should be BM-YYYY-XXXXX" },
        { status: 400 }
      );
    }

    const complaint = await Complaint.findOne({ complaintId })
      .select(
        "complaintId category subCategory severity status timeline location formalDescription suggestedDepartment aiCategoryConfidence createdAt updatedAt"
      )
      .lean();

    if (!complaint) {
      return NextResponse.json(
        { error: "Complaint not found", complaintId },
        { status: 404 }
      );
    }

    return NextResponse.json({ complaint });
  } catch (err) {
    console.error("Complaint status error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── PATCH /api/complaints/[complaintId] — Update status (admin) ──────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ complaintId: string }> }
) {
  try {
    await connectDB();

    const { complaintId } = await params;
    const body = await req.json();

    const validation = ComplaintStatusSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { status, note } = validation.data;

    const complaint = await Complaint.findOneAndUpdate(
      { complaintId },
      {
        status,
        $push: {
          timeline: {
            status,
            note,
            timestamp: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!complaint) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      complaint: {
        complaintId: complaint.complaintId,
        status: complaint.status,
        timeline: complaint.timeline,
      },
    });
  } catch (err) {
    console.error("Complaint update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
