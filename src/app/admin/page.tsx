"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProducts } from "@/services/product-service";
import {
  createAdminProduct, deleteAdminCategory, deleteAdminProduct, advanceOrder, filterAdminOrders,
  getAdminOrder, LOW_STOCK_THRESHOLD, readAdminCategories, readAdminProducts, renameAdminCategory,
  saveAdminCategories, saveAdminProducts, statusProgression, updateAdminProduct, validateCategory, validateProduct,
} from "@/services/admin-service";
import { readOrders } from "@/services/order-service";
import { readReviews, setReviewStatus } from "@/services/review-service";
import { useRecommendationStore } from "@/store/use-recommendation-store";
import { summarizeRecommendationEvents } from "@/services/analytics-service";
import { ProtectedRoute } from "@/features/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Order, OrderStatus } from "@/types/domain";
import type { Product } from "@/types/product";

export default function AdminRoute() { return <ProtectedRoute role="administrator"><AdminDashboard /></ProtectedRoute>; }

type ProductForm = Pick<Product, "title" | "description" | "category" | "price" | "discountPercentage" | "rating" | "stock" | "brand">;
const emptyProduct: ProductForm = { title: "", description: "", category: "", price: 0, discountPercentage: 0, rating: 0, stock: 0, brand: "" };
const statuses: Array<OrderStatus | "all"> = ["all", ...statusProgression];

function AdminDashboard() {
  const query = useQuery({ queryKey: ["admin-products"], queryFn: () => getProducts() });
  const [products, setProducts] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<string[] | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyProduct);
  const [categoryInput, setCategoryInput] = useState("");
  const [categoryToDelete, setCategoryToDelete] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [orders, setOrders] = useState<Order[]>(readOrders());
  const [orderFilters, setOrderFilters] = useState({ status: "all" as OrderStatus | "all", customerId: "", from: "", to: "" });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState("");
  const events = useRecommendationStore((state) => state.events);
  const analytics = summarizeRecommendationEvents(events);
  const items = products ?? readAdminProducts(query.data?.products ?? []);
  const categoryList = categories ?? readAdminCategories(items.map((product) => product.category));
  const visibleProducts = items.filter((product) => `${product.title} ${product.brand ?? ""} ${product.category}`.toLowerCase().includes(productSearch.toLowerCase()));
  const visibleOrders = useMemo(() => filterAdminOrders(orders, orderFilters), [orders, orderFilters]);

  function saveProducts(next: Product[]) { setProducts(next); saveAdminProducts(next); setMessage("Product changes saved locally for this demo."); }
  function saveCategoryState(nextCategories: string[], nextProducts: Product[]) { setCategories(nextCategories); saveAdminCategories(nextCategories); saveProducts(nextProducts); }
  function startCreate() { setEditing(null); setForm(emptyProduct); }
  function startEdit(product: Product) { setEditing(product); setForm({ title: product.title, description: product.description, category: product.category, price: product.price, discountPercentage: product.discountPercentage, rating: product.rating, stock: product.stock, brand: product.brand ?? "" }); }
  function submitProduct(event: React.FormEvent) {
    event.preventDefault();
    const product: Product = { ...(editing ?? { id: Date.now(), thumbnail: "https://cdn.dummyjson.com/product-images/1/thumbnail.jpg", images: [] }), ...form, title: form.title.trim(), category: form.category.trim(), brand: form.brand?.trim() || undefined };
    const error = validateProduct(product);
    if (error) return setMessage(error);
    try { saveProducts(editing ? updateAdminProduct(product, items) : createAdminProduct(product, items)); setEditing(null); setMessage("Product changes saved locally for this demo."); } catch (caught) { setMessage(caught instanceof Error ? caught.message : "Unable to save product."); }
  }
  function addCategory(event: React.FormEvent) {
    event.preventDefault();
    const error = validateCategory(categoryInput, categoryList);
    if (error) return setMessage(error);
    const next = [...categoryList, categoryInput.trim()];
    saveCategoryState(next, items); setCategoryInput(""); setMessage("Category changes saved locally for this demo.");
  }
  function renameCategory(category: string) {
    const nextName = window.prompt(`Rename ${category}`, category);
    if (nextName === null) return;
    try { const result = renameAdminCategory(category, nextName, categoryList, items); saveCategoryState(result.categories, result.products); setMessage("Category and assigned products updated locally."); } catch (caught) { setMessage(caught instanceof Error ? caught.message : "Unable to rename category."); }
  }
  function removeCategory(category: string) {
    const replacement = items.some((product) => product.category === category) ? categoryToDelete || undefined : undefined;
    try { const result = deleteAdminCategory(category, replacement, categoryList, items); saveCategoryState(result.categories, result.products); setCategoryToDelete(""); setMessage("Category changes saved locally for this demo."); } catch (caught) { setMessage(caught instanceof Error ? caught.message : "Unable to delete category."); }
  }
  function removeProduct(id: number) {
    try { saveProducts(deleteAdminProduct(id, items)); setMessage("Product deleted locally for this demo."); } catch (caught) { setMessage(caught instanceof Error ? caught.message : "Unable to delete product."); }
  }
  function advance(orderId: string) { advanceOrder(orderId); setOrders(readOrders()); setSelectedOrder(getAdminOrder(orderId, readOrders())); setMessage("Order status updated locally for this demo."); }

  return <main className="min-h-screen overflow-x-hidden bg-cream p-5 sm:p-10"><div className="mx-auto max-w-7xl">
    <h1 className="font-display text-4xl">Admin dashboard</h1><p className="mt-2 max-w-2xl text-sm text-muted">All edits, order updates, and metrics are local demo data, not production operations.</p>{message && <p role="status" className="mt-4 rounded-xl border border-leaf/20 bg-sage p-3 text-sm text-leaf">{message}</p>}
    <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Products" value={items.length} /><Metric label="Orders" value={orders.length} /><Metric label="Low stock (≤ 5)" value={items.filter((item) => item.stock <= LOW_STOCK_THRESHOLD).length} /><Metric label="Simulated revenue" value={`₹${orders.reduce((sum, order) => sum + order.pricing.total, 0).toFixed(0)}`} /></section>
    <section className="mt-8 rounded-3xl border border-ink/5 bg-white p-5 shadow-soft sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-2xl">Product management</h2><p className="text-sm text-muted">Search, edit, create, delete, and adjust inventory locally.</p></div><Button type="button" onClick={startCreate}>Add product</Button></div>
      <Input aria-label="Search admin products" value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Search products, brands, or categories" className="mt-5 bg-cream" />
      <div className="mt-5 space-y-2">{visibleProducts.slice(0, 30).map((product) => <div key={product.id} className="flex min-w-0 flex-wrap items-center gap-3 rounded-xl border border-ink/5 bg-cream p-3 text-sm"><span className="min-w-0 flex-1"><b className="block truncate">{product.title}</b><span className="text-muted">{product.category} · ₹{product.price}</span></span><span className={product.stock <= LOW_STOCK_THRESHOLD ? "font-bold text-coral" : "text-muted"}>{product.stock} in stock</span><Button type="button" variant="secondary" size="sm" onClick={() => saveProducts(items.map((item) => item.id === product.id ? { ...item, stock: item.stock + 1 } : item))}>+ stock</Button><Button type="button" variant="link" size="sm" onClick={() => startEdit(product)}>Edit</Button><Button type="button" variant="destructive" size="sm" onClick={() => removeProduct(product.id)}>Delete</Button></div>)}</div>
    </section>
    <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.4fr]">    <section className="rounded-3xl border border-ink/5 bg-white p-5 shadow-soft sm:p-6"><h2 className="font-display text-2xl">{editing ? "Edit product" : "Create product"}</h2><form onSubmit={submitProduct} className="mt-5 space-y-3">{(["title", "description", "brand", "category"] as const).map((field) => <label key={field} className="block text-sm font-semibold">{field[0].toUpperCase() + field.slice(1)}<Input required={field === "title" || field === "category"} value={form[field] ?? ""} onChange={(event) => setForm({ ...form, [field]: event.target.value })} className="mt-1 bg-cream" /></label>)}<div className="grid gap-3 sm:grid-cols-2">{(["price", "discountPercentage", "rating", "stock"] as const).map((field) => <label key={field} className="block text-sm font-semibold">{field}<Input type="number" min="0" max={field === "rating" ? 5 : field === "discountPercentage" ? 100 : undefined} step={field === "stock" ? 1 : "0.01"} value={form[field]} onChange={(event) => setForm({ ...form, [field]: Number(event.target.value) })} className="mt-1 bg-cream" /></label>)}</div><div className="flex flex-wrap gap-2"><Button type="submit">Save product</Button>{editing && <Button type="button" variant="secondary" onClick={startCreate}>Cancel</Button>}</div></form></section>
      <section className="rounded-3xl border border-ink/5 bg-white p-5 shadow-soft sm:p-6"><h2 className="font-display text-2xl">Category management</h2><form onSubmit={addCategory} className="mt-5 flex flex-col gap-2 sm:flex-row"><Input aria-label="New category" required value={categoryInput} onChange={(event) => setCategoryInput(event.target.value)} placeholder="New category" className="bg-cream" /><Button type="submit">Add category</Button></form><p className="mt-4 text-xs leading-5 text-muted">Products assigned to a renamed category follow the new name. Reassign products before deleting an assigned category.</p><label className="mt-4 block text-sm font-semibold">Replacement for deletion<select aria-label="Replacement category" value={categoryToDelete} onChange={(event) => setCategoryToDelete(event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-ink/10 bg-cream px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf"><option value="">Select only when needed</option>{categoryList.map((category) => <option key={category} value={category}>{category}</option>)}</select></label><div className="mt-4 space-y-2">{categoryList.map((category) => <div key={category} className="flex min-w-0 flex-wrap items-center gap-2 rounded-xl border border-ink/5 bg-cream p-3 text-sm"><span className="min-w-0 flex-1 break-words">{category}</span><Button type="button" variant="link" size="sm" onClick={() => renameCategory(category)}>Rename</Button><Button type="button" variant="destructive" size="sm" onClick={() => removeCategory(category)}>Delete</Button></div>)}</div></section></section>
    <section className="mt-8 rounded-3xl border border-ink/5 bg-white p-5 shadow-soft sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="font-display text-2xl">Order management</h2><p className="mt-1 text-sm text-muted">Filter orders and advance them through the existing tracking sequence.</p></div><div className="grid w-full gap-2 sm:grid-cols-2 lg:flex lg:w-auto"><select aria-label="Order status filter" value={orderFilters.status} onChange={(event) => setOrderFilters({ ...orderFilters, status: event.target.value as OrderStatus | "all" })} className="h-10 min-w-0 rounded-xl border border-ink/10 bg-cream px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf">{statuses.map((status) => <option key={status} value={status}>{status === "all" ? "All statuses" : status}</option>)}</select><Input aria-label="Customer filter" placeholder="Customer ID" value={orderFilters.customerId} onChange={(event) => setOrderFilters({ ...orderFilters, customerId: event.target.value })} className="bg-cream" /><Input aria-label="Orders from date" type="date" value={orderFilters.from} onChange={(event) => setOrderFilters({ ...orderFilters, from: event.target.value })} className="bg-cream" /><Input aria-label="Orders to date" type="date" value={orderFilters.to} onChange={(event) => setOrderFilters({ ...orderFilters, to: event.target.value })} className="bg-cream" /></div></div>{visibleOrders.length ? visibleOrders.map((order) => <div key={order.id} className="mt-3 flex min-w-0 flex-wrap items-center gap-3 rounded-xl border border-ink/5 bg-cream p-3 text-sm"><span className="min-w-0 flex-1 break-words"><b>{order.id}</b> · {order.customerId} · {order.status} · ₹{Math.round(order.pricing.total)}</span><Button type="button" variant="link" size="sm" onClick={() => setSelectedOrder(order)}>View detail</Button>{order.status !== "delivered" && <Button type="button" size="sm" onClick={() => advance(order.id)}>Advance status</Button>}</div>) : <p className="mt-4 rounded-xl border border-dashed border-ink/10 p-5 text-sm text-muted">No orders match these filters.</p>}</section>
    {selectedOrder && <OrderDetail order={selectedOrder} onAdvance={() => advance(selectedOrder.id)} onClose={() => setSelectedOrder(null)} />}
    <section className="mt-8 grid gap-6 lg:grid-cols-2"><section className="rounded-3xl bg-white p-6 shadow-soft"><h2 className="font-display text-2xl">Review moderation</h2>{readReviews().map((review) => <div key={review.id} className="mt-3 rounded-xl bg-cream p-3 text-sm"><p className="font-semibold">{review.title} · {review.status}</p>{review.status === "pending" && <div className="mt-2 flex gap-2"><button type="button" onClick={() => { setReviewStatus(review.id, "approved"); setMessage("Review approved locally."); }} className="text-xs font-bold text-leaf">Approve</button><button type="button" onClick={() => { setReviewStatus(review.id, "rejected"); setMessage("Review rejected locally."); }} className="text-xs font-bold text-coral">Reject</button></div>}</div>)}</section><section className="rounded-3xl bg-white p-6 shadow-soft"><p className="text-xs font-bold uppercase tracking-wider text-coral">Local Analytics</p><div className="mt-4 grid gap-4 sm:grid-cols-3"><Metric label="Recommendation impressions" value={analytics.impressions} /><Metric label="Recommendation clicks" value={analytics.clicks} /><Metric label="Simulated conversions" value={`${analytics.conversions} (${(analytics.conversionRate * 100).toFixed(0)}%)`} /></div></section></section>
  </div></main>;
}

function OrderDetail({ order, onAdvance, onClose }: { order: Order; onAdvance: () => void; onClose: () => void }) {
  const current = statusProgression.indexOf(order.status);
  return <div role="dialog" aria-modal="true" aria-label={`Order detail ${order.id}`} className="fixed inset-0 z-20 overflow-y-auto bg-ink/40 p-3 sm:p-5"><div className="mx-auto max-w-2xl rounded-3xl border border-ink/10 bg-cream p-5 shadow-soft sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-coral">Order detail</p><h2 className="mt-1 break-all font-display text-3xl">{order.id}</h2></div><Button type="button" variant="ghost" size="sm" onClick={onClose}>Close</Button></div><p className="mt-3 break-words text-sm text-muted">Customer: {order.customerId} · {new Date(order.createdAt).toLocaleString()}</p><div className="mt-6 space-y-2 rounded-2xl border border-ink/5 bg-white p-4 text-sm">{order.items.map((item) => <p key={item.product.id} className="flex justify-between gap-3"><span className="min-w-0 break-words">{item.product.title} × {item.quantity}</span><b className="shrink-0">₹{Math.round(item.unitPrice * item.quantity)}</b></p>)}<p className="border-t border-ink/10 pt-3 font-bold">Total: ₹{Math.round(order.pricing.total)}</p></div><div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">{statusProgression.map((status, index) => <div key={status} className={`rounded-xl p-2 text-center text-[10px] ${index <= current ? "bg-leaf text-white" : "bg-white text-muted"}`}>{status}</div>)}</div>{order.status !== "delivered" && <Button type="button" onClick={onAdvance} className="mt-6">Advance status</Button>}</div></div>;
}

function Metric({ label, value }: { label: string; value: number | string }) { return <div className="rounded-2xl border border-ink/5 bg-white p-4 shadow-soft"><p className="text-2xl font-bold">{value}</p><p className="mt-1 text-xs leading-5 text-muted">{label}</p></div>; }
