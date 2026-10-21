"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Heart, Plus, Search, SlidersHorizontal, ShoppingBag, Sparkles, X } from "lucide-react";
import { type KeyboardEvent, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getCategories, getProducts } from "@/services/product-service";
import type { Product } from "@/types/product";
import { useShopStore } from "@/store/use-shop-store";
import { filterAndSortProducts, getSearchSuggestions } from "./catalogue-utils";
import { AssistantPanel } from "@/features/assistant/assistant-panel";
import { RecommendationRail } from "@/features/recommendations/recommendation-rail";
import { Button } from "@/components/ui/button";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const categoryLabels: Record<string, string> = { all: "All finds", beauty: "Beauty", fragrances: "Fragrances", furniture: "Furniture", groceries: "Groceries", "home-decoration": "Home", laptops: "Tech", mens: "Men", womens: "Women", "mens-shoes": "Shoes", "womens-shoes": "Shoes" };
function parsePage(value: string | null): number { const page = Number(value); return Number.isInteger(page) && page > 0 ? page : 1; }

function ProductCard({ product, onQuickView, compared, comparisonFull, onToggleCompare }: { product: Product; onQuickView: (product: Product) => void; compared: boolean; comparisonFull: boolean; onToggleCompare: (product: Product) => void }) {
  const { wishlist, toggleWishlist, addToCart } = useShopStore();
  const saved = wishlist.includes(product.id);
  const [imageFailed, setImageFailed] = useState(false);
  const discountedPrice = product.price * 84 * (1 - product.discountPercentage / 100);
  const hasDiscount = product.discountPercentage > 0;
  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-[1.4rem] border border-ink/5 bg-white p-3 shadow-soft transition duration-200 hover:-translate-y-1 hover:shadow-md">
      <div className="relative aspect-[4/3] shrink-0 overflow-hidden rounded-[1rem] bg-sage">
        {imageFailed ? <div className="flex h-full items-center justify-center px-5 text-center text-xs font-semibold text-muted">Image unavailable</div> : <Image src={product.thumbnail} alt={product.title} fill sizes="(max-width: 639px) 45vw, (max-width: 1023px) 30vw, 22vw" className="object-contain p-3 transition duration-500 group-hover:scale-105" onError={() => setImageFailed(true)} />}
        <Button type="button" variant="outline" size="icon" aria-label={`${saved ? "Remove" : "Add"} ${product.title} from wishlist`} onClick={() => toggleWishlist(product.id)} className="absolute right-3 top-3 h-10 w-10 min-h-10 rounded-full bg-white/90 shadow-sm">
          <Heart size={17} fill={saved ? "currentColor" : "none"} className={saved ? "text-coral" : ""} />
        </Button>
        {hasDiscount && <span className="absolute bottom-3 left-3 rounded-full bg-coral px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">{Math.round(product.discountPercentage)}% off</span>}
      </div>
      <button type="button" onClick={() => onQuickView(product)} className="flex min-h-[7.75rem] w-full flex-1 flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2">
        <p className="mt-4 text-[11px] font-bold uppercase tracking-[.16em] text-muted">{product.brand ?? categoryLabels[product.category] ?? product.category}</p>
        <h2 className="mt-1 line-clamp-2 min-h-[3.25rem] font-display text-lg leading-tight">{product.title}</h2>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="min-w-0">
            <span className="block truncate font-semibold">{money.format(discountedPrice)}</span>
            {hasDiscount && <span className="block truncate text-xs text-muted line-through">{money.format(product.price * 84)}</span>}
          </div>
          <span className="shrink-0 text-xs text-muted">★ {product.rating.toFixed(1)}</span>
        </div>
      </button>
      <Button type="button" variant={compared ? "secondary" : "outline"} size="sm" aria-pressed={compared} disabled={comparisonFull && !compared} onClick={() => onToggleCompare(product)} className="mt-3 w-full">
        {compared ? "Remove from comparison" : comparisonFull ? "Comparison full" : "Compare"}
      </Button>
      <Button
        type="button"
        size="sm"
        aria-label={`Add ${product.title} to cart`}
        disabled={product.stock <= 0}
        onClick={() => addToCart(product)}
        className="mt-3 w-full"
      >
        <Plus size={14} /> {product.stock > 0 ? "Add to cart" : "Out of stock"}
      </Button>
    </article>
  );
}

function SkeletonGrid() {
  return <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <div key={index} className="animate-pulse rounded-[1.4rem] bg-white p-3"><div className="aspect-[1.1] rounded-[1rem] bg-sage" /><div className="mt-4 h-3 w-1/3 rounded bg-sage" /><div className="mt-2 h-5 w-4/5 rounded bg-sage" /></div>)}</div>;
}

export function CataloguePage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const paramsString = params.toString();
  const [input, setInput] = useState(params.get("q") ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(params.get("q") ?? "");
  const [sort, setSort] = useState(params.get("sort") ?? "relevance");
  const [minRating, setMinRating] = useState(Number(params.get("rating") ?? 0));
  const [maxPrice, setMaxPrice] = useState(Number(params.get("maxPrice") ?? 2000));
  const [stock, setStock] = useState<"all" | "in" | "out">((params.get("stock") as "all" | "in" | "out") ?? "all");
  const [onSaleOnly, setOnSaleOnly] = useState(params.get("sale") === "true");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(params.getAll("category"));
  const [selectedBrands, setSelectedBrands] = useState<string[]>(params.getAll("brand"));
  const [page, setPage] = useState(parsePage(params.get("page")));
  const [quickView, setQuickView] = useState<Product | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(-1);
  const [searchFocused, setSearchFocused] = useState(false);
  const { recentSearches, addRecentSearch, clearRecentSearches, cart, comparison, toggleComparison: toggleStoredComparison, removeComparison, clearComparison } = useShopStore();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(input);
      setPage(1);
      const next = new URLSearchParams(window.location.search);
      if (input) next.set("q", input); else next.delete("q");
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [input, pathname, router]);

  useEffect(() => {
    const next = new URLSearchParams(paramsString);
    if (sort !== "relevance") next.set("sort", sort); else next.delete("sort");
    if (minRating > 0) next.set("rating", String(minRating)); else next.delete("rating");
    if (maxPrice < 2000) next.set("maxPrice", String(maxPrice)); else next.delete("maxPrice");
    if (stock !== "all") next.set("stock", stock); else next.delete("stock");
    if (onSaleOnly) next.set("sale", "true"); else next.delete("sale");
    next.delete("brand");
    selectedBrands.forEach((brand) => next.append("brand", brand));
    next.delete("category");
    selectedCategories.forEach((category) => next.append("category", category));
    if (page > 1) next.set("page", String(page)); else next.delete("page");
    router.replace(`${pathname}${next.toString() ? `?${next.toString()}` : ""}`, { scroll: false });
  }, [sort, minRating, maxPrice, stock, onSaleOnly, selectedCategories, selectedBrands, page, pathname, router, paramsString]);

  useEffect(() => {
    const syncPageFromHistory = () => setPage(parsePage(new URLSearchParams(window.location.search).get("page")));
    window.addEventListener("popstate", syncPageFromHistory);
    return () => window.removeEventListener("popstate", syncPageFromHistory);
  }, []);

  const products = useQuery({ queryKey: ["products", debouncedSearch], queryFn: () => getProducts(debouncedSearch) });
  const categories = useQuery({ queryKey: ["categories"], queryFn: getCategories });
  const activeCategory = selectedCategories[0] ?? "all";
  const suggestions = useMemo(() => getSearchSuggestions(products.data?.products ?? [], input), [products.data, input]);
  const popularSearches = useMemo(() => (products.data?.products ?? []).slice(0, 5).map((product) => product.title), [products.data]);
  const brands = useMemo(() => [...new Set((products.data?.products ?? []).map((product) => product.brand).filter((brand): brand is string => Boolean(brand)))].sort(), [products.data]);
  const filteredProducts = useMemo(() => {
    return filterAndSortProducts(products.data?.products ?? [], {
      category: activeCategory,
      categories: selectedCategories,
      brands: selectedBrands,
      maxPrice,
      minRating,
      stock,
      onSaleOnly,
    }, sort);
  }, [products.data, activeCategory, selectedCategories, selectedBrands, maxPrice, minRating, stock, onSaleOnly, sort]);
  const visibleProducts = filteredProducts.slice((page - 1) * 12, page * 12);
  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / 12));
  const hasFilters = activeCategory !== "all" || maxPrice < 2000 || minRating > 0 || stock !== "all" || onSaleOnly || selectedBrands.length > 0;

  function clearFilters() {
    setMaxPrice(2000); setMinRating(0); setStock("all"); setOnSaleOnly(false); setSelectedCategories([]); setSelectedBrands([]); setPage(1);
    router.push(pathname);
  }

  function clearSearch() {
    setInput("");
    setDebouncedSearch("");
    setSearchFocused(false);
    const next = new URLSearchParams(paramsString);
    next.delete("q");
    router.replace(`${pathname}${next.toString() ? `?${next.toString()}` : ""}`, { scroll: false });
  }

  function changePage(nextPage: number) {
    const next = new URLSearchParams(window.location.search);
    if (nextPage > 1) next.set("page", String(nextPage)); else next.delete("page");
    window.history.pushState({}, "", `${pathname}${next.toString() ? `?${next.toString()}` : ""}`);
    setPage(nextPage);
  }

  function selectSuggestion(suggestion: ReturnType<typeof getSearchSuggestions>[number]) {
    if (suggestion.type === "category" && suggestion.category) {
      setInput("");
      router.push(`${pathname}?category=${encodeURIComponent(suggestion.category)}`);
    } else {
      setInput(suggestion.label);
    }
    setSuggestionIndex(-1);
    setSearchFocused(false);
  }

  function toggleComparison(product: Product) {
    toggleStoredComparison(product);
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSuggestionIndex((current) => Math.min(current + 1, suggestions.length - 1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSuggestionIndex((current) => Math.max(current - 1, 0));
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (suggestionIndex >= 0 && suggestions[suggestionIndex]) selectSuggestion(suggestions[suggestionIndex]);
      else if (input.trim()) { addRecentSearch(input.trim()); setSearchFocused(false); }
    }
    if (event.key === "Escape") setSearchFocused(false);
  }

  return (
    <main>
      <header className="border-b border-ink/10 bg-cream">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-5 lg:px-8">
          <Link href="/" className="shrink-0 font-display text-2xl font-bold tracking-tight">shop<span className="text-leaf">sphere</span><sup className="ml-1 text-xs text-coral">AI</sup></Link>
          <div className="relative ml-auto hidden max-w-md flex-1 md:block">
            <Search className="absolute left-4 top-3 text-muted" size={18} />
            <input aria-label="Search products" value={input} onFocus={() => setSearchFocused(true)} onChange={(event) => { setInput(event.target.value); setSuggestionIndex(-1); }} onKeyDown={handleSearchKeyDown} placeholder="Search for something lovely..." className="w-full rounded-full border border-ink/10 bg-white py-2.5 pl-11 pr-10 text-sm outline-none ring-leaf/20 focus:ring-4" />
            {input && <button type="button" aria-label="Clear search" onClick={clearSearch} className="absolute right-3 top-2.5 rounded-full p-1 text-muted hover:text-ink"><X size={16} /></button>}
            {searchFocused && <SearchSuggestions suggestions={suggestions} recentSearches={recentSearches} popularSearches={popularSearches} productsLoaded={Boolean(products.data)} selectedIndex={suggestionIndex} onSelect={selectSuggestion} onRecentSelect={(query) => { setInput(query); setSearchFocused(false); }} onClearRecent={clearRecentSearches} />}
          </div>
          <Link href="/account" aria-label="Wishlist" className="rounded-full p-2.5 hover:bg-sage"><Heart size={20} /></Link>
          <Link href="/cart" aria-label="Cart" className="relative rounded-full bg-ink p-2.5 text-white"><ShoppingBag size={19} /><span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-coral px-1 text-[10px] font-bold">{cartCount}</span></Link>
        </div>
        <div className="relative mx-auto w-full px-5 pb-4 md:hidden">
          <Search className="absolute left-9 top-3 text-muted" size={18} />
          <input aria-label="Search products mobile" value={input} onFocus={() => setSearchFocused(true)} onChange={(event) => { setInput(event.target.value); setSuggestionIndex(-1); }} onKeyDown={handleSearchKeyDown} placeholder="Search products..." className="w-full rounded-full border border-ink/10 bg-white py-2.5 pl-11 pr-10 text-sm outline-none ring-leaf/20 focus:ring-4" />
          {input && <button type="button" aria-label="Clear search mobile" onClick={clearSearch} className="absolute right-8 top-2.5 rounded-full p-1 text-muted hover:text-ink"><X size={16} /></button>}
          {searchFocused && <SearchSuggestions suggestions={suggestions} recentSearches={recentSearches} popularSearches={popularSearches} productsLoaded={Boolean(products.data)} selectedIndex={suggestionIndex} onSelect={selectSuggestion} onRecentSelect={(query) => { setInput(query); setSearchFocused(false); }} onClearRecent={clearRecentSearches} />}
        </div>
        <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-5 pb-4 lg:px-8">
          {["all", ...(categories.data?.slice(0, 8).map((category) => category.slug) ?? [])].map((category) => <button key={category} onClick={() => { setSelectedCategories(category === "all" ? [] : [category]); setPage(1); }} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition ${activeCategory === category ? "bg-ink text-white" : "bg-white text-muted hover:bg-sage"}`}>{categoryLabels[category] ?? category.replaceAll("-", " ")}</button>)}
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 pb-10 pt-12 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#dce9dc] px-7 py-12 sm:px-14">
          <div className="relative z-10 max-w-xl"><p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-leaf"><Sparkles size={15} /> the thoughtful edit</p><h1 className="font-display text-4xl leading-tight sm:text-6xl">Find things that feel <em className="text-leaf">like you.</em></h1><p className="mt-5 max-w-md text-sm leading-6 text-ink/70">A softer way to shop, with considered finds and a little intelligence on your side.</p></div>
          <div className="absolute -right-10 -top-28 h-80 w-80 rounded-full border-[32px] border-white/40" />
          <div className="absolute -bottom-28 right-32 h-64 w-64 rounded-full border-[24px] border-leaf/10" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[.2em] text-coral">{debouncedSearch ? "Search results" : activeCategory === "all" ? "Curated for you" : categoryLabels[activeCategory] ?? activeCategory}</p><h2 className="mt-2 font-display text-3xl">Explore the collection</h2><p className="mt-1 text-sm text-muted">{filteredProducts.length} considered finds</p></div>
          <div className="flex items-center gap-2"><label className="sr-only" htmlFor="sort">Sort products</label><select id="sort" value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }} className="rounded-full border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none"><option value="relevance">Sort: Relevance</option><option value="price-low">Price: Low to high</option><option value="price-high">Price: High to low</option><option value="rating">Top rated</option><option value="newest">Newest</option></select></div>
        </div>
        <section aria-label="Catalogue filters" className="mb-8 rounded-2xl border border-ink/10 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid items-start gap-5 md:grid-cols-2 lg:grid-cols-[auto_minmax(260px,1.5fr)_minmax(130px,.7fr)_minmax(150px,.8fr)_auto_minmax(240px,1.4fr)] lg:gap-x-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink"><SlidersHorizontal size={17} className="text-leaf" /> Refine</h3>
            <label className="min-w-0 text-xs font-semibold text-muted">
              <span className="mb-2 block">Price range</span>
              <input aria-label="Maximum price" type="range" min="100" max="2000" step="50" value={maxPrice} onChange={(event) => setMaxPrice(Number(event.target.value))} className="block h-2 w-full cursor-pointer accent-leaf" />
              <span className="mt-2 flex justify-between gap-3 text-[11px] font-medium text-muted"><span>{money.format(100 * 84)}</span><span>{money.format(maxPrice * 84)}</span></span>
            </label>
            <label className="text-xs font-semibold text-muted">
              <span className="mb-2 block">Rating</span>
              <select aria-label="Minimum rating" value={minRating} onChange={(event) => setMinRating(Number(event.target.value))} className="min-h-10 w-full rounded-xl border border-ink/10 bg-cream px-3 py-2 text-sm font-medium text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"><option value="0">Any rating</option><option value="3">3+ stars</option><option value="4">4+ stars</option></select>
            </label>
            <label className="text-xs font-semibold text-muted">
              <span className="mb-2 block">Availability</span>
              <select aria-label="Availability" value={stock} onChange={(event) => { setStock(event.target.value as "all" | "in" | "out"); setPage(1); }} className="min-h-10 w-full rounded-xl border border-ink/10 bg-cream px-3 py-2 text-sm font-medium text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"><option value="all">All products</option><option value="in">In stock</option><option value="out">Out of stock</option></select>
            </label>
            <label className="flex min-h-10 items-center gap-2 self-end rounded-xl border border-ink/10 bg-cream px-3 py-2 text-sm font-medium text-ink"><input type="checkbox" checked={onSaleOnly} onChange={(event) => setOnSaleOnly(event.target.checked)} className="h-4 w-4 accent-leaf" /> On sale</label>
            {brands.length > 0 && <fieldset className="min-w-0">
              <legend className="mb-2 text-xs font-semibold text-muted">Brand</legend>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {brands.slice(0, 6).map((brand) => <label key={brand} className="flex min-h-7 items-center gap-2 text-sm text-ink"><input type="checkbox" checked={selectedBrands.includes(brand)} onChange={(event) => { setSelectedBrands((current) => event.target.checked ? [...current, brand] : current.filter((item) => item !== brand)); setPage(1); }} className="h-4 w-4 shrink-0 accent-leaf" /> <span>{brand}</span></label>)}
              </div>
            </fieldset>}
          </div>
          {categories.data && <fieldset className="mt-5 border-t border-ink/10 pt-4">
            <legend className="mb-3 text-xs font-semibold uppercase tracking-[.14em] text-muted">Categories</legend>
            <div className="grid gap-x-5 gap-y-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              <label className="flex min-h-8 items-center gap-2 rounded-lg px-2 text-sm font-medium text-ink hover:bg-sage"><input type="checkbox" checked={selectedCategories.length === 0} onChange={() => { setSelectedCategories([]); setPage(1); }} className="h-4 w-4 shrink-0 accent-leaf" /> All categories</label>
              {categories.data.slice(0, 8).map((category) => <label key={category.slug} className="flex min-h-8 items-center gap-2 rounded-lg px-2 text-sm text-ink hover:bg-sage"><input type="checkbox" checked={selectedCategories.includes(category.slug)} onChange={(event) => { setSelectedCategories((current) => event.target.checked ? [...current, category.slug] : current.filter((item) => item !== category.slug)); setPage(1); }} className="h-4 w-4 shrink-0 accent-leaf" /> <span>{categoryLabels[category.slug] ?? category.name}</span></label>)}
            </div>
          </fieldset>}
          {hasFilters && <button type="button" onClick={clearFilters} className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-coral hover:underline">Clear all <X size={14} /></button>}
        </section>
        {comparison.length > 0 && <div className="mb-8 flex flex-wrap items-center gap-3 rounded-2xl bg-ink p-4 text-white"><span className="text-sm font-semibold">{comparison.length} product{comparison.length === 1 ? "" : "s"} selected</span><button type="button" disabled={comparison.length < 2} onClick={() => setShowComparison(true)} className="rounded-full bg-white px-4 py-2 text-xs font-bold text-ink disabled:cursor-not-allowed disabled:opacity-50">Compare now</button><button type="button" onClick={clearComparison} className="ml-auto text-xs font-semibold underline">Clear</button></div>}
        {products.isLoading ? <SkeletonGrid /> : products.isError ? <div className="rounded-3xl bg-white p-12 text-center"><h2 className="font-display text-2xl">The shelves need a moment</h2><p className="mt-2 text-sm text-muted">We couldn&apos;t reach the catalogue right now.</p><button onClick={() => products.refetch()} className="mt-5 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white">Try again</button></div> : visibleProducts.length === 0 ? <div className="rounded-3xl bg-white p-12 text-center"><h2 className="font-display text-2xl">Nothing quite matches</h2><p className="mt-2 text-sm text-muted">{debouncedSearch ? `No products found for “${debouncedSearch}”.` : "Try widening your filters or exploring all finds."}</p><button onClick={debouncedSearch ? clearSearch : clearFilters} className="mt-5 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white">{debouncedSearch ? "Clear search" : "Clear filters"}</button></div> : <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{visibleProducts.map((product) => <ProductCard key={product.id} product={product} compared={comparison.some((item) => item.id === product.id)} comparisonFull={comparison.length >= 4} onQuickView={setQuickView} onToggleCompare={toggleComparison} />)}</div>}
        {pageCount > 1 && <div className="mt-10 flex justify-center gap-2">{Array.from({ length: pageCount }).map((_, index) => <button key={index} type="button" onClick={() => changePage(index + 1)} className={`h-9 w-9 rounded-full text-sm ${page === index + 1 ? "bg-ink text-white" : "bg-white"}`}>{index + 1}</button>)}</div>}
        {products.data?.products && <RecommendationRail products={products.data.products} strategy="trending" title="Trending right now" signals={{ viewedProductIds: [], wishlistIds: useShopStore.getState().wishlist, searchHistory: recentSearches }} />}
      </section>

      <footer className="border-t border-ink/10 px-5 py-8 text-center text-xs text-muted"><span className="font-display text-lg font-bold text-ink">shop<span className="text-leaf">sphere</span></span><p className="mt-2">Thoughtful shopping, one good find at a time.</p></footer>
      {products.data?.products && <AssistantPanel products={products.data.products} />}

      {quickView && <div role="dialog" aria-modal="true" aria-label={`Quick view ${quickView.title}`} className="fixed inset-0 z-20 flex items-center justify-center bg-ink/40 p-5" onClick={() => setQuickView(null)}><div className="grid max-w-2xl gap-6 rounded-[2rem] bg-cream p-5 sm:grid-cols-2 sm:p-7" onClick={(event) => event.stopPropagation()}><div className="relative aspect-square overflow-hidden rounded-2xl bg-sage"><Image src={quickView.thumbnail} alt={quickView.title} fill sizes="300px" className="object-cover" /></div><div className="flex flex-col justify-center"><button aria-label="Close quick view" onClick={() => setQuickView(null)} className="mb-5 self-end rounded-full bg-white p-2"><X size={18} /></button><p className="text-xs font-bold uppercase tracking-wider text-coral">{quickView.brand ?? quickView.category}</p><h2 className="mt-2 font-display text-3xl">{quickView.title}</h2><p className="mt-3 text-sm leading-6 text-muted">{quickView.description}</p><p className="mt-5 text-xl font-semibold">{money.format(quickView.price * 84)}</p><button disabled={quickView.stock <= 0} onClick={() => { useShopStore.getState().addToCart(quickView); setQuickView(null); }} className="mt-6 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white disabled:bg-muted">{quickView.stock > 0 ? "Add to cart" : "Out of stock"}</button><Link href={`/products/${quickView.id}`} onClick={() => setQuickView(null)} className="mt-3 text-center text-sm font-semibold text-leaf">View full details</Link></div></div></div>}
      {showComparison && <ComparisonView products={comparison} onRemove={removeComparison} onBack={() => setShowComparison(false)} />}
    </main>
  );
}

function SearchSuggestions({ suggestions, recentSearches, popularSearches, productsLoaded, selectedIndex, onSelect, onRecentSelect, onClearRecent }: { suggestions: ReturnType<typeof getSearchSuggestions>; recentSearches: string[]; popularSearches: string[]; productsLoaded: boolean; selectedIndex: number; onSelect: (suggestion: ReturnType<typeof getSearchSuggestions>[number]) => void; onRecentSelect: (query: string) => void; onClearRecent: () => void }) {
  const recentItems = recentSearches.map((query) => ({ id: `recent-${query}`, label: query, type: "product" as const }));
  const popularItems = popularSearches.map((query) => ({ id: `popular-${query}`, label: query, type: "product" as const }));
  const items = suggestions.length > 0 ? suggestions : recentItems.length > 0 ? recentItems : popularItems;
  if (!productsLoaded && recentSearches.length === 0) return null;
  return <div role="listbox" aria-label="Search suggestions" className="absolute left-0 right-0 top-12 z-10 rounded-2xl bg-white p-2 shadow-soft"><p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted">{suggestions.length > 0 ? "Suggestions" : recentItems.length > 0 ? "Recent searches" : "Popular searches"}</p>{items.length > 0 ? items.map((item, index) => <button type="button" role="option" aria-selected={index === selectedIndex} key={item.id} onClick={() => item.id.startsWith("recent-") || item.id.startsWith("popular-") ? onRecentSelect(item.label) : onSelect(item)} className={`block w-full rounded-xl px-3 py-2 text-left text-sm ${index === selectedIndex ? "bg-sage" : "hover:bg-cream"}`}>{item.label}</button>) : <p className="px-3 py-2 text-sm text-muted">No suggestions available.</p>}{suggestions.length === 0 && recentSearches.length > 0 && <button type="button" onClick={onClearRecent} className="px-3 py-2 text-xs font-semibold text-coral underline">Clear recent searches</button>}</div>;
}

function ComparisonView({ products, onRemove, onBack }: { products: Product[]; onRemove: (id: number) => void; onBack: () => void }) {
  if (products.length === 0) return <div role="dialog" aria-modal="true" aria-label="Product comparison" className="fixed inset-0 z-30 flex items-center justify-center bg-cream p-5"><div className="w-full max-w-xl rounded-3xl bg-white p-10 text-center shadow-soft"><h1 className="font-display text-4xl">Compare products</h1><p className="mt-3 text-sm text-muted">Your comparison is empty. Select two to four products from the catalogue to compare them here.</p><button type="button" onClick={onBack} className="mt-7 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white"><ArrowLeft size={16} /> Back to catalogue</button></div></div>;
  const rows: Array<[string, (product: Product) => string]> = [
    ["Price", (product) => money.format(product.price * 84 * (1 - product.discountPercentage / 100))],
    ["Rating", (product) => product.rating ? `${product.rating.toFixed(1)} / 5` : "Not available"],
    ["Brand", (product) => product.brand ?? "Not available"],
    ["Category", (product) => product.category || "Not available"],
    ["Availability", (product) => product.stock > 0 ? `${product.stock} in stock` : "Out of stock"],
    ["Specifications", (product) => product.description || "Not available"],
  ];
  return <div role="dialog" aria-modal="true" aria-label="Product comparison" className="fixed inset-0 z-30 overflow-auto bg-cream p-5 sm:p-10"><div className="mx-auto max-w-7xl"><button type="button" onClick={onBack} className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-leaf"><ArrowLeft size={16} /> Back to catalogue</button><div className="rounded-3xl bg-white p-5 shadow-soft sm:p-8"><h1 className="font-display text-4xl">Compare products</h1><p className="mt-2 text-sm text-muted">Compare {products.length} selected products side by side.</p><div className="mt-8 overflow-x-auto"><table className="w-full min-w-[640px] table-fixed border-collapse text-left text-sm"><thead><tr><th className="w-36 border-b border-ink/10 p-3">Field</th>{products.map((product) => <th key={product.id} className="border-b border-ink/10 p-3 align-top"><div className="flex items-start justify-between gap-2"><span>{product.title}</span><button type="button" aria-label={`Remove ${product.title} from comparison`} onClick={() => onRemove(product.id)} className="text-muted hover:text-coral"><X size={16} /></button></div></th>)}</tr></thead><tbody>{rows.map(([label, value]) => <tr key={label}><th className="border-b border-ink/10 p-3 font-semibold">{label}</th>{products.map((product) => <td key={product.id} className="border-b border-ink/10 p-3 align-top text-muted">{value(product)}</td>)}</tr>)}</tbody></table></div>{products.length < 2 && <p className="mt-6 rounded-xl bg-sage p-4 text-sm text-leaf">Select at least two products to compare.</p>}</div></div></div>;
}
