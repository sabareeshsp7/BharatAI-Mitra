import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Complaint } from "@/models/Complaint.model";

export const maxDuration = 60; // Prevent Vercel timeouts

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const complaints = await Complaint.find()
      .sort({ createdAt: -1 })
      .lean();

    // Calculate stats
    const total = complaints.length;
    const pending = complaints.filter(
      (c) => c.status === "submitted" || c.status === "acknowledged" || c.status === "in_progress"
    ).length;
    const resolved = complaints.filter((c) => c.status === "resolved").length;
    const closed = complaints.filter((c) => c.status === "closed").length;

    return NextResponse.json({
      complaints,
      stats: { total, pending, resolved, closed },
    });
  } catch (err) {
    console.error("Admin complaints list error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
