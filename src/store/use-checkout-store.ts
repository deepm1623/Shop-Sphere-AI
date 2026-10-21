"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CheckoutState, DeliveryMethod, ShippingAddress } from "@/types/domain";

type CheckoutStore = {
  checkout: CheckoutState;
  hydrated: boolean;
  setCheckoutId: (checkoutId: string) => void;
  setStep: (step: CheckoutState["step"]) => void;
  setCustomer: (customer: CheckoutState["customer"]) => void;
  setAddress: (address: ShippingAddress) => void;
  setDeliveryMethod: (method: DeliveryMethod) => void;
  setPaymentMethod: (method: NonNullable<CheckoutState["paymentMethod"]>) => void;
  reset: () => void;
  setHydrated: (hydrated: boolean) => void;
};

const initialCheckout: CheckoutState = { step: 1, customer: { name: "", email: "", phone: "" } };

export const useCheckoutStore = create<CheckoutStore>()(
  persist(
    (set) => ({
      checkout: initialCheckout,
      hydrated: false,
      setCheckoutId: (checkoutId) => set((state) => ({ checkout: { ...state.checkout, checkoutId } })),
      setStep: (step) => set((state) => ({ checkout: { ...state.checkout, step } })),
      setCustomer: (customer) => set((state) => ({ checkout: { ...state.checkout, customer } })),
      setAddress: (address) => set((state) => ({ checkout: { ...state.checkout, address } })),
      setDeliveryMethod: (deliveryMethod) => set((state) => ({ checkout: { ...state.checkout, deliveryMethod } })),
      setPaymentMethod: (paymentMethod) => set((state) => ({ checkout: { ...state.checkout, paymentMethod } })),
      reset: () => set({ checkout: initialCheckout }),
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: "shopsphere-checkout",
      partialize: (state) => ({ checkout: state.checkout }),
      skipHydration: true,
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
);
