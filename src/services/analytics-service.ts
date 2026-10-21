import type { RecommendationEvent } from "@/store/use-recommendation-store";

export function summarizeRecommendationEvents(events: RecommendationEvent[]) {
  return {
    impressions: events.filter((event) => event.type === "impression").length,
    clicks: events.filter((event) => event.type === "click").length,
    conversions: events.filter((event) => event.type === "conversion").length,
    conversionRate: events.filter((event) => event.type === "click").length === 0
      ? 0
      : events.filter((event) => event.type === "conversion").length / events.filter((event) => event.type === "click").length,
  };
}
