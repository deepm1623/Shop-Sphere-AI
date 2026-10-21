"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronLeft, ChevronRight, Heart, MapPin, Minus, Plus, ShoppingBag, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { getProduct, getProducts } from "@/services/product-service";
import { useShopStore } from "@/store/use-shop-store";
import type { Product } from "@/types/product";
import { RecommendationRail } from "@/features/recommendations/recommendation-rail";
import { useRecommendationStore } from "@/store/use-recommendation-store";
import { ReviewPanel } from "@/features/reviews/review-panel";
import { Button } from "@/components/ui/button";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function ProductDetailPage({ productId }: { productId: number }) {
  const product = useQuery({ queryKey: ["product", productId], queryFn: () => getProduct(productId) });
  const related = useQuery({ queryKey: ["related-products", productId], queryFn: () => getProducts() });

  if (product.isLoading) return <ProductDetailState title="Loading your find..." />;
  if (product.isError) return <ProductDetailState title="We couldn't find that product" message="The product may be unavailable or the catalogue may be having trouble." error />;
  if (!product.data) return <ProductDetailState title="Product unavailable" message="This product is no longer available." />;

  return <ProductDetailView product={product.data} relatedProducts={related.data?.products ?? []} />;
}

export function ProductDetailView({ product, relatedProducts }: { product: Product; relatedProducts: Product[] }) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [imageFailed, setImageFailed] = useState(false);
  const { wishlist, toggleWishlist, addToCart, comparison, toggleComparison } = useShopStore();
  const viewedProductIds = useRecommendationStore((state) => state.viewedProductIds);
  const recordViewed = useRecommendationStore((state) => state.recordViewed);
  useEffect(() => { recordViewed(product.id); }, [product.id, recordViewed]);
  const saved = wishlist.includes(product.id);
  const images = product.images.length > 0 ? product.images : [product.thumbnail];
  const related = relatedProducts.filter((item) => item.id !== product.id && item.category === product.category).slice(0, 4);
  const discountedPrice = product.price * 84 * (1 - product.discountPercentage / 100);

  function addProductToCart() {
    addToCart(product, quantity);
  }

  return (
    <main className="min-h-screen bg-cream">
      <header className="border-b border-ink/10 px-5 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="font-display text-2xl font-bold">shop<span className="text-leaf">sphere</span><sup className="ml-1 text-xs text-coral">AI</sup></Link>
          <Link href="/cart" className="relative rounded-full bg-ink p-2.5 text-white" aria-label="Open cart"><ShoppingBag size={19} /><CartBadge /></Link>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-2 text-sm text-muted"><Link href="/" className="font-semibold hover:text-leaf">Catalogue</Link><span aria-hidden="true">/</span><span className="capitalize">{product.category.replaceAll("-", " ")}</span><span aria-hidden="true">/</span><span className="max-w-[18rem] truncate text-ink">{product.title}</span></nav>
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,.95fr)] lg:gap-14">
          <div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-ink/5 bg-sage sm:aspect-square">
              {imageFailed ? <div className="flex h-full items-center justify-center px-8 text-center text-sm font-semibold text-muted">Product image unavailable</div> : <Image src={images[selectedImage]} alt={product.title} fill priority sizes="(max-width: 1024px) 100vw, 55vw" className="object-contain p-6 sm:p-10" onError={() => setImageFailed(true)} />}
              {images.length > 1 && <>
                <Button type="button" variant="outline" size="icon" aria-label="Previous product image" onClick={() => { setSelectedImage((selectedImage - 1 + images.length) % images.length); setImageFailed(false); }} className="absolute left-4 top-1/2 h-10 w-10 min-h-10 rounded-full bg-white/90"><ChevronLeft size={18} /></Button>
                <Button type="button" variant="outline" size="icon" aria-label="Next product image" onClick={() => { setSelectedImage((selectedImage + 1) % images.length); setImageFailed(false); }} className="absolute right-4 top-1/2 h-10 w-10 min-h-10 rounded-full bg-white/90"><ChevronRight size={18} /></Button>
              </>}
            </div>
            <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
              {images.map((image, index) => <button type="button" key={`${image}-${index}`} aria-label={`Show product image ${index + 1}`} aria-current={selectedImage === index} onClick={() => { setSelectedImage(index); setImageFailed(false); }} className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border bg-sage p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf ${selectedImage === index ? "border-leaf ring-2 ring-leaf/30" : "border-ink/10"}`}><Image src={image} alt="" fill sizes="80px" className="object-contain p-1" /></button>)}
            </div>
          </div>
          <div className="flex min-w-0 flex-col">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-coral">{product.brand ?? product.category}</p><p className="mt-2 text-xs font-semibold uppercase tracking-wider text-muted">{product.category.replaceAll("-", " ")}</p></div><Button type="button" variant="outline" size="icon" aria-label={`${saved ? "Remove" : "Add"} ${product.title} from wishlist`} onClick={() => toggleWishlist(product.id)} className="h-11 w-11 shrink-0 rounded-full bg-white"><Heart size={20} fill={saved ? "currentColor" : "none"} className={saved ? "text-coral" : ""} /></Button></div>
            <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">{product.title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm"><span className="flex items-center gap-1 font-semibold"><Star size={16} fill="currentColor" className="text-coral" /> {product.rating.toFixed(1)} <span className="font-normal text-muted">/ 5</span></span><span className="text-muted">Category: {product.category.replaceAll("-", " ")}</span></div>
            <div className="mt-6 flex flex-wrap items-baseline gap-3"><span className="text-3xl font-bold">{money.format(discountedPrice)}</span>{product.discountPercentage > 0 && <><span className="text-sm text-muted line-through">{money.format(product.price * 84)}</span><span className="rounded-full bg-sage px-3 py-1 text-xs font-bold text-leaf">{Math.round(product.discountPercentage)}% off</span></>}</div>
            <div className="mt-5 rounded-2xl border border-ink/10 bg-white p-4 text-sm"><p className={product.stock > 0 ? "font-semibold text-leaf" : "font-semibold text-coral"}>{product.stock > 0 ? `${product.stock} available` : "Currently out of stock"}</p><p className="mt-1 text-muted">Stock is checked again when you add this item to your cart.</p></div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center"><div className="flex w-fit items-center rounded-xl border border-ink/10 bg-white p-1"><Button type="button" variant="ghost" size="icon" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={16} /></Button><span aria-live="polite" className="w-9 text-center text-sm font-bold">{quantity}</span><Button type="button" variant="ghost" size="icon" aria-label="Increase quantity" disabled={quantity >= product.stock} onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}><Plus size={16} /></Button></div><Button type="button" size="lg" disabled={product.stock <= 0} onClick={addProductToCart} className="w-full sm:flex-1"><ShoppingBag size={17} /> {product.stock > 0 ? "Add to cart" : "Unavailable"}</Button></div>
            <Button type="button" variant={comparison.some((item) => item.id === product.id) ? "secondary" : "outline"} disabled={comparison.length >= 4 && !comparison.some((item) => item.id === product.id)} onClick={() => toggleComparison(product)} className="mt-3 w-full justify-center">{comparison.some((item) => item.id === product.id) ? "Remove from comparison" : comparison.length >= 4 ? "Comparison full" : "Add to comparison"}</Button>
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-ink/10 p-4 text-sm"><MapPin size={18} className="mt-0.5 text-leaf" /><div><p className="font-semibold">Delivery information</p><p className="mt-1 text-muted">Estimated delivery in 3–7 business days. Final delivery details are simulated for this demo.</p></div></div>
            <section className="mt-7 border-t border-ink/10 pt-6"><h2 className="font-display text-2xl">About this product</h2><p className="mt-3 text-base leading-7 text-muted">{product.description}</p>{product.tags && product.tags.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{product.tags.map((tag) => <span key={tag} className="rounded-full bg-sage px-3 py-1 text-xs font-semibold text-leaf">{tag}</span>)}</div>}</section>
          </div>
        </div>
      </section>
      {related.length > 0 && <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-8"><h2 className="font-display text-3xl">More from {product.category.replaceAll("-", " ")}</h2><div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{related.map((item) => <Link key={item.id} href={`/products/${item.id}`} className="group rounded-2xl border border-ink/5 bg-white p-3 shadow-soft transition hover:-translate-y-1 hover:shadow-md"><div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-sage"><Image src={item.thumbnail} alt={item.title} fill sizes="(max-width: 639px) 45vw, (max-width: 1023px) 30vw, 22vw" className="object-contain p-3 transition group-hover:scale-105" /></div><p className="mt-3 line-clamp-2 min-h-10 font-semibold">{item.title}</p><p className="mt-1 text-sm font-semibold text-ink">{money.format(item.price * 84)}</p></Link>)}</div></section>}
      <div className="mx-auto max-w-7xl px-5 pb-20 lg:px-8"><RecommendationRail products={relatedProducts} strategy="similar" title="Similar Products" seed={product} signals={{ viewedProductIds, wishlistIds: wishlist }} /><RecommendationRail products={relatedProducts} strategy="frequently-bought-together" title="You May Also Like" seed={product} signals={{ viewedProductIds, wishlistIds: wishlist }} /></div>
      <div className="mx-auto max-w-7xl px-5 pb-20 lg:px-8"><ReviewPanel productId={product.id} /></div>
    </main>
  );
}

function CartBadge() {
  const count = useShopStore((state) => state.cart.reduce((sum, item) => sum + item.quantity, 0));
  return <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-coral px-1 text-[10px] font-bold">{count}</span>;
}

function ProductDetailState({ title, message, error = false }: { title: string; message?: string; error?: boolean }) {
  return <main className="flex min-h-screen items-center justify-center bg-cream p-5"><div className="max-w-md text-center"><h1 className="font-display text-3xl">{title}</h1><p className="mt-3 text-sm text-muted">{message ?? "We are loading the latest product information."}</p>{error && <Link href="/" className="mt-6 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white">Back to catalogue</Link>}</div></main>;
}
