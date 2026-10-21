import { describe, expect, it } from "vitest";
import { summarizeRecommendationEvents } from "@/services/analytics-service";

describe("local analytics", () => {
  it("summarizes local recommendation events", () => {
    const result = summarizeRecommendationEvents([
      { type: "impression", strategy: "trending", productId: 1, at: "" },
      { type: "click", strategy: "trending", productId: 1, at: "" },
      { type: "conversion", strategy: "trending", productId: 1, at: "" },
    ]);
    expect(result).toEqual({ impressions: 1, clicks: 1, conversions: 1, conversionRate: 1 });
  });
});
