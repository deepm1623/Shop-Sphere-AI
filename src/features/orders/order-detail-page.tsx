"use client";

import Link from "next/link";
import { getOrdersForCustomer } from "@/services/order-service";
import { useAuthStore } from "@/store/use-auth-store";

export function OrderDetailPage({ id }: { id: string }) {
  const session = useAuthStore((state) => state.session);
  const order = session ? getOrdersForCustomer(session.user.id).find((entry) => entry.id === id) : undefined;
  if (!order) return <main className="min-h-screen bg-cream px-5 py-10"><div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 text-center shadow-soft"><h1 className="font-display text-3xl">Order not found</h1><p className="mt-2 text-sm text-muted">This order does not belong to the current demo account.</p><Link href="/orders" className="mt-5 inline-block font-semibold text-leaf">Back to orders</Link></div></main>;
  return <main className="min-h-screen bg-cream px-5 py-10"><div className="mx-auto max-w-3xl"><Link href="/orders" className="text-sm font-semibold text-muted">← Back to orders</Link><div className="mt-8 rounded-3xl bg-white p-6 shadow-soft sm:p-8"><p className="text-xs font-bold uppercase tracking-wider text-coral">Order details</p><h1 className="mt-2 font-display text-4xl">{order.id}</h1><p className="mt-2 text-sm text-muted">Placed {new Date(order.createdAt).toLocaleString()}</p><div className="mt-8 space-y-3 border-t border-ink/10 pt-6">{order.items.map((item) => <div key={item.product.id} className="flex justify-between gap-4 text-sm"><span>{item.product.title} × {item.quantity}</span><span className="font-semibold">{money(item.unitPrice * item.quantity)}</span></div>)}</div><div className="mt-6 flex justify-between border-t border-ink/10 pt-6 font-bold"><span>Total</span><span>{money(order.pricing.total)}</span></div><p className="mt-6 rounded-2xl bg-sage p-4 text-sm">Current status: <strong>{order.status}</strong></p></div></div></main>;
}

function money(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}
