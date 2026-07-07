import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Service } from "@/models/Service.model";
import { Session } from "@/models/Session.model";
import { generateCacheKey, getCached, setCache } from "@/models/AICache.model";
import { ensembleRecommendServices } from "@/lib/ai/ensemble";
import { RecommendServicesSchema } from "@/lib/validations";
import type { SessionProfile, SupportedLanguage } from "@/lib/ai/types";

// ─── POST /api/ai/recommend-services ─────────────────────────────────────────
// Ensemble AI (Gemini + Azure) service recommendations with MongoDB caching

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const validation = RecommendServicesSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { sessionId, profile: inputProfile } = validation.data;

    // ── Load session profile ──────────────────────────────────────────────────
    const session = await Session.findOne({ sessionId });
    const sessionData = session?.profile as Record<string, unknown> | undefined || {};
    
    const profile: SessionProfile = {
      preferredLanguage: (inputProfile?.preferredLanguage || (sessionData.preferredLanguage as string) || "en") as SupportedLanguage,
      state: inputProfile?.state || (sessionData.state as string | undefined),
      district: inputProfile?.district || (sessionData.district as string | undefined),
      age: inputProfile?.age || (sessionData.age as number | undefined),
      category: (inputProfile?.category || (sessionData.category as string) || "general") as SessionProfile["category"],
      income: inputProfile?.income || (sessionData.income as number | undefined),
      occupation: inputProfile?.occupation || (sessionData.occupation as string | undefined),
      gender: inputProfile?.gender as "male" | undefined,
    };

    // ── Check cache (24-hour TTL) ─────────────────────────────────────────────
    const cacheKey = generateCacheKey(
      "service_recommendation",
      sessionId,
      JSON.stringify(profile)
    );

    const cached = await getCached<ReturnType<typeof ensembleRecommendServices>>(cacheKey);
    if (cached) {
      return NextResponse.json({ ...cached, fromCache: true });
    }

    // ── Run ensemble recommendation ───────────────────────────────────────────
    const ensembleResult = await ensembleRecommendServices(profile);

    // ── Enrich with MongoDB service data ──────────────────────────────────────
    const serviceNames = ensembleResult.result.map((r) => r.name);
    const dbServices = await Service.find({
      name: { $in: serviceNames },
      isActive: true,
    }).lean();

    const enriched = ensembleResult.result.map((rec) => {
      const dbService = dbServices.find(
        (s) => s.name.toLowerCase() === rec.name.toLowerCase()
      );
      return {
        ...rec,
        serviceId: dbService?._id?.toString(),
        category: dbService?.category || rec.category,
        ministry: dbService?.ministry,
        applicationUrl: rec.applicationUrl || dbService?.applicationUrl,
        helplineNumber: dbService?.helplineNumber,
        documents: dbService?.documents || [],
      };
    });

    const response = {
      recommendations: enriched,
      confidence: ensembleResult.confidence,
      agreedBy: ensembleResult.agreedBy,
      arbitratedBy: ensembleResult.arbitratedBy,
      profile: {
        state: profile.state,
        category: profile.category,
        age: profile.age,
        income: profile.income,
      },
      fromCache: false,
    };

    // ── Cache for 24 hours ────────────────────────────────────────────────────
    await setCache(cacheKey, "service_recommendation", response, ensembleResult.agreedBy, 24, ensembleResult.confidence);

    return NextResponse.json(response);
  } catch (err) {
    console.error("Service recommendation error:", err);
    return NextResponse.json(
      { error: "Failed to generate recommendations", message: (err as Error).message },
      { status: 500 }
    );
  }
}
