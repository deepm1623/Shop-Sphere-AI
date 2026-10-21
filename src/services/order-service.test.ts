import { createOrder, getOrdersForCustomer } from "@/services/order-service";
import type { CartItem, PricingBreakdown, ShippingAddress } from "@/types/domain";
import { beforeEach, describe, expect, it } from "vitest";

const item = { product: { id: 1, title: "Demo", description: "", category: "test", price: 10, discountPercentage: 0, rating: 4, stock: 2, tags: [], brand: "Demo", thumbnail: "", images: [] }, quantity: 1, unitPrice: 10, originalUnitPrice: 10, addedAt: new Date().toISOString() } as CartItem;
const pricing: PricingBreakdown = { subtotal: 10, discount: 0, shipping: 99, tax: 0.5, total: 109.5 };
const address: ShippingAddress = { id: "a", fullName: "Demo", line1: "1 Main", city: "Pune", state: "MH", postalCode: "411001", country: "India" };

describe("local orders", () => {
  beforeEach(() => window.localStorage.clear());

  it("creates and filters orders by customer", () => {
    const order = createOrder({ checkoutId: "checkout-1", customerId: "customer-1", items: [item], pricing, shippingAddress: address });
    expect(order.status).toBe("placed");
    expect(getOrdersForCustomer("customer-1")).toHaveLength(1);
    expect(getOrdersForCustomer("customer-2")).toHaveLength(0);
  });

  it("returns the existing order for a repeated checkout submission", () => {
    const input = { checkoutId: "checkout-repeat", customerId: "customer-1", items: [item], pricing, shippingAddress: address };
    const first = createOrder(input);
    const second = createOrder(input);
    expect(second.id).toBe(first.id);
    expect(getOrdersForCustomer("customer-1")).toHaveLength(1);
  });
});
