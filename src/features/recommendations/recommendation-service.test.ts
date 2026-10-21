import { describe, expect, it } from "vitest";
import { getRecommendations, normalizedWeightedScore } from "@/features/recommendations/recommendation-service";
import type { Product } from "@/types/product";

const products: Product[] = [
  { id: 1, title: "Running Shoes", description: "running footwear", category: "mens-shoes", price: 40, discountPercentage: 0, rating: 4.5, stock: 4, tags: ["running", "sport"], thumbnail: "", images: [] },
  { id: 2, title: "Sport Backpack", description: "running bag", category: "mens-shoes", price: 45, discountPercentage: 0, rating: 4.2, stock: 4, tags: ["running"], thumbnail: "", images: [] },
  { id: 3, title: "Unavailable Shoes", description: "", category: "mens-shoes", price: 42, discountPercentage: 0, rating: 5, stock: 0, tags: ["running"], thumbnail: "", images: [] },
  { id: 4, title: "Desk Lamp", description: "", category: "home-decoration", price: 10, discountPercentage: 0, rating: 3, stock: 4, tags: ["home"], thumbnail: "", images: [] },
];

describe("recommendation provider", () => {
  it.each(["recently-viewed", "similar", "category-based", "price-based", "wishlist-based", "cart-based", "frequently-bought-together", "trending", "personalized"] as const)("supports %s", (strategy) => {
    const result = getRecommendations(strategy, products, { viewedProductIds: [1], wishlistIds: [1], cartItems: [] }, products[0]);
    expect(result.every((item) => item.product.stock > 0)).toBe(true);
    expect(new Set(result.map((item) => item.product.id)).size).toBe(result.length);
  });

  it("normalizes the weighted score and explains positive signals", () => {
    const score = normalizedWeightedScore(products[1], { viewedProductIds: [1] }, [products[0]]);
    expect(score.score).toBeGreaterThanOrEqual(0);
    expect(score.score).toBeLessThanOrEqual(1);
    expect(score.reasons.length).toBeGreaterThan(0);
  });

  it("falls back safely with empty history", () => {
    expect(getRecommendations("trending", products, { viewedProductIds: [] })).toHaveLength(3);
  });
});
