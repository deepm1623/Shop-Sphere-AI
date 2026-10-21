import seedReviews from "@/data/reviews.json";
import type { Order, ProductReview, ReviewStatus } from "@/types/domain";
import { readLocal, writeLocal } from "./local-storage";

const key = "shopsphere-reviews";
export type ReviewSort = "recent" | "highest" | "lowest" | "helpful";
export const REVIEW_MIN_LENGTH = 10;
export const REVIEW_MAX_LENGTH = 1000;

export function readReviews(): ProductReview[] { return readLocal(key, seedReviews as ProductReview[]); }
export function reviewsForProduct(productId: number, sort: ReviewSort = "recent"): ProductReview[] {
  const reviews = readReviews().filter((review) => review.productId === productId && review.status === "approved");
  return [...reviews].sort((a, b) => sort === "highest" ? b.rating - a.rating : sort === "lowest" ? a.rating - b.rating : sort === "helpful" ? b.helpful - a.helpful : b.createdAt.localeCompare(a.createdAt));
}
export function hasVerifiedPurchase(customerId: string, productId: number, orders: Order[]): boolean {
  return orders.some((order) => order.customerId === customerId && order.items.some((item) => item.product.id === productId));
}
export function validateReviewInput(input: { rating: number; title: string; body: string }): string | null {
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) return "Choose a rating from 1 to 5.";
  if (!input.title.trim()) return "Add a review title.";
  if (input.body.trim().length < REVIEW_MIN_LENGTH) return `Review must be at least ${REVIEW_MIN_LENGTH} characters.`;
  if (input.body.trim().length > REVIEW_MAX_LENGTH) return `Review must be no more than ${REVIEW_MAX_LENGTH} characters.`;
  return null;
}
export function submitReview(input: Omit<ProductReview, "id" | "status" | "helpful" | "notHelpful" | "createdAt">): ProductReview {
  const review: ProductReview = { ...input, id: `review-${Date.now()}`, status: "pending", helpful: 0, notHelpful: 0, createdAt: new Date().toISOString() };
  writeLocal(key, [review, ...readReviews().filter((item) => !(item.productId === input.productId && item.customerId === input.customerId))]);
  return review;
}
export function voteReview(id: string, helpful: boolean): void {
  writeLocal(key, readReviews().map((review) => review.id === id ? { ...review, helpful: review.helpful + (helpful ? 1 : 0), notHelpful: review.notHelpful + (helpful ? 0 : 1) } : review));
}
export function setReviewStatus(id: string, status: ReviewStatus): void {
  writeLocal(key, readReviews().map((review) => review.id === id ? { ...review, status } : review));
}
