import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProductDetailPage, ProductDetailView } from "./product-detail-page";
import { useShopStore } from "@/store/use-shop-store";
import type { Product } from "@/types/product";

const product: Product = {
  id: 1, title: "Everyday Tote", description: "A useful tote.", category: "womens-bags", price: 100,
  discountPercentage: 10, rating: 4.4, stock: 2, thumbnail: "/tote.jpg", images: ["/tote.jpg", "/tote-2.jpg"],
};

vi.mock("@tanstack/react-query", () => ({ useQuery: vi.fn() }));
vi.mock("next/image", () => ({
  default: ({ fill: _fill, priority: _priority, ...props }: Record<string, unknown>) => <span role="img" aria-label={String(props.alt ?? "")} {...props} />,
}));

describe("product detail", () => {
  beforeEach(() => {
    useShopStore.setState({ wishlist: [], recentSearches: [], cart: [], savedForLater: [], hydrated: true });
  });

  it("renders loading and error states", async () => {
    const { useQuery } = await import("@tanstack/react-query");
    vi.mocked(useQuery).mockReturnValueOnce({ isLoading: true, isError: false } as never);
    const loading = render(<ProductDetailPage productId={1} />);
    expect(loading.getByText("Loading your find...")).toBeInTheDocument();

    loading.unmount();
    vi.mocked(useQuery).mockReturnValueOnce({ isLoading: false, isError: true } as never);
    render(<ProductDetailPage productId={1} />);
    expect(screen.getByText("We couldn't find that product")).toBeInTheDocument();
  });

  it("adds the selected quantity from the detail view", () => {
    render(<ProductDetailView product={product} relatedProducts={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Increase quantity" }));
    fireEvent.click(screen.getByRole("button", { name: "Add to cart" }));

    expect(useShopStore.getState().cart[0].quantity).toBe(2);
  });

  it("adds and removes the product from comparison", () => {
    render(<ProductDetailView product={product} relatedProducts={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Add to comparison" }));
    expect(useShopStore.getState().comparison.map((item) => item.id)).toEqual([product.id]);
    fireEvent.click(screen.getByRole("button", { name: "Remove from comparison" }));
    expect(useShopStore.getState().comparison).toHaveLength(0);
  });
});
