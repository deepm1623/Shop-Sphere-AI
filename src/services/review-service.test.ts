import { beforeEach, describe, expect, it } from "vitest";
import { hasVerifiedPurchase, reviewsForProduct, submitReview, validateReviewInput, voteReview } from "@/services/review-service";
import type { CartItem, Order } from "@/types/domain";

const item = { product: { id: 7, title: "Item", description: "", category: "test", price: 1, discountPercentage: 0, rating: 4, stock: 1, thumbnail: "", images: [] }, quantity: 1, unitPrice: 1, originalUnitPrice: 1, addedAt: "" } as CartItem;
describe("review service", () => {
  beforeEach(() => window.localStorage.clear());
  it("validates and prevents a second review for the same customer/product", () => {
    expect(validateReviewInput({ rating: 6, title: "x", body: "too short" })).toContain("1 to 5");
    const review = submitReview({ productId: 7, customerId: "u", customerName: "U", rating: 5, title: "Good", body: "This review is long enough." , verifiedPurchase: false });
    expect(review.status).toBe("pending");
    submitReview({ productId: 7, customerId: "u", customerName: "U", rating: 4, title: "Updated", body: "This updated review is long enough.", verifiedPurchase: false });
    expect(reviewsForProduct(7)).toHaveLength(0);
  });
  it("detects verified purchases and supports helpful voting", () => {
    const order = { customerId: "u", items: [item] } as Order;
    expect(hasVerifiedPurchase("u", 7, [order])).toBe(true);
    const review = submitReview({ productId: 7, customerId: "u", customerName: "U", rating: 5, title: "Good", body: "This review is long enough.", verifiedPurchase: true });
    voteReview(review.id, true);
    expect(JSON.parse(window.localStorage.getItem("shopsphere-reviews") ?? "[]")[0].helpful).toBe(1);
  });
});
