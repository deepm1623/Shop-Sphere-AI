"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useShopStore } from "@/store/use-shop-store";
import { useRecommendationStore } from "@/store/use-recommendation-store";
import type { RecommendationResult } from "@/types/domain";
import type { Product } from "@/types/product";
import { getRecommendations, type RecommendationSignals } from "./recommendation-service";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
export function RecommendationRail({ products, strategy, title, seed, signals, limit = 4 }: { products: Product[]; strategy: RecommendationResult["strategy"]; title: string; seed?: Product; signals: RecommendationSignals; limit?: number }) {
  const signalKey = `${signals.viewedProductIds.join(",")}:${signals.wishlistIds?.join(",")}:${signals.cartItems?.map((item) => item.product.id).join(",")}:${signals.searchHistory?.join(",")}`;
  // signalKey keeps the derived result stable while callers assemble signal objects inline.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const results = useMemo(() => getRecommendations(strategy, products, signals, seed, limit), [limit, products, seed, signalKey, strategy]);
  const recordEvent = useRecommendationStore((state) => state.recordEvent);
  const impressionKey = `${strategy}:${results.map((result) => result.product.id).join(",")}`;
  useEffect(() => { results.forEach((result) => recordEvent({ type: "impression", strategy, productId: result.product.id })); }, [impressionKey, recordEvent, results, strategy]);
  if (!results.length) return null;
  return <section className="mt-14"><h2 className="font-display text-3xl">{title}</h2><p className="mt-1 text-sm text-muted">Rule-based recommendations with transparent reasons</p><div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">{results.map((result) => <RecommendationCard key={result.product.id} result={result} onEvent={() => recordEvent({ type: "click", strategy, productId: result.product.id })} />)}</div></section>;
}
function RecommendationCard({ result, onEvent }: { result: RecommendationResult; onEvent: () => void }) {
  const addToCart = useShopStore((state) => state.addToCart);
  return <article className="rounded-2xl bg-white p-3 shadow-soft"><Link href={`/products/${result.product.id}`} onClick={onEvent}><div className="relative aspect-square overflow-hidden rounded-xl bg-sage"><Image src={result.product.thumbnail} alt={result.product.title} fill sizes="25vw" className="object-cover" /></div><p className="mt-3 truncate font-semibold">{result.product.title}</p></Link><p className="mt-1 text-sm text-muted">{money.format(result.product.price * 84)}</p><p className="mt-2 min-h-8 text-[11px] text-leaf">{result.reasons[0]?.label ?? "A relevant catalogue match"}</p><button disabled={result.product.stock <= 0} onClick={() => { addToCart(result.product); onEvent(); recordConversion(result); }} className="mt-2 w-full rounded-full bg-ink px-3 py-2 text-xs font-semibold text-white disabled:bg-muted">Add to cart</button></article>;
}
function recordConversion(result: RecommendationResult) { useRecommendationStore.getState().recordEvent({ type: "conversion", strategy: result.strategy, productId: result.product.id }); }
