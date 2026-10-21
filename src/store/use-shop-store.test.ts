import { beforeEach, describe, expect, it } from "vitest";
import { useShopStore } from "./use-shop-store";
import type { Product } from "@/types/product";

const product: Product = {
  id: 10, title: "Test product", description: "A test product", category: "beauty", price: 100,
  discountPercentage: 0, rating: 4, stock: 3, thumbnail: "", images: [],
};

beforeEach(() => {
  useShopStore.setState({ wishlist: [], recentSearches: [], cart: [], savedForLater: [], hydrated: true });
});

describe("cart store", () => {
  it("merges duplicate products and clamps quantity to stock", () => {
    useShopStore.getState().addToCart(product, 2);
    useShopStore.getState().addToCart(product, 5);

    expect(useShopStore.getState().cart).toHaveLength(1);
    expect(useShopStore.getState().cart[0].quantity).toBe(3);
  });

  it("updates, removes, saves, and restores cart items", () => {
    useShopStore.getState().addToCart(product);
    useShopStore.getState().updateCartQuantity(product.id, 2);
    useShopStore.getState().saveForLater(product.id);

    expect(useShopStore.getState().cart).toHaveLength(0);
    expect(useShopStore.getState().savedForLater[0].quantity).toBe(2);

    useShopStore.getState().moveToCart(product.id);
    expect(useShopStore.getState().cart[0].quantity).toBe(2);
    useShopStore.getState().removeFromCart(product.id);
    expect(useShopStore.getState().cart).toHaveLength(0);
  });
});
