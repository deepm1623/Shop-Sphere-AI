import { describe, expect, it } from "vitest";
import { assistantResponse, parseAssistantIntent, resolveAssistantProducts } from "@/features/assistant/assistant-parser";
import type { Product } from "@/types/product";

const products: Product[] = [
  { id: 1, title: "Studio Headphones", description: "blue headphones", category: "audio", price: 40, discountPercentage: 0, rating: 4.5, stock: 2, tags: ["blue"], thumbnail: "", images: [] },
  { id: 2, title: "Basic Headphones", description: "", category: "audio", price: 20, discountPercentage: 0, rating: 3.5, stock: 2, tags: [], thumbnail: "", images: [] },
];

describe("shopping assistant parser", () => {
  it("extracts category, price, rating, and color", () => {
    const intent = parseAssistantIntent("Show me blue headphones under 5000 with good ratings");
    expect(intent.category).toBe("audio");
    expect(intent.maxPrice).toBeCloseTo(5000 / 84);
    expect(intent.minRating).toBe(4);
    expect(intent.color).toBe("blue");
  });

  it("retains context for refinements and replaces it on topic changes", () => {
    const previous = parseAssistantIntent("headphones under 5000");
    expect(parseAssistantIntent("show me something with better ratings", previous)).toMatchObject({ category: "audio", maxPrice: 5000 / 84, refinement: "better-rated" });
    expect(parseAssistantIntent("show me laptops instead", previous).category).toBe("laptops");
  });

  it("does not return unrelated products for ambiguous input", () => {
    const intent = parseAssistantIntent("hmm not sure");
    expect(resolveAssistantProducts(products, intent)).toEqual([]);
    expect(assistantResponse(intent, 0)).toContain("help you find");
  });
});
