import { Suspense } from "react";
import { AuthPage } from "@/features/auth/auth-page";

export default function LoginPage() {
  return <Suspense fallback={<div className="min-h-screen bg-cream" />}><AuthPage /></Suspense>;
}
