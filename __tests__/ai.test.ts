import { ensembleCategorizeComplaint, ensembleRecommendServices, multilingualPipeline } from "@/lib/ai/ensemble";
import { geminiCategorizeComplaint, geminiRecommendServices } from "@/lib/ai/gemini";
import { azureCategorizeComplaint, azureRecommendServices } from "@/lib/ai/azure";
import { detectLanguage, translateText } from "@/lib/ai/sarvam";

// Mock the AI modules
jest.mock("@/lib/ai/gemini", () => ({
  geminiCategorizeComplaint: jest.fn(),
  geminiRecommendServices: jest.fn(),
}));

jest.mock("@/lib/ai/azure", () => ({
  azureCategorizeComplaint: jest.fn(),
  azureRecommendServices: jest.fn(),
}));

jest.mock("@/lib/ai/sarvam", () => ({
  detectLanguage: jest.fn(),
  translateText: jest.fn(),
}));

describe("AI Ensemble & Pipelines", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("ensembleCategorizeComplaint", () => {
    const mockComplaint = {
      description: "Broken water pipeline flooding Sector 4 street.",
      location: {
        state: "Karnataka",
        district: "Bangalore",
        address: "123 Main St",
      },
      language: "en",
    };

    it("should merge results and escalate severity when both models succeed", async () => {
      (geminiCategorizeComplaint as jest.Mock).mockResolvedValue({
        category: "water",
        subCategory: "leakage",
        severity: "medium",
        formalDescription: "Dear Sir, ...",
        suggestedDepartment: "Water Supply Board",
        keywords: ["water", "leak"],
      });

      (azureCategorizeComplaint as jest.Mock).mockResolvedValue({
        category: "water",
        subCategory: "leakage",
        severity: "high", // Escalates from medium -> high
        formalDescription: "Dear Respected Officer, ...",
        suggestedDepartment: "Water Works Department",
        keywords: ["flooding", "leak"],
      });

      const response = await ensembleCategorizeComplaint(mockComplaint.description);

      expect(response.confidence).toBe("HIGH");
      expect(response.result.severity).toBe("high"); // Escalated
      expect(response.result.suggestedDepartment).toBe("Water Supply Board");
      expect(response.agreedBy).toContain("gemini-2.0-flash");
      expect(response.agreedBy).toContain("azure-o4-mini");
    });

    it("should fallback to Azure when Gemini categorization fails", async () => {
      (geminiCategorizeComplaint as jest.Mock).mockRejectedValue(new Error("Gemini quota exceeded"));
      (azureCategorizeComplaint as jest.Mock).mockResolvedValue({
        category: "roads",
        subCategory: "pothole",
        severity: "medium",
        formalDescription: "Formal complaint body",
        suggestedDepartment: "Municipal Roads Division",
        keywords: ["pothole"],
      });

      const response = await ensembleCategorizeComplaint(mockComplaint.description);

      expect(response.confidence).toBe("LOW");
      expect(response.result.category).toBe("roads");
      expect(response.agreedBy).toEqual(["azure-o4-mini"]);
    });

    it("should throw error if both models fail", async () => {
      (geminiCategorizeComplaint as jest.Mock).mockRejectedValue(new Error("Gemini fail"));
      (azureCategorizeComplaint as jest.Mock).mockRejectedValue(new Error("Azure fail"));

      await expect(ensembleCategorizeComplaint(mockComplaint.description)).rejects.toThrow();
    });
  });

  describe("ensembleRecommendServices", () => {
    const mockProfile = {
      sessionId: "550e8400-e29b-41d4-a716-446655440000",
      preferredLanguage: "en" as const,
      age: 65,
      income: 150000,
      category: "general" as const,
    };

    it("should merge, deduplicate, and boost relevance score of shared recommendations", async () => {
      (geminiRecommendServices as jest.Mock).mockResolvedValue([
        { name: "Pradhan Mantri Awas Yojana", relevanceScore: 80, reason: "Awas help" },
        { name: "National Pension System", relevanceScore: 70, reason: "Old age help" },
      ]);

      (azureRecommendServices as jest.Mock).mockResolvedValue([
        { name: "National Pension System", relevanceScore: 75, reason: "Retirement support" },
        { name: "Indira Gandhi National Old Age Pension Scheme", relevanceScore: 85, reason: "Senior assistance" },
      ]);

      const response = await ensembleRecommendServices(mockProfile);

      expect(response.confidence).toBe("HIGH");
      expect(response.agreedBy).toContain("gemini-2.0-flash");
      expect(response.agreedBy).toContain("azure-o4-mini");

      // Shared item: "National Pension System" relevanceScore should be boosted by 20% (70 * 1.2 = 84)
      const npsRec = response.result.find((r) => r.name === "National Pension System");
      expect(npsRec).toBeDefined();
      expect(npsRec!.relevanceScore).toBe(84); // 70 * 1.2
    });
  });

  describe("multilingualPipeline", () => {
    it("should translate query to English, process it, and translate response back", async () => {
      (detectLanguage as jest.Mock).mockResolvedValue("hi-IN");
      (translateText as jest.Mock)
        .mockResolvedValueOnce({ translatedText: "Help with housing scheme" }) // hi -> en
        .mockResolvedValueOnce({ translatedText: "यह आवास योजना की जानकारी है।" }); // en -> hi response

      const mockProcessor = jest.fn().mockResolvedValue("This is info about housing schemes.");

      const result = await multilingualPipeline(
        "आवास योजना में मदद करें",
        mockProcessor,
        "hi"
      );

      expect(detectLanguage).toHaveBeenCalledWith("आवास योजना में मदद करें");
      expect(translateText).toHaveBeenCalledWith("आवास योजना में मदद करें", "hi", "en");
      expect(mockProcessor).toHaveBeenCalledWith("Help with housing scheme");
      expect(result.translatedResponse).toBe("यह आवास योजना की जानकारी है।");
    });
  });
});
