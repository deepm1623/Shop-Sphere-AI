import { beforeEach, describe, expect, it } from "vitest";
import { advanceOrder, createAdminProduct, deleteAdminCategory, deleteAdminProduct, filterAdminOrders, LOW_STOCK_THRESHOLD, readAdminProducts, renameAdminCategory, saveAdminProducts, statusProgression, validateProduct } from "@/services/admin-service";
import { validateAddress, validateProfile } from "@/services/profile-service";
import { hasRole } from "@/store/use-auth-store";

describe("account and admin rules", () => {
  beforeEach(() => window.localStorage.clear());
  it("validates profile, addresses, and products", () => {
    expect(validateProfile({ name: "", email: "bad" })).toBeTruthy();
    expect(validateAddress({ id: "1", fullName: "", line1: "", city: "", state: "", postalCode: "", country: "" })).toBeTruthy();
    expect(validateProduct({ title: "Lamp", category: "home", price: 10, stock: 2 })).toBeNull();
    expect(validateProduct({ title: "Lamp", category: "home", price: -1, rating: 4, stock: 2 })).toMatch(/price/i);
    expect(validateProduct({ title: "Lamp", category: "home", price: 10, rating: 6, stock: 2 })).toContain("Rating");
    expect(validateProduct({ title: "Lamp", category: "home", price: 10, rating: 4, stock: 1.5 })).toContain("whole");
  });
  it("uses the documented low-stock threshold and fixed order progression", () => {
    expect(LOW_STOCK_THRESHOLD).toBe(5);
    expect(statusProgression).toEqual(["placed", "confirmed", "packed", "shipped", "out-for-delivery", "delivered"]);
  });
  it("persists local product CRUD and advances local orders", () => {
    const product = { id: 1, title: "Lamp", description: "", category: "home", price: 10, discountPercentage: 0, rating: 4, stock: 2, thumbnail: "", images: [] };
    saveAdminProducts([product]);
    expect(readAdminProducts([])).toEqual([product]);
    window.localStorage.setItem("shopsphere-orders", JSON.stringify([{ id: "o1", customerId: "u", items: [], pricing: { subtotal: 0, discount: 0, shipping: 0, tax: 0, total: 0 }, shippingAddress: { id: "a", fullName: "U", line1: "x", city: "x", state: "x", postalCode: "x", country: "x" }, status: "placed", createdAt: "", updatedAt: "" }]));
    expect(advanceOrder("o1")?.status).toBe("confirmed");
  });

  it("supports product CRUD and protects missing or order-referenced products", () => {
    const product = { id: 1, title: "Lamp", description: "", category: "home", price: 10, discountPercentage: 0, rating: 4, stock: 2, thumbnail: "", images: [] };
    const created = createAdminProduct(product, []);
    expect(() => createAdminProduct(product, created)).toThrow("already exists");
    expect(() => deleteAdminProduct(99, created)).toThrow("not found");
    window.localStorage.setItem("shopsphere-orders", JSON.stringify([{
      id: "o1",
      customerId: "customer-1",
      items: [{ product, quantity: 1, unitPrice: 10 }],
      pricing: { subtotal: 10, discount: 0, shipping: 0, tax: 0, total: 10 },
      shippingAddress: { id: "a", fullName: "U", line1: "x", city: "x", state: "x", postalCode: "x", country: "x" },
      status: "placed",
      createdAt: "",
      updatedAt: "",
    }]));
    expect(() => deleteAdminProduct(1, created)).toThrow("referenced by an order");
    window.localStorage.removeItem("shopsphere-orders");
    expect(deleteAdminProduct(1, created)).toEqual([]);
  });

  it("renames categories with assigned products and requires reassignment before deletion", () => {
    const product = { id: 1, title: "Lamp", description: "", category: "home", price: 10, discountPercentage: 0, rating: 4, stock: 2, thumbnail: "", images: [] };
    const renamed = renameAdminCategory("home", "lighting", ["home", "garden"], [product]);
    expect(renamed.products[0].category).toBe("lighting");
    expect(() => deleteAdminCategory("lighting", undefined, renamed.categories, renamed.products)).toThrow("Reassign");
    const deleted = deleteAdminCategory("lighting", "garden", renamed.categories, renamed.products);
    expect(deleted.products[0].category).toBe("garden");
  });

  it("filters orders by status, customer, and date", () => {
    const base = { id: "o1", customerId: "customer-1", items: [], pricing: { subtotal: 0, discount: 0, shipping: 0, tax: 0, total: 0 }, shippingAddress: { id: "a", fullName: "U", line1: "x", city: "x", state: "x", postalCode: "x", country: "x" }, status: "shipped" as const, createdAt: "2026-10-20T10:00:00.000Z", updatedAt: "" };
    expect(filterAdminOrders([base, { ...base, id: "o2", customerId: "customer-2", status: "placed", createdAt: "2026-10-01T10:00:00.000Z" }], { status: "shipped", customerId: "customer-1", from: "2026-10-20", to: "2026-10-20" })).toHaveLength(1);
  });

  it("does not authorize customers for administrator operations", () => {
    const customer = { token: "token", expiresAt: new Date(Date.now() + 60_000).toISOString(), user: { id: "customer", name: "Customer", email: "customer@example.com", role: "customer" as const } };
    expect(hasRole(customer, "administrator")).toBe(false);
    expect(hasRole(null, "administrator")).toBe(false);
  });
});
