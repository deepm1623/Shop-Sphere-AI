"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthSession, MockUser, UserRole } from "@/types/domain";

type AuthState = {
  session: AuthSession | null;
  hydrated: boolean;
  login: (email: string, password: string) => { ok: true } | { ok: false; message: string };
  register: (name: string, email: string, password: string) => { ok: true } | { ok: false; message: string };
  logout: () => void;
  setHydrated: (hydrated: boolean) => void;
};

const DEMO_USERS: Array<{ user: MockUser; password: string }> = [
  { user: { id: "customer-demo", name: "Demo Customer", email: "customer@shopsphere.demo", role: "customer" }, password: "shop123" },
  { user: { id: "admin-demo", name: "Demo Administrator", email: "admin@shopsphere.demo", role: "administrator" }, password: "admin123" },
];

function createSession(user: MockUser): AuthSession {
  return { token: `demo-${user.id}-${Date.now()}`, user, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString() };
}

function validateCredentials(email: string, password: string): string | null {
  if (!email.trim() || !email.includes("@")) return "Enter a valid email address.";
  if (password.length < 6) return "Password must be at least 6 characters.";
  return null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      hydrated: false,
      login: (email, password) => {
        const validationError = validateCredentials(email, password);
        if (validationError) return { ok: false, message: validationError };
        const match = DEMO_USERS.find((entry) => entry.user.email === email.trim().toLowerCase() && entry.password === password);
        if (!match) return { ok: false, message: "Those demo credentials are not recognised." };
        set({ session: createSession(match.user) });
        return { ok: true };
      },
      register: (name, email, password) => {
        const validationError = validateCredentials(email, password);
        if (!name.trim()) return { ok: false, message: "Enter your name." };
        if (validationError) return { ok: false, message: validationError };
        const user: MockUser = { id: `local-${Date.now()}`, name: name.trim(), email: email.trim().toLowerCase(), role: "customer" };
        set({ session: createSession(user) });
        return { ok: true };
      },
      logout: () => set({ session: null }),
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: "shopsphere-session",
      partialize: (state) => ({ session: state.session }),
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        if (state?.session && new Date(state.session.expiresAt) <= new Date()) state.logout();
        state?.setHydrated(true);
      },
    },
  ),
);

export function hasRole(session: AuthSession | null, role?: UserRole): boolean {
  if (!session || new Date(session.expiresAt) <= new Date()) return false;
  return !role || session.user.role === role;
}
