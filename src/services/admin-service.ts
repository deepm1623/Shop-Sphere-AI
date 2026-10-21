import type { Order, OrderStatus } from "@/types/domain";
import type { Product } from "@/types/product";
import { readLocal, writeLocal } from "./local-storage";
import { readOrders } from "./order-service";

const productsKey = "shopsphere-admin-products";
const categoriesKey = "shopsphere-admin-categories";
const orderKey = "shopsphere-orders";
export const LOW_STOCK_THRESHOLD = 5;
export const statusProgression: OrderStatus[] = ["placed", "confirmed", "packed", "shipped", "out-for-delivery", "delivered"];
export function readAdminProducts(seed: Product[]): Product[] { return readLocal(productsKey, seed); }
export function saveAdminProducts(products: Product[]): void { writeLocal(productsKey, products); }
export function validateProduct(product: Partial<Product>): string | null {
  if (!product.title?.trim() || !product.category?.trim()) return "Title and category are required.";
  if (!Number.isFinite(Number(product.price)) || Number(product.price) < 0) return "Price must be a non-negative number.";
  if (product.rating !== undefined && (!Number.isFinite(Number(product.rating)) || Number(product.rating) < 0 || Number(product.rating) > 5)) return "Rating must be between 0 and 5.";
  if (!Number.isInteger(Number(product.stock)) || Number(product.stock) < 0) return "Stock must be a non-negative whole number.";
  if (product.discountPercentage !== undefined && (!Number.isFinite(Number(product.discountPercentage)) || Number(product.discountPercentage) < 0 || Number(product.discountPercentage) > 100)) return "Discount must be between 0 and 100.";
  return null;
}
export function createAdminProduct(product: Product, existing: Product[]): Product[] {
  const error = validateProduct(product);
  if (error) throw new Error(error);
  if (existing.some((item) => item.id === product.id)) throw new Error("A product with this ID already exists.");
  return [...existing, product];
}
export function updateAdminProduct(product: Product, existing: Product[]): Product[] {
  const error = validateProduct(product);
  if (error) throw new Error(error);
  if (!existing.some((item) => item.id === product.id)) throw new Error("Product not found.");
  return existing.map((item) => item.id === product.id ? product : item);
}
export function deleteAdminProduct(productId: number, existing: Product[]): Product[] {
  if (!existing.some((item) => item.id === productId)) throw new Error("Product not found.");
  if (readOrders().some((order) => order.items.some((item) => item.product.id === productId))) {
    throw new Error("Product is referenced by an order and cannot be deleted.");
  }
  return existing.filter((item) => item.id !== productId);
}
export function readAdminCategories(seed: string[]): string[] { return readLocal(categoriesKey, [...new Set(seed.filter(Boolean))]); }
export function saveAdminCategories(categories: string[]): void { writeLocal(categoriesKey, [...new Set(categories.map((category) => category.trim()).filter(Boolean))]); }
export function validateCategory(category: string, existing: string[], original?: string): string | null {
  const normalized = category.trim().toLowerCase();
  if (!normalized) return "Category name is required.";
  if (existing.some((item) => item.trim().toLowerCase() === normalized && item !== original)) return "That category already exists.";
  return null;
}
export function renameAdminCategory(original: string, next: string, categories: string[], products: Product[]): { categories: string[]; products: Product[] } {
  const error = validateCategory(next, categories, original);
  if (error) throw new Error(error);
  if (!categories.includes(original)) throw new Error("Category not found.");
  return { categories: categories.map((category) => category === original ? next.trim() : category), products: products.map((product) => product.category === original ? { ...product, category: next.trim() } : product) };
}
export function deleteAdminCategory(category: string, replacement: string | undefined, categories: string[], products: Product[]): { categories: string[]; products: Product[] } {
  const assigned = products.some((product) => product.category === category);
  if (assigned && (!replacement || replacement === category)) throw new Error("Reassign products before deleting this category.");
  if (replacement && !categories.includes(replacement)) throw new Error("Replacement category not found.");
  return { categories: categories.filter((item) => item !== category), products: products.map((product) => product.category === category && replacement ? { ...product, category: replacement } : product) };
}
export type OrderFilters = { status?: OrderStatus | "all"; customerId?: string; from?: string; to?: string };
export function filterAdminOrders(orders: Order[], filters: OrderFilters): Order[] {
  return orders.filter((order) =>
    (!filters.status || filters.status === "all" || order.status === filters.status) &&
    (!filters.customerId || order.customerId.toLowerCase().includes(filters.customerId.toLowerCase())) &&
    (!filters.from || order.createdAt.slice(0, 10) >= filters.from) &&
    (!filters.to || order.createdAt.slice(0, 10) <= filters.to),
  );
}
export function getAdminOrder(orderId: string, orders: Order[]): Order | null { return orders.find((order) => order.id === orderId) ?? null; }
export function advanceOrder(orderId: string): Order | null {
  const orders = readOrders(); const order = orders.find((item) => item.id === orderId); if (!order) return null;
  const index = statusProgression.indexOf(order.status); if (index < 0 || index >= statusProgression.length - 1) return order;
  const updated = { ...order, status: statusProgression[index + 1], updatedAt: new Date().toISOString() };
  writeLocal(orderKey, orders.map((item) => item.id === orderId ? updated : item)); return updated;
}
