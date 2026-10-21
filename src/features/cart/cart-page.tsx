"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, Minus, Plus, RefreshCw, ShoppingBag, Trash2 } from "lucide-react";
import { getProducts } from "@/services/product-service";
import { useState } from "react";
import { useShopStore } from "@/store/use-shop-store";
import { calculateCartTotals, PROVISIONAL_SHIPPING_FEE, PROVISIONAL_TAX_RATE } from "./cart-utils";
import type { Product } from "@/types/product";
import { RecommendationRail } from "@/features/recommendations/recommendation-rail";
import { useRecommendationStore } from "@/store/use-recommendation-store";
import { Button } from "@/components/ui/button";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function CartPage() {
  const { cart, savedForLater, hydrated, updateCartQuantity, removeFromCart, saveForLater, moveToCart } = useShopStore();
  const viewedProductIds = useRecommendationStore((state) => state.viewedProductIds);
  const products = useQuery({ queryKey: ["cart-products"], queryFn: () => getProducts(), enabled: hydrated });

  if (!hydrated) return <CartShell><CartState title="Restoring your cart..." /></CartShell>;

  const currentProducts = new Map((products.data?.products ?? []).map((product) => [product.id, product]));
  const activeItems = cart.map((item) => ({ ...item, currentProduct: currentProducts.get(item.product.id) }));
  const totals = calculateCartTotals(cart);
  const hasUnavailable = activeItems.some((item) => !item.currentProduct || item.currentProduct.stock <= 0);

  return (
    <CartShell>
      <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-leaf"><ArrowLeft size={16} /> Continue shopping</Link>
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-coral">Your bag</p><h1 className="mt-2 font-display text-4xl">Shopping cart</h1><p className="mt-2 text-sm text-muted" aria-live="polite">{cart.reduce((sum, item) => sum + item.quantity, 0)} item(s)</p></div></div>
        {!products.isLoading && products.isError && <div role="status" className="mt-6 flex items-center gap-3 rounded-2xl border border-coral/20 bg-coral/10 p-4 text-sm"><AlertTriangle size={18} className="text-coral" /><span>We couldn&apos;t refresh product availability. Your saved cart snapshots are shown. </span><Button type="button" variant="link" size="sm" onClick={() => products.refetch()} className="ml-auto"><RefreshCw size={14} /> Retry</Button></div>}
        {cart.length === 0 ? <CartState title="Your cart is waiting for a good find" message="Items you add will appear here." /> : <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {hasUnavailable && <div className="rounded-2xl border border-coral/20 bg-coral/10 p-4 text-sm text-ink">One or more items are unavailable or out of stock. Remove them before checkout is available.</div>}
            {activeItems.map((item) => <CartLine key={item.product.id} item={item} currentProduct={item.currentProduct} onDecrease={() => updateCartQuantity(item.product.id, item.quantity - 1, item.currentProduct?.stock)} onIncrease={() => updateCartQuantity(item.product.id, item.quantity + 1, item.currentProduct?.stock)} onRemove={() => removeFromCart(item.product.id)} onSave={() => saveForLater(item.product.id)} />)}
            {savedForLater.length > 0 && <section className="pt-8"><h2 className="font-display text-2xl">Saved for later</h2><div className="mt-4 space-y-3">{savedForLater.map((item) => <div key={item.product.id} className="flex items-center gap-4 rounded-2xl bg-white p-3"><div className="relative h-16 w-16 overflow-hidden rounded-xl bg-sage"><Image src={item.product.thumbnail} alt={item.product.title} fill sizes="64px" className="object-cover" /></div><div className="min-w-0 flex-1"><p className="truncate font-semibold">{item.product.title}</p><p className="text-sm text-muted">{money.format(item.unitPrice)}</p></div><Button type="button" variant="secondary" size="sm" onClick={() => moveToCart(item.product.id)}>Move to cart</Button></div>)}</div></section>}
          </div>
          <aside className="h-fit rounded-[1.5rem] border border-ink/5 bg-white p-6 shadow-soft lg:sticky lg:top-6"><h2 className="font-display text-2xl">Order summary</h2><div className="mt-6 space-y-3 text-sm"><SummaryRow label="Subtotal" value={money.format(totals.subtotal)} /><SummaryRow label="Product discounts" value={`-${money.format(totals.discount)}`} /><SummaryRow label={`Estimated tax (${PROVISIONAL_TAX_RATE * 100}%)`} value={money.format(totals.tax)} /><SummaryRow label="Estimated shipping" value={money.format(PROVISIONAL_SHIPPING_FEE)} /><div className="border-t border-ink/10 pt-4"><SummaryRow label="Estimated total" value={money.format(totals.total)} strong /></div></div><p className="mt-5 text-xs leading-5 text-muted">Shipping and tax are provisional local-demo assumptions because the PRD defines simulated calculations but does not prescribe numeric rates. Checkout will validate these again.</p>{hasUnavailable ? <Button type="button" disabled className="mt-6 w-full">Resolve unavailable items first</Button> : <Button asChild size="lg" className="mt-6 w-full"><Link href="/checkout">Continue to checkout</Link></Button>}</aside>
        </div>}
        {products.data?.products && <RecommendationRail products={products.data.products} strategy="cart-based" title="Because of your cart" signals={{ viewedProductIds, cartItems: cart }} />}
      </section>
    </CartShell>
  );
}

function CartShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return <main className="min-h-screen bg-cream"><header className="border-b border-ink/10 px-5 py-5"><div className="mx-auto flex max-w-7xl items-center justify-between"><Link href="/" className="font-display text-2xl font-bold">shop<span className="text-leaf">sphere</span><sup className="ml-1 text-xs text-coral">AI</sup></Link><Link href="/" className="text-sm font-semibold text-muted">Keep browsing</Link></div></header>{children}</main>;
}

function CartLine({ item, currentProduct, onDecrease, onIncrease, onRemove, onSave }: { item: { product: Product; quantity: number; unitPrice: number }; currentProduct?: Product; onDecrease: () => void; onIncrease: () => void; onRemove: () => void; onSave: () => void }) {
  const [imageFailed, setImageFailed] = useState(false);
  const maxStock = currentProduct?.stock ?? item.product.stock;
  const unavailable = !currentProduct || maxStock <= 0;
  const currentUnitPrice = currentProduct ? currentProduct.price * 84 * (1 - currentProduct.discountPercentage / 100) : item.unitPrice;
  const priceChanged = currentProduct && Math.round(currentUnitPrice) !== Math.round(item.unitPrice);
  return <article className="flex min-w-0 gap-3 rounded-2xl border border-ink/5 bg-white p-3 shadow-sm sm:gap-4 sm:p-4"><div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-sage sm:h-28 sm:w-28">{imageFailed ? <div className="flex h-full items-center justify-center px-2 text-center text-[10px] text-muted">Unavailable</div> : <Image src={item.product.thumbnail} alt={item.product.title} fill sizes="112px" className="object-contain p-2" onError={() => setImageFailed(true)} />}</div><div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><div className="min-w-0"><p className="line-clamp-2 font-display text-lg leading-tight sm:text-xl">{item.product.title}</p><p className="mt-1 truncate text-xs uppercase tracking-wider text-muted">{item.product.brand ?? item.product.category}</p><p className="mt-2 text-sm text-muted">{money.format(item.unitPrice)} each</p></div><Button type="button" variant="ghost" size="icon" aria-label={`Remove ${item.product.title}`} onClick={onRemove} className="h-10 w-10 min-h-10 shrink-0 text-muted hover:bg-coral/10 hover:text-coral"><Trash2 size={17} /></Button></div>{unavailable ? <p className="mt-4 text-sm font-semibold text-coral">No longer available. Remove this item to continue.</p> : <div className="mt-4 grid items-center gap-3 sm:mt-5 sm:grid-cols-[auto_1fr_auto]"><div className="flex w-fit items-center rounded-xl border border-ink/10 bg-cream p-1"><Button type="button" variant="ghost" size="icon" aria-label={`Decrease ${item.product.title}`} disabled={item.quantity <= 1} onClick={onDecrease} className="h-10 w-10 min-h-10"><Minus size={14} /></Button><span aria-live="polite" className="w-8 text-center text-sm font-bold">{item.quantity}</span><Button type="button" variant="ghost" size="icon" aria-label={`Increase ${item.product.title}`} disabled={item.quantity >= maxStock} onClick={onIncrease} className="h-10 w-10 min-h-10"><Plus size={14} /></Button></div><Button type="button" variant="link" size="sm" onClick={onSave} className="justify-self-start">Save for later</Button><span className="text-base font-bold sm:justify-self-end">{money.format(item.unitPrice * item.quantity)}</span>{item.quantity >= maxStock && <span className="sm:col-span-3 text-xs text-coral">Quantity limited to available stock ({maxStock}).</span>}{priceChanged && <span className="sm:col-span-3 text-xs text-coral">The current price is {money.format(currentUnitPrice)}. Review this change before checkout.</span>}</div>}</div></article>;
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div className={`flex justify-between gap-4 ${strong ? "text-base font-bold" : "text-muted"}`}><span>{label}</span><span className="text-ink">{value}</span></div>;
}

function RecommendationCard({ product }: { product: Product }) {
  const addToCart = useShopStore((state) => state.addToCart);
  return <article className="rounded-2xl bg-white p-3 shadow-soft"><div className="relative aspect-square overflow-hidden rounded-xl bg-sage"><Image src={product.thumbnail} alt={product.title} fill sizes="25vw" className="object-cover" /></div><p className="mt-3 truncate font-semibold">{product.title}</p><div className="mt-2 flex items-center justify-between"><span className="text-sm">{money.format(product.price * 84)}</span><button aria-label={`Add ${product.title} to cart`} onClick={() => addToCart(product)} className="rounded-full bg-ink p-2 text-white"><Plus size={14} /></button></div></article>;
}

function CartState({ title, message }: { title: string; message?: string }) {
  return <div className="rounded-3xl border border-ink/5 bg-white p-10 text-center shadow-sm sm:p-12"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sage"><ShoppingBag className="text-leaf" size={30} /></div><h2 className="mt-5 font-display text-2xl">{title}</h2><p className="mt-2 text-sm text-muted">{message}</p><Button asChild size="lg" className="mt-6"><Link href="/">Continue shopping</Link></Button></div>;
}
