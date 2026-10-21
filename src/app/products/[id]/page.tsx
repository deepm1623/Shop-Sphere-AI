import { Suspense } from "react";
import { ProductDetailPage } from "@/features/products/product-detail-page";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = Number(id);
  return <Suspense fallback={<div className="min-h-screen bg-cream" />}><ProductDetailPage productId={productId} /></Suspense>;
}
