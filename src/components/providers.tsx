"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useShopStore } from "@/store/use-shop-store";
import { useAuthStore } from "@/store/use-auth-store";
import { useCheckoutStore } from "@/store/use-checkout-store";

export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000 } } }));
  useEffect(() => {
    useShopStore.persist.rehydrate();
    useAuthStore.persist.rehydrate();
    useCheckoutStore.persist.rehydrate();
  }, []);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
