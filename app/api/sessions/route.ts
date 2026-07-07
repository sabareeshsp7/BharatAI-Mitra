import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Session } from "@/models/Session.model";
import { SessionProfileSchema } from "@/lib/validations";

// ─── POST /api/sessions — Create or update session profile ───────────────────

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const validation = SessionProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { sessionId, ...profileData } = validation.data;

    const session = await Session.findOneAndUpdate(
      { sessionId },
      {
        sessionId,
        "profile.preferredLanguage": profileData.preferredLanguage,
        "profile.state": profileData.state,
        "profile.district": profileData.district,
        "profile.age": profileData.age,
        "profile.category": profileData.category,
        "profile.income": profileData.income,
        "profile.occupation": profileData.occupation,
        "profile.gender": profileData.gender,
        lastActiveAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({
      success: true,
      sessionId: session.sessionId,
      profile: session.profile,
      isNew: session.lastActiveAt.getTime() === session.createdAt.getTime(),
    });
  } catch (err) {
    console.error("Session error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── GET /api/sessions?sessionId=xxx ─────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    const session = await Session.findOne({ sessionId }).lean();

    if (!session) {
      return NextResponse.json({
        exists: false,
        profile: { preferredLanguage: "en" },
      });
    }

    return NextResponse.json({
      exists: true,
      sessionId: session.sessionId,
      profile: session.profile,
      createdAt: session.createdAt,
      lastActiveAt: session.lastActiveAt,
    });
  } catch (err) {
    console.error("Session get error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
