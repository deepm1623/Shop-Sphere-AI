import { isAddressValid, isCheckoutCustomerValid } from "@/features/checkout/checkout-page";
import { describe, expect, it } from "vitest";

describe("checkout validation", () => {
  it("requires customer contact details", () => {
    expect(isCheckoutCustomerValid({ name: "", email: "bad", phone: "1" })).toBe(false);
    expect(isCheckoutCustomerValid({ name: "Demo", email: "demo@example.com", phone: "1234567" })).toBe(true);
  });

  it("requires a complete shipping address", () => {
    expect(isAddressValid()).toBe(false);
    expect(isAddressValid({ id: "a", fullName: "Demo", line1: "1 Main", city: "Pune", state: "MH", postalCode: "411001", country: "India" })).toBe(true);
  });
});
