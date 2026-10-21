"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft, Check, Package } from "lucide-react";
import { getOrdersForCustomer } from "@/services/order-service";
import { useAuthStore } from "@/store/use-auth-store";
import type { Order, OrderStatus } from "@/types/domain";

const timeline: Array<{ status: OrderStatus; label: string }> = [
  { status: "placed", label: "Order Placed" }, { status: "confirmed", label: "Confirmed" }, { status: "packed", label: "Packed" },
  { status: "shipped", label: "Shipped" }, { status: "out-for-delivery", label: "Out for Delivery" }, { status: "delivered", label: "Delivered" },
];

export function OrdersPage() {
  const session = useAuthStore((state) => state.session);
  const orders = useMemo(() => session ? getOrdersForCustomer(session.user.id) : [], [session]);
  return <main className="min-h-screen bg-cream"><header className="border-b border-ink/10 px-5 py-5"><div className="mx-auto flex max-w-5xl items-center justify-between"><Link href="/" className="font-display text-2xl font-bold">shop<span className="text-leaf">sphere</span></Link><Link href="/" className="text-sm font-semibold text-muted">Shop</Link></div></header><section className="mx-auto max-w-5xl px-5 py-10"><Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted"><ArrowLeft size={16} /> Continue shopping</Link><h1 className="mt-8 font-display text-4xl">Your orders</h1>{orders.length === 0 ? <div className="mt-8 rounded-3xl bg-white p-12 text-center"><Package className="mx-auto text-leaf" size={34} /><h2 className="mt-4 font-display text-2xl">No orders yet</h2><p className="mt-2 text-sm text-muted">Complete a demo purchase and it will appear here.</p></div> : <div className="mt-8 space-y-6">{orders.map((order) => <OrderCard key={order.id} order={order} />)}</div>}</section></main>;
}

function OrderCard({ order }: { order: Order }) {
  const current = timeline.findIndex((item) => item.status === order.status);
  return <article className="rounded-3xl bg-white p-6 shadow-soft"><div className="flex flex-wrap justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-coral">{order.id}</p><h2 className="mt-1 font-display text-2xl">{order.items.length} item(s)</h2><p className="mt-2 text-sm font-semibold">Total {money(order.pricing.total)}</p></div><div className="text-right"><p className="text-sm text-muted">{new Date(order.createdAt).toLocaleDateString()}</p><Link href={`/orders/${order.id}`} className="mt-2 inline-block text-sm font-semibold text-leaf">View details</Link></div></div><div className="mt-5 space-y-2 text-sm text-muted">{order.items.map((item) => <p key={item.product.id}>{item.product.title} × {item.quantity}</p>)}</div><div className="mt-7 grid grid-cols-3 gap-3 sm:grid-cols-6">{timeline.map((item, index) => <div key={item.status} className="text-center text-[10px] text-muted"><div className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full ${index <= current ? "bg-leaf text-white" : "bg-cream"}`}>{index <= current ? <Check size={14} /> : index + 1}</div><p className="mt-2">{item.label}</p></div>)}</div></article>;
}

function money(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}
