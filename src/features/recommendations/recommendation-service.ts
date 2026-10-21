import type { CartItem, RecommendationReason, RecommendationResult } from "@/types/domain";
import type { Product } from "@/types/product";

export type RecommendationSignals = {
  viewedProductIds: number[];
  searchHistory?: string[];
  wishlistIds?: number[];
  cartItems?: CartItem[];
  purchasedItems?: CartItem[];
  preferredBrands?: string[];
};

export type RecommendationStrategy = RecommendationResult["strategy"];
export type RecommendationProvider = {
  recommend: (strategy: RecommendationStrategy, products: Product[], signals: RecommendationSignals, seed?: Product, limit?: number) => RecommendationResult[];
};

const WEIGHTS = { category: 0.2, price: 0.15, tag: 0.15, rating: 0.15, recent: 0.1, wishlist: 0.1, cart: 0.15 } as const;
export const RECOMMENDATION_WEIGHTS = WEIGHTS;

const available = (products: Product[]) => products.filter((product) => product.stock > 0 && Number.isFinite(product.price) && Boolean(product.title));
const tags = (product: Product) => new Set([product.category, ...(product.tags ?? []), product.brand ?? ""].map((value) => value.toLowerCase()));
const similarity = (product: Product, references: Product[]) => references.length === 0 ? 0 : Math.max(...references.map((reference) => {
  const overlap = [...tags(product)].filter((tag) => tags(reference).has(tag)).length / Math.max(1, new Set([...tags(product), ...tags(reference)]).size);
  return overlap;
}));
const reason = (signal: RecommendationReason["signal"], label: string, score: number): RecommendationReason => ({ signal, label, score: Number(score.toFixed(3)) });

export function normalizedWeightedScore(product: Product, signals: RecommendationSignals, references: Product[]): { score: number; reasons: RecommendationReason[] } {
  const categories = references.map((item) => item.category);
  const prices = references.map((item) => item.price);
  const averagePrice = prices.length ? prices.reduce((sum, value) => sum + value, 0) / prices.length : product.price;
  const categoryScore = categories.length ? (categories.includes(product.category) ? 1 : 0) : 0;
  const priceScore = Math.max(0, 1 - Math.abs(product.price - averagePrice) / Math.max(averagePrice, 1));
  const tagScore = similarity(product, references);
  const ratingScore = Math.max(0, Math.min(1, product.rating / 5));
  const recentScore = signals.viewedProductIds.includes(product.id) ? 1 : similarity(product, references.filter((item) => signals.viewedProductIds.includes(item.id)));
  const wishlistScore = signals.wishlistIds?.length ? (signals.wishlistIds.includes(product.id) ? 1 : similarity(product, references.filter((item) => signals.wishlistIds?.includes(item.id)))) : 0;
  const cartScore = signals.cartItems?.length ? similarity(product, signals.cartItems.map((item) => item.product)) : 0;
  const components = [
    [WEIGHTS.category, categoryScore, "category", "Matches a browsed category"],
    [WEIGHTS.price, priceScore, "price", "Fits your usual price range"],
    [WEIGHTS.tag, tagScore, "tag", "Shares product tags"],
    [WEIGHTS.rating, ratingScore, "rating", "Strong customer rating"],
    [WEIGHTS.recent, recentScore, "recently-viewed", "Related to recently viewed items"],
    [WEIGHTS.wishlist, wishlistScore, "wishlist", "Related to your wishlist"],
    [WEIGHTS.cart, cartScore, "cart", "Complements items in your cart"],
  ] as const;
  const score = components.reduce((sum, [weight, value]) => sum + weight * value, 0);
  const reasons = components.filter(([, value]) => value > 0.2).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([, value, signal, label]) => reason(signal, label, value));
  return { score: Math.max(0, Math.min(1, score)), reasons };
}

export const mockRecommendationProvider: RecommendationProvider = {
  recommend(strategy, products, signals, seed, limit = 4) {
    const pool = available(products).filter((product) => !signals.cartItems?.some((item) => item.product.id === product.id) && product.id !== seed?.id);
    const references = seed ? [seed] : products.filter((product) => signals.viewedProductIds.includes(product.id) || signals.wishlistIds?.includes(product.id));
    let candidates = pool;
    if (strategy === "recently-viewed") candidates = products.filter((product) => signals.viewedProductIds.includes(product.id) && product.stock > 0);
    if (strategy === "similar" && seed) candidates = pool.filter((product) => product.category === seed.category || similarity(product, [seed]) > 0.15);
    if (strategy === "category-based") candidates = pool.filter((product) => references.some((reference) => reference.category === product.category));
    if (strategy === "price-based" && references.length) candidates = pool.filter((product) => Math.abs(product.price - references.reduce((sum, item) => sum + item.price, 0) / references.length) < Math.max(100, references[0].price * 0.4));
    if (strategy === "wishlist-based") candidates = pool.filter((product) => similarity(product, products.filter((item) => signals.wishlistIds?.includes(item.id))) > 0);
    if (strategy === "cart-based") candidates = pool.filter((product) => similarity(product, signals.cartItems?.map((item) => item.product) ?? []) > 0);
    if (strategy === "frequently-bought-together") candidates = pool.filter((product) => product.category === seed?.category || similarity(product, seed ? [seed] : []) > 0.1);
    if (strategy === "trending") candidates = pool;
    return candidates.map((product) => {
      const weighted = normalizedWeightedScore(product, signals, references);
      const trendBonus = strategy === "trending" ? product.rating / 5 : 0;
      return { product, score: Math.max(0, Math.min(1, weighted.score + trendBonus * 0.2)), reasons: strategy === "trending" ? [reason("trending", "Popular and highly rated", trendBonus), ...weighted.reasons].slice(0, 3) : weighted.reasons, strategy };
    }).sort((a, b) => b.score - a.score || b.product.rating - a.product.rating || a.product.id - b.product.id).slice(0, limit);
  },
};

export function getRecommendations(strategy: RecommendationStrategy, products: Product[], signals: RecommendationSignals, seed?: Product, limit = 4) {
  return mockRecommendationProvider.recommend(strategy, products, signals, seed, limit);
}
