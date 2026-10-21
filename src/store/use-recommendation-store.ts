"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type RecommendationEvent = { type: "impression" | "click" | "conversion"; strategy: string; productId: number; at: string };
type RecommendationState = {
  viewedProductIds: number[];
  events: RecommendationEvent[];
  recordViewed: (id: number) => void;
  recordEvent: (event: Omit<RecommendationEvent, "at">) => void;
  resetSignals: () => void;
};

export const useRecommendationStore = create<RecommendationState>()(persist((set) => ({
  viewedProductIds: [],
  events: [],
  recordViewed: (id) => set((state) => ({ viewedProductIds: [id, ...state.viewedProductIds.filter((item) => item !== id)].slice(0, 20) })),
  recordEvent: (event) => set((state) => ({ events: [...state.events, { ...event, at: new Date().toISOString() }].slice(-500) })),
  resetSignals: () => set({ viewedProductIds: [], events: [] }),
}), { name: "shopsphere-recommendation-signals" }));
