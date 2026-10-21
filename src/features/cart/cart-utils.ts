import type { CartItem, PricingBreakdown } from "@/types/domain";

export const PROVISIONAL_TAX_RATE = 0.05;
export const PROVISIONAL_SHIPPING_FEE = 99;

export function calculateCartTotals(items: CartItem[]): PricingBreakdown {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const undiscountedTotal = items.reduce((sum, item) => sum + (item.originalUnitPrice ?? item.unitPrice) * item.quantity, 0);
  const discount = Math.max(0, undiscountedTotal - subtotal);
  const shipping = items.length > 0 ? PROVISIONAL_SHIPPING_FEE : 0;
  const tax = Math.round((subtotal + shipping) * PROVISIONAL_TAX_RATE);
  return { subtotal, discount, shipping, tax, total: subtotal + shipping + tax };
}

export function cartItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
