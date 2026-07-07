import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Service } from "@/models/Service.model";
import mongoose from "mongoose";

// ─── GET /api/services/[id] ───────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    let service = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      service = await Service.findById(id).lean();
    }

    if (!service) {
      // Try finding by slug/name
      service = await Service.findOne({
        name: { $regex: id.replace(/-/g, " "), $options: "i" },
      }).lean();
    }

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json({ service });
  } catch (err) {
    console.error("Service detail error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
