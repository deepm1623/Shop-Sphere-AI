"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LogOut, Package, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getProducts } from "@/services/product-service";
import { getOrdersForCustomer } from "@/services/order-service";
import { readAddresses, readProfile, saveAddresses, saveProfile, validateAddress, validateProfile } from "@/services/profile-service";
import { useAuthStore } from "@/store/use-auth-store";
import { useRecommendationStore } from "@/store/use-recommendation-store";
import { useShopStore } from "@/store/use-shop-store";
import type { ShippingAddress, UserProfile } from "@/types/domain";
import type { Product } from "@/types/product";

export function AccountPage() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const logout = useAuthStore((state) => state.logout);
  const { viewedProductIds, resetSignals } = useRecommendationStore();
  const { wishlist, toggleWishlist, addToCart } = useShopStore();
  const products = useQuery({ queryKey: ["account-products"], queryFn: () => getProducts() });
  const [profile, setProfile] = useState<UserProfile>(() => session ? readProfile(session.user.id, session.user) : { name: "", email: "" });
  const [addresses, setAddresses] = useState<ShippingAddress[]>(() => session ? readAddresses(session.user.id) : []);
  const [message, setMessage] = useState("");
  if (!session) return null;
  const userId = session.user.id;
  const orders = getOrdersForCustomer(userId);
  const viewed = viewedProductIds.map((id) => products.data?.products.find((product) => product.id === id)).filter((product): product is NonNullable<typeof product> => Boolean(product));
  const wishlisted = wishlist.map((id) => products.data?.products.find((product) => product.id === id)).filter((product): product is NonNullable<typeof product> => Boolean(product));
  function saveProfileForm(event: React.FormEvent) { event.preventDefault(); const error = validateProfile(profile); if (error) return setMessage(error); saveProfile(userId, profile); setMessage("Profile saved locally for this demo."); }
  function addAddress(event: React.FormEvent) { event.preventDefault(); const form = event.currentTarget as HTMLFormElement; const data = Object.fromEntries(new FormData(form)) as Record<string, string>; const address: ShippingAddress = { id: `address-${Date.now()}`, fullName: data.fullName ?? "", line1: data.line1 ?? "", city: data.city ?? "", state: data.state ?? "", postalCode: data.postalCode ?? "", country: data.country ?? "India" }; const error = validateAddress(address); if (error) return setMessage(error); const next = [...addresses, address]; setAddresses(next); saveAddresses(userId, next); form.reset(); setMessage("Address saved locally."); }
  return <main className="min-h-screen bg-cream"><header className="border-b border-ink/10 px-5 py-5"><div className="mx-auto flex max-w-6xl items-center justify-between"><Link href="/" className="font-display text-2xl font-bold">shop<span className="text-leaf">sphere</span></Link><Button variant="outline" size="sm" onClick={() => { logout(); router.replace("/"); }}><LogOut size={15} /> Sign out</Button></div></header><section className="mx-auto max-w-6xl px-5 py-10"><p className="text-xs font-bold uppercase tracking-[.2em] text-coral">Demo account</p><h1 className="mt-2 break-words font-display text-4xl">Hello, {session.user.name}</h1>{message && <p role="status" className="mt-4 rounded-xl border border-leaf/20 bg-sage p-3 text-sm text-leaf">{message}</p>}<div className="mt-8 grid gap-6 lg:grid-cols-2"><form onSubmit={saveProfileForm} className="rounded-3xl border border-ink/5 bg-white p-6 shadow-soft"><UserRound className="text-leaf" /><h2 className="mt-4 font-display text-2xl">Profile settings</h2><div className="mt-5 space-y-3"><label className="block text-sm font-semibold">Name<Input aria-label="Profile name" value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} /></label><label className="block text-sm font-semibold">Email<Input aria-label="Profile email" type="email" value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} /></label><label className="block text-sm font-semibold">Phone<Input aria-label="Profile phone" value={profile.phone ?? ""} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} placeholder="Phone" /></label></div><Button type="submit" className="mt-5 w-full sm:w-auto">Save profile locally</Button></form><div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-soft"><h2 className="font-display text-2xl">Addresses</h2>{addresses.map((address) => <div key={address.id} className="mt-3 flex items-start justify-between gap-3 rounded-xl bg-cream p-3 text-sm"><span className="min-w-0 break-words">{address.fullName}, {address.line1}, {address.city}, {address.state} {address.postalCode}</span><Button type="button" variant="link" size="sm" onClick={() => { const next = addresses.filter((item) => item.id !== address.id); setAddresses(next); saveAddresses(session.user.id, next); }} className="shrink-0 px-0 text-coral">Delete</Button></div>)}<form onSubmit={addAddress} className="mt-5 grid gap-3 sm:grid-cols-2"><Input name="fullName" placeholder="Full name" aria-label="Address full name" required /><Input name="line1" placeholder="Address line" aria-label="Address line" required /><Input name="city" placeholder="City" aria-label="Address city" required /><Input name="state" placeholder="State" aria-label="Address state" required /><Input name="postalCode" placeholder="Postal code" aria-label="Address postal code" required /><Input name="country" defaultValue="India" placeholder="Country" aria-label="Address country" required /><Button type="submit" className="sm:col-span-2">Add address</Button></form></div></div><div className="mt-6 grid gap-6 lg:grid-cols-2"><section className="rounded-3xl border border-ink/5 bg-white p-6 shadow-soft"><h2 className="font-display text-2xl">Orders and reviews</h2><Link href="/orders" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-leaf"><Package size={16} /> {orders.length} local order(s)</Link><p className="mt-3 text-sm text-muted">Your submitted reviews are shown on the relevant product pages. Verified purchase status comes from local order history.</p></section><section className="rounded-3xl border border-ink/5 bg-white p-6 shadow-soft"><h2 className="font-display text-2xl">Recommendation preferences</h2><p className="mt-2 text-sm text-muted">Because you viewed {viewed.length} product(s). Wishlist signals: {wishlist.length}. Recommendations are local and explainable.</p><Button type="button" variant="secondary" size="sm" onClick={resetSignals} className="mt-4">Reset personalization history</Button></section></div><ProductShelf title="Recently viewed" products={viewed} onAdd={addToCart} /><ProductShelf title="Wishlist" products={wishlisted} onAdd={addToCart} onRemove={toggleWishlist} /></section></main>;
}

function ProductShelf({ title, products, onAdd, onRemove }: { title: string; products: Product[]; onAdd: (product: Product) => void; onRemove?: (id: number) => void }) {
  if (!products.length) return <section className="mt-8 rounded-3xl border border-ink/5 bg-white p-6"><h2 className="font-display text-2xl">{title}</h2><p className="mt-2 text-sm text-muted">Nothing here yet.</p></section>;
  return <section className="mt-8"><h2 className="font-display text-2xl">{title}</h2><div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">{products.map((product) => <div key={product.id} className="rounded-2xl border border-ink/5 bg-white p-3"><div className="relative aspect-square overflow-hidden rounded-xl bg-sage"><Image src={product.thumbnail} alt={product.title} fill sizes="25vw" className="object-contain p-2" /></div><p className="mt-2 line-clamp-2 min-h-10 text-sm font-semibold">{product.title}</p><div className="mt-2 flex flex-wrap gap-2"><Button type="button" size="sm" disabled={!product.stock} onClick={() => onAdd(product)}>Move to cart</Button>{onRemove && <Button type="button" variant="link" size="sm" onClick={() => onRemove(product.id)} className="px-0 text-coral">Remove</Button>}</div></div>)}</div></section>;
}
