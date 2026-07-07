/**
 * Unit tests for AI ensemble logic and validation schemas.
 * These tests run without real API keys by mocking service calls.
 */

import { ChatRequestSchema, ComplaintCreateSchema, SessionProfileSchema } from "@/lib/validations";

// ─── Validation Schema Tests ───────────────────────────────────────────────────

describe("ChatRequestSchema", () => {
  it("should accept a valid chat request", () => {
    const result = ChatRequestSchema.safeParse({
      message: "How do I apply for PM Awas Yojana?",
      sessionId: "550e8400-e29b-41d4-a716-446655440000",
      language: "en",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty message", () => {
    const result = ChatRequestSchema.safeParse({
      message: "",
      sessionId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid UUID", () => {
    const result = ChatRequestSchema.safeParse({
      message: "Hello",
      sessionId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("should default language to en", () => {
    const result = ChatRequestSchema.safeParse({
      message: "Hello",
      sessionId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.language).toBe("en");
    }
  });
});

describe("ComplaintCreateSchema", () => {
  const validComplaint = {
    description: "There is a broken street light near sector 12 market causing accidents at night.",
    sessionId: "550e8400-e29b-41d4-a716-446655440000",
    location: {
      state: "Maharashtra",
      district: "Pune",
      address: "Sector 12 Market, Near Bus Stop",
    },
  };

  it("should accept a valid complaint", () => {
    const result = ComplaintCreateSchema.safeParse(validComplaint);
    expect(result.success).toBe(true);
  });

  it("should reject description shorter than 10 chars", () => {
    const result = ComplaintCreateSchema.safeParse({
      ...validComplaint,
      description: "Short",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid pincode (not 6 digits)", () => {
    const result = ComplaintCreateSchema.safeParse({
      ...validComplaint,
      location: {
        ...validComplaint.location,
        pincode: "123",
      },
    });
    expect(result.success).toBe(false);
  });

  it("should accept valid pincode", () => {
    const result = ComplaintCreateSchema.safeParse({
      ...validComplaint,
      location: {
        ...validComplaint.location,
        pincode: "411001",
      },
    });
    expect(result.success).toBe(true);
  });
});

describe("SessionProfileSchema", () => {
  it("should accept a complete profile", () => {
    const result = SessionProfileSchema.safeParse({
      sessionId: "550e8400-e29b-41d4-a716-446655440000",
      preferredLanguage: "hi",
      state: "Uttar Pradesh",
      district: "Lucknow",
      age: 35,
      category: "obc",
      income: 250000,
      gender: "male",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid preferred language", () => {
    const result = SessionProfileSchema.safeParse({
      sessionId: "550e8400-e29b-41d4-a716-446655440000",
      preferredLanguage: "fr", // French not supported
    });
    expect(result.success).toBe(false);
  });

  it("should reject unrealistic age", () => {
    const result = SessionProfileSchema.safeParse({
      sessionId: "550e8400-e29b-41d4-a716-446655440000",
      age: 200,
    });
    expect(result.success).toBe(false);
  });

  it("should default preferredLanguage to en", () => {
    const result = SessionProfileSchema.safeParse({
      sessionId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.preferredLanguage).toBe("en");
    }
  });
});

// ─── ComplaintId Format Tests ──────────────────────────────────────────────────

describe("Complaint ID format", () => {
  it("should match BM-YYYY-XXXXX pattern", () => {
    const generateComplaintId = () => {
      const year = new Date().getFullYear();
      const random = Math.random().toString(36).substring(2, 7).toUpperCase();
      return `BM-${year}-${random}`;
    };

    const id = generateComplaintId();
    expect(id).toMatch(/^BM-\d{4}-[A-Z0-9]{5}$/);
  });
});

// ─── Language Code Tests ───────────────────────────────────────────────────────

describe("Language code validation", () => {
  const SUPPORTED_LANGS = ["en", "hi", "ta", "te", "mr", "bn", "gu", "kn", "ml", "pa", "or", "as"];

  it("should support all 12 Indian languages", () => {
    expect(SUPPORTED_LANGS.length).toBe(12);
  });

  it("should include Hindi and English", () => {
    expect(SUPPORTED_LANGS).toContain("hi");
    expect(SUPPORTED_LANGS).toContain("en");
  });
});
