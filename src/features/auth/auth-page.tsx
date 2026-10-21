"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/use-auth-store";

export function AuthPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, register } = useAuthStore();
  const next = params.get("next")?.startsWith("/") ? params.get("next")! : "/";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const result = mode === "login" ? login(email, password) : register(name, email, password);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.replace(next);
  }

  return <main className="flex min-h-screen items-center justify-center bg-cream px-4 py-8 sm:px-5 sm:py-10"><div className="w-full max-w-md rounded-[2rem] border border-ink/5 bg-white p-6 shadow-soft sm:p-10"><Link href="/" className="font-display text-2xl font-bold">shop<span className="text-leaf">sphere</span><sup className="ml-1 text-xs text-coral">AI</sup></Link><p className="mt-8 text-xs font-bold uppercase tracking-[.2em] text-coral">Demo account</p><h1 className="mt-2 font-display text-4xl">{mode === "login" ? "Welcome back" : "Join the edit"}</h1><p className="mt-3 text-sm leading-6 text-muted">This is a local demo authentication flow. It is not production security and never stores your password in the session.</p><form onSubmit={submit} className="mt-7 space-y-4">{mode === "register" && <label className="block text-sm font-semibold">Name<Input autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} className="mt-2" /></label>}<label className="block text-sm font-semibold">Email<Input autoComplete="email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2" /></label><label className="block text-sm font-semibold">Password<div className="relative mt-2"><Input autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={6} type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} className="pr-12" /><Button type="button" variant="ghost" size="icon" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((current) => !current)} className="absolute right-1 top-1 h-9 w-9 min-h-9"><span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</Button></div></label>{error && <p role="alert" className="rounded-xl border border-coral/20 bg-coral/10 p-3 text-sm leading-5 text-coral">{error}</p>}<Button type="submit" disabled={busy} loading={busy} className="w-full">{busy ? "Working..." : mode === "login" ? "Log in" : "Create demo account"}</Button></form>{mode === "login" && <p className="mt-5 rounded-xl bg-sage p-3 text-xs leading-5 text-ink/70">Customer: customer@shopsphere.demo / shop123<br />Administrator: admin@shopsphere.demo / admin123</p>}<Button type="button" variant="link" className="mt-6 w-full" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>{mode === "login" ? "Create a demo account" : "Already have a demo account? Log in"}</Button></div></main>;
}
