import type { Product } from "@/types/product";

export type CatalogueFilters = {
  category: string;
  categories?: string[];
  brands?: string[];
  maxPrice: number;
  minRating: number;
  stock?: "all" | "in" | "out";
  inStockOnly?: boolean;
  onSaleOnly: boolean;
};

export function filterAndSortProducts(products: Product[], filters: CatalogueFilters, sort: string): Product[] {
  const categories = filters.categories ?? (filters.category === "all" ? [] : [filters.category]);
  const brands = filters.brands ?? [];
  const stock = filters.stock ?? (filters.inStockOnly ? "in" : "all");
  const filtered = products.filter((product) =>
    (categories.length === 0 || categories.includes(product.category)) &&
    (brands.length === 0 || (product.brand ? brands.includes(product.brand) : false)) &&
    product.price <= filters.maxPrice &&
    product.rating >= filters.minRating &&
    (stock === "all" || (stock === "in" ? product.stock > 0 : product.stock <= 0)) &&
    (!filters.onSaleOnly || product.discountPercentage > 0),
  );

  return [...filtered].sort((a, b) =>
    sort === "price-low" ? a.price - b.price :
    sort === "price-high" ? b.price - a.price :
    sort === "rating" ? b.rating - a.rating : b.id - a.id,
  );
}

export type SearchSuggestion = {
  id: string;
  label: string;
  type: "product" | "category";
  productId?: number;
  category?: string;
};

export function getSearchSuggestions(products: Product[], query: string, limit = 6): SearchSuggestion[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  const productSuggestions = products
    .filter((product) => [product.title, product.brand, product.category].some((value) => value?.toLowerCase().includes(normalizedQuery)))
    .slice(0, limit)
    .map((product) => ({
      id: `product-${product.id}`,
      label: product.title,
      type: "product" as const,
      productId: product.id,
      category: product.category,
    }));
  const remaining = Math.max(0, limit - productSuggestions.length);
  const categorySuggestions = [...new Set(products.map((product) => product.category))]
    .filter((category) => category.toLowerCase().includes(normalizedQuery))
    .slice(0, remaining)
    .map((category) => ({ id: `category-${category}`, label: category.replaceAll("-", " "), type: "category" as const, category }));

  return [...productSuggestions, ...categorySuggestions];
}

export function toggleComparisonProduct(products: Product[], product: Product, max = 4): Product[] {
  if (products.some((item) => item.id === product.id)) return products;
  if (products.length >= max) return products;
  return [...products, product];
}

export function removeComparisonProduct(products: Product[], productId: number): Product[] {
  return products.filter((product) => product.id !== productId);
}
