import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { getShellNavigation } from "@/lib/ui/navigation.js";
import {
  requireAdminSetupSession,
  requireCustomerSession,
  sessionRedirectPath,
} from "@/lib/ui/session-guard.js";
import {
  AccountStatusError,
  AuthenticationError,
  MfaRequiredError,
} from "@/modules/auth/authorization.js";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));

vi.mock("next/navigation", () => ({
  redirect: (path) => {
    throw new Error(`REDIRECT:${path}`);
  },
}));

beforeAll(() => {
  vi.stubEnv("DATABASE_URL", "postgresql://test:test@127.0.0.1:5432/test");
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe("getShellNavigation", () => {
  it("exposes one current destination per area", () => {
    expect(getShellNavigation("customer")).toEqual([
      { href: "/dashboard", label: "Dashboard" },
    ]);
    expect(getShellNavigation("provider")).toEqual([
      { href: "/provider/dashboard", label: "Dashboard" },
    ]);
    expect(getShellNavigation("admin")).toEqual([
      { href: "/admin", label: "Overview" },
      { href: "/mfa/verify", label: "Security" },
    ]);
  });

  it("returns no links for an unknown area", () => {
    expect(getShellNavigation("unknown")).toEqual([]);
  });
});

describe("sessionRedirectPath", () => {
  it("maps unauthenticated sessions to sign in", () => {
    expect(sessionRedirectPath(new AuthenticationError())).toBe("/login");
  });

  it("maps authorization failures to home", () => {
    expect(sessionRedirectPath(new AccountStatusError())).toBe("/");
  });

  it("routes MFA requirements to the security screen", () => {
    expect(sessionRedirectPath(new MfaRequiredError())).toBe("/mfa/verify");
  });

  it("does not conceal unexpected errors", () => {
    expect(sessionRedirectPath(new Error("boom"))).toBeNull();
  });
});

describe("requireCustomerSession", () => {
  it("redirects anonymous visitors before rendering the shell", async () => {
    await expect(requireCustomerSession()).rejects.toThrow("REDIRECT:/login");
  });
});

describe("requireAdminSetupSession", () => {
  it("redirects anonymous visitors to sign in", async () => {
    await expect(requireAdminSetupSession()).rejects.toThrow("REDIRECT:/login");
  });
});
