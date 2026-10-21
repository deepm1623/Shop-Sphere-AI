import { describe, expect, it } from "vitest";
import { calculateCartTotals, cartItemCount } from "./cart-utils";
import type { CartItem } from "@/types/domain";

const item: CartItem = {
  product: {
    id: 1, title: "Runner", description: "", category: "mens-shoes", price: 100, discountPercentage: 10,
    rating: 4.5, stock: 3, thumbnail: "", images: [],
  },
  quantity: 2,
  unitPrice: 90,
  originalUnitPrice: 100,
  addedAt: "2026-10-19T00:00:00.000Z",
};

describe("cart utilities", () => {
  it("calculates subtotal, discount, provisional shipping, tax, and total", () => {
    expect(calculateCartTotals([item])).toEqual({
      subtotal: 180,
      discount: 20,
      shipping: 99,
      tax: 14,
      total: 293,
    });
  });

  it("counts quantities and returns zero totals for an empty cart", () => {
    expect(cartItemCount([item, { ...item, product: { ...item.product, id: 2 }, quantity: 1 }])).toBe(3);
    expect(calculateCartTotals([])).toEqual({ subtotal: 0, discount: 0, shipping: 0, tax: 0, total: 0 });
  });
});
