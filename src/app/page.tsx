import { CataloguePage } from "@/features/catalogue/catalogue-page";
import { Suspense } from "react";

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream" />}>
      <CataloguePage />
    </Suspense>
  );
}
