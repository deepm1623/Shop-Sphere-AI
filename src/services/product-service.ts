import type { Category, Product, ProductResponse } from "@/types/product";

const API_URL = process.env.NEXT_PUBLIC_PRODUCT_API_URL ?? "https://dummyjson.com";

export class ProductServiceError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = "ProductServiceError";
  }
}

function isProduct(value: unknown): value is Product {
  if (!value || typeof value !== "object") return false;
  const product = value as Record<string, unknown>;
  return typeof product.id === "number" &&
    typeof product.title === "string" &&
    typeof product.description === "string" &&
    typeof product.category === "string" &&
    typeof product.price === "number" &&
    typeof product.discountPercentage === "number" &&
    typeof product.rating === "number" &&
    typeof product.stock === "number" &&
    typeof product.thumbnail === "string" &&
    Array.isArray(product.images);
}

function isProductResponse(value: unknown): value is ProductResponse {
  if (!value || typeof value !== "object") return false;
  const response = value as Record<string, unknown>;
  return Array.isArray(response.products) &&
    response.products.every(isProduct) &&
    typeof response.total === "number" &&
    typeof response.skip === "number" &&
    typeof response.limit === "number";
}

function isCategory(value: unknown): value is Category {
  if (!value || typeof value !== "object") return false;
  const category = value as Record<string, unknown>;
  return typeof category.slug === "string" && typeof category.name === "string" && typeof category.url === "string";
}

async function getJson<T>(path: string, validate: (value: unknown) => value is T): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`);
  } catch {
    throw new ProductServiceError("The catalogue is unavailable. Check your connection and try again.");
  }

  if (!response.ok) {
    throw new ProductServiceError("We couldn't load the catalogue. Please try again.", response.status);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ProductServiceError("The catalogue returned an invalid response. Please try again.");
  }

  if (!validate(payload)) {
    throw new ProductServiceError("The catalogue returned unexpected data. Please try again.");
  }

  return payload;
}

export function getProducts(search = ""): Promise<ProductResponse> {
  const query = search ? `/products/search?q=${encodeURIComponent(search)}&limit=100` : "/products?limit=100";
  return getJson(query, isProductResponse);
}

export function getProduct(id: number): Promise<Product> {
  return getJson(`/products/${id}`, isProduct);
}

export function getCategories(): Promise<Category[]> {
  return getJson("/products/categories", (value): value is Category[] => Array.isArray(value) && value.every(isCategory));
}
