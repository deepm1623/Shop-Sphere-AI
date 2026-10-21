import { useAuthStore, hasRole } from "@/store/use-auth-store";
import { beforeEach, describe, expect, it } from "vitest";

describe("demo authentication", () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
    window.localStorage.clear();
  });

  it("validates credentials and creates a non-sensitive session", () => {
    expect(useAuthStore.getState().login("bad", "short").ok).toBe(false);
    expect(useAuthStore.getState().login("customer@shopsphere.demo", "shop123")).toEqual({ ok: true });
    const session = useAuthStore.getState().session;
    expect(session?.user.role).toBe("customer");
    expect(JSON.stringify(window.localStorage)).not.toContain("shop123");
  });

  it("rejects expired sessions and protects administrator routes by role", () => {
    const session = { token: "demo", user: { id: "1", name: "A", email: "a@example.com", role: "customer" as const }, expiresAt: new Date(Date.now() - 1000).toISOString() };
    expect(hasRole(session)).toBe(false);
    expect(hasRole({ ...session, expiresAt: new Date(Date.now() + 10000).toISOString() }, "administrator")).toBe(false);
  });
});
