import type { CartItem, Order, PricingBreakdown, ShippingAddress } from "@/types/domain";
import seedOrders from "@/data/orders.json";

const STORAGE_KEY = "shopsphere-orders";

export function readOrders(): Order[] {
  if (typeof window === "undefined") return [];
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value ? JSON.parse(value) as Order[] : seedOrders as Order[];
  } catch {
    return seedOrders as Order[];
  }
}

export function createOrder(input: { checkoutId: string; customerId: string; items: CartItem[]; pricing: PricingBreakdown; shippingAddress: ShippingAddress }): Order {
  const existingOrder = readOrders().find((order) => order.checkoutId === input.checkoutId && order.customerId === input.customerId);
  if (existingOrder) return existingOrder;
  const now = new Date().toISOString();
  const order: Order = { id: `SS-${Date.now().toString(36).toUpperCase()}`, ...input, status: "placed", createdAt: now, updatedAt: now };
  const orders = [order, ...readOrders()];
  if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  return order;
}

export function getOrdersForCustomer(customerId: string): Order[] {
  return readOrders().filter((order) => order.customerId === customerId);
}
