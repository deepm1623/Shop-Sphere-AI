"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types/domain";
import type { Product } from "@/types/product";

type ShopState = {
  wishlist: number[];
  recentSearches: string[];
  cart: CartItem[];
  savedForLater: CartItem[];
  comparison: Product[];
  hydrated: boolean;
  toggleWishlist: (id: number) => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  addToCart: (product: Product, quantity?: number) => void;
  updateCartQuantity: (productId: number, quantity: number, stockLimit?: number) => void;
  removeFromCart: (productId: number) => void;
  saveForLater: (productId: number) => void;
  moveToCart: (productId: number) => void;
  toggleComparison: (product: Product) => void;
  removeComparison: (productId: number) => void;
  clearComparison: () => void;
  setHydrated: (hydrated: boolean) => void;
};

export const useShopStore = create<ShopState>()(
  persist(
    (set) => ({
      wishlist: [],
      recentSearches: [],
      cart: [],
      savedForLater: [],
      comparison: [],
      hydrated: false,
      toggleWishlist: (id) =>
        set((state) => ({
          wishlist: state.wishlist.includes(id)
            ? state.wishlist.filter((item) => item !== id)
            : [...state.wishlist, id],
        })),
      addRecentSearch: (query) =>
        set((state) => ({
          recentSearches: [query, ...state.recentSearches.filter((item) => item !== query)].slice(0, 5),
        })),
      clearRecentSearches: () => set({ recentSearches: [] }),
      addToCart: (product, quantity = 1) =>
        set((state) => {
          const existing = state.cart.find((item) => item.product.id === product.id);
          const nextQuantity = Math.min(product.stock, (existing?.quantity ?? 0) + quantity);
          if (nextQuantity <= 0) return state;
          return {
            cart: existing
              ? state.cart.map((item) =>
                  item.product.id === product.id
                    ? { ...item, product, quantity: nextQuantity, unitPrice: product.price * 84 * (1 - product.discountPercentage / 100), originalUnitPrice: product.price * 84 }
                    : item,
                )
              : [...state.cart, { product, quantity: nextQuantity, unitPrice: product.price * 84 * (1 - product.discountPercentage / 100), originalUnitPrice: product.price * 84, addedAt: new Date().toISOString() }],
          };
        }),
      updateCartQuantity: (productId, quantity, stockLimit) =>
        set((state) => ({
          cart: state.cart.map((item) =>
            item.product.id === productId
              ? { ...item, quantity: Math.max(1, Math.min(stockLimit ?? item.product.stock, quantity)) }
              : item,
          ),
        })),
      removeFromCart: (productId) =>
        set((state) => ({ cart: state.cart.filter((item) => item.product.id !== productId) })),
      saveForLater: (productId) =>
        set((state) => {
          const item = state.cart.find((entry) => entry.product.id === productId);
          if (!item) return state;
          return {
            cart: state.cart.filter((entry) => entry.product.id !== productId),
            savedForLater: [...state.savedForLater.filter((entry) => entry.product.id !== productId), { ...item, savedForLater: true }],
          };
        }),
      moveToCart: (productId) =>
        set((state) => {
          const item = state.savedForLater.find((entry) => entry.product.id === productId);
          if (!item) return state;
          const existing = state.cart.find((entry) => entry.product.id === productId);
          const quantity = Math.min(item.product.stock, (existing?.quantity ?? 0) + item.quantity);
          return {
            savedForLater: state.savedForLater.filter((entry) => entry.product.id !== productId),
            cart: existing
              ? state.cart.map((entry) => entry.product.id === productId ? { ...entry, quantity } : entry)
              : [...state.cart, { ...item, quantity, savedForLater: false }],
          };
        }),
      toggleComparison: (product) =>
        set((state) => state.comparison.some((item) => item.id === product.id)
          ? { comparison: state.comparison.filter((item) => item.id !== product.id) }
          : state.comparison.length >= 4 ? state : { comparison: [...state.comparison, product] }),
      removeComparison: (productId) =>
        set((state) => ({ comparison: state.comparison.filter((item) => item.id !== productId) })),
      clearComparison: () => set({ comparison: [] }),
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: "shopsphere-preferences",
      skipHydration: true,
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
);
