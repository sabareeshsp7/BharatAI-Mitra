import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Service } from "@/models/Service.model";
import { ServicesQuerySchema } from "@/lib/validations";

// ─── GET /api/services — Browse government services ───────────────────────────

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validation = ServicesQuerySchema.safeParse(queryParams);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { q, category, state, beneficiary, page, limit } = validation.data;

    // ── Build MongoDB filter ──────────────────────────────────────────────────
    const filter: Record<string, unknown> = { isActive: true };

    if (q) {
      // Full-text search on indexed fields
      filter.$text = { $search: q };
    }
    if (category) {
      filter.category = category;
    }
    if (state) {
      filter.$or = [{ state }, { state: null }]; // Include both state-specific and national schemes
    }
    if (beneficiary) {
      filter.targetBeneficiaries = { $in: [beneficiary] };
    }

    const projection = q
      ? { score: { $meta: "textScore" } }
      : {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sortQuery: any = q ? { score: { $meta: "textScore" } } : { name: 1 };

    const total = await Service.countDocuments(filter);
    const services = await Service.find(filter, projection)
      .sort(sortQuery as Record<string, 1>)
      .skip((page - 1) * limit)
      .limit(limit)
      .select("name category description eligibility ministry targetBeneficiaries state applicationUrl helplineNumber benefitType launchYear")
      .lean();

    return NextResponse.json({
      services,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      filters: { q, category, state, beneficiary },
    });
  } catch (err) {
    console.error("Services list error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
