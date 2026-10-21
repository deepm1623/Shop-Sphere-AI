import { describe, expect, it } from "vitest";
import { filterAndSortProducts, getSearchSuggestions, removeComparisonProduct, toggleComparisonProduct } from "./catalogue-utils";
import type { Product } from "@/types/product";

const products: Product[] = [
  { id: 1, title: "Runner", description: "", category: "mens-shoes", price: 500, discountPercentage: 20, rating: 4.5, stock: 4, brand: "Stride", thumbnail: "", images: [] },
  { id: 2, title: "Boot", description: "", category: "mens-shoes", price: 900, discountPercentage: 0, rating: 4.8, stock: 0, brand: "Stride", thumbnail: "", images: [] },
  { id: 3, title: "Chair", description: "", category: "furniture", price: 700, discountPercentage: 10, rating: 3.8, stock: 2, brand: "Home", thumbnail: "", images: [] },
];

describe("filterAndSortProducts", () => {
  it("applies every active filter and sorts the remaining products", () => {
    const result = filterAndSortProducts(products, {
      category: "mens-shoes",
      brands: ["Stride"],
      maxPrice: 1000,
      minRating: 4,
      stock: "in",
      onSaleOnly: true,
    }, "price-low");

    expect(result.map((product) => product.id)).toEqual([1]);
  });

  it("supports brand and out-of-stock filters together", () => {
    const result = filterAndSortProducts(products, {
      category: "all",
      brands: ["Stride"],
      maxPrice: 2000,
      minRating: 0,
      stock: "out",
      onSaleOnly: false,
    }, "newest");

    expect(result.map((product) => product.id)).toEqual([2]);
  });

  it("sorts all products by rating when no filters are active", () => {
    const result = filterAndSortProducts(products, {
      category: "all",
      maxPrice: 2000,
      minRating: 0,
      inStockOnly: false,
      onSaleOnly: false,
    }, "rating");

    expect(result.map((product) => product.id)).toEqual([2, 1, 3]);
  });

  it("returns matching product and category suggestions", () => {
    expect(getSearchSuggestions(products, "shoe").map((suggestion) => suggestion.label)).toEqual(["Runner", "Boot", "mens shoes"]);
  });

  it("prevents duplicate comparisons and enforces four products", () => {
    const fourth = { ...products[0], id: 4, title: "Sneaker" };
    const fifth = { ...products[0], id: 5, title: "Trainer" };
    let selected = products.slice(0, 2);
    selected = toggleComparisonProduct(selected, products[0]);
    selected = toggleComparisonProduct(selected, products[2]);
    selected = toggleComparisonProduct(selected, fourth);
    selected = toggleComparisonProduct(selected, fifth);
    expect(selected.map((product) => product.id)).toEqual([1, 2, 3, 4]);
    expect(removeComparisonProduct(selected, 2).map((product) => product.id)).toEqual([1, 3, 4]);
  });
});
