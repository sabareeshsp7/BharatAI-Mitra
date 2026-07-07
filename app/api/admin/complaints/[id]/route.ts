import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Complaint } from "@/models/Complaint.model";

export const maxDuration = 60; // Prevent Vercel timeouts

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Complaint ID is required" }, { status: 400 });
    }

    const body = await req.json();
    const { status, note } = body;

    if (!status || !note) {
      return NextResponse.json({ error: "Status and note are required" }, { status: 400 });
    }

    const validStatuses = ["submitted", "acknowledged", "in_progress", "resolved", "closed"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
    }

    complaint.status = status;
    complaint.timeline.push({
      status,
      note,
      timestamp: new Date(),
    });

    await complaint.save();

    return NextResponse.json({
      success: true,
      complaint,
    });
  } catch (err) {
    console.error("Admin complaint update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
