"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { hasRole, useAuthStore } from "@/store/use-auth-store";
import type { UserRole } from "@/types/domain";

export function ProtectedRoute({ children, role }: Readonly<{ children: React.ReactNode; role?: UserRole }>) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, hydrated } = useAuthStore();

  useEffect(() => {
    if (hydrated && !hasRole(session, role)) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [hydrated, pathname, role, router, session]);

  if (!hydrated || !hasRole(session, role)) return <div className="flex min-h-screen items-center justify-center bg-cream p-5 text-sm text-muted">Checking your demo session...</div>;
  return children;
}
