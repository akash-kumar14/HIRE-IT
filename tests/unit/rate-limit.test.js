import { describe, expect, it } from "vitest";
import {
  AUTH_RATE_LIMITS,
  evaluateRateLimit,
  getClientIp,
  getWindowStart,
  IP_RATE_LIMIT,
  RateLimitError,
} from "@/lib/api/rate-limit.js";

describe("rate limit windows", () => {
  it("aligns a timestamp to the start of its fixed window", () => {
    const now = new Date("2026-11-21T10:05:30.000Z");
    const windowMs = 10 * 60 * 1000;

    expect(getWindowStart(now, windowMs).toISOString()).toBe(
      "2026-11-21T10:00:00.000Z",
    );
  });

  it("reports allowance, remaining count, and retry delay", () => {
    const now = new Date("2026-11-21T10:00:00.000Z");
    const input = { max: 3, windowMs: 60_000, now };
    const windowStart = getWindowStart(now, 60_000);

    expect(evaluateRateLimit({ ...input, windowStart, count: 2 })).toEqual({
      allowed: true,
      remaining: 1,
      retryAfterSeconds: 60,
    });
    expect(evaluateRateLimit({ ...input, windowStart, count: 4 })).toEqual({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 60,
    });
  });
});

describe("getClientIp", () => {
  it("uses the first forwarded address", () => {
    const request = new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.9, 10.0.0.1" },
    });

    expect(getClientIp(request)).toBe("203.0.113.9");
  });

  it("falls back to the real IP header and then to unknown", () => {
    const request = new Request("http://localhost", {
      headers: { "x-real-ip": "198.51.100.4" },
    });

    expect(getClientIp(request)).toBe("198.51.100.4");
    expect(getClientIp(new Request("http://localhost"))).toBe("unknown");
  });
});

describe("rate limit configuration", () => {
  it("defines endpoint-specific limits for auth flows", () => {
    for (const scope of [
      "register",
      "login",
      "password_reset",
      "password_reset_confirm",
      "email_verification",
      "email_verification_confirm",
    ]) {
      expect(AUTH_RATE_LIMITS[scope].max).toBeGreaterThan(0);
      expect(AUTH_RATE_LIMITS[scope].windowMs).toBeGreaterThan(0);
    }
    expect(IP_RATE_LIMIT.max).toBeGreaterThan(0);
    expect(IP_RATE_LIMIT.windowMs).toBeGreaterThan(0);
  });

  it("exposes a sanitized error with a retry hint", () => {
    const error = new RateLimitError(42);

    expect(error.name).toBe("RateLimitError");
    expect(error.code).toBe("RATE_LIMIT_EXCEEDED");
    expect(error.retryAfterSeconds).toBe(42);
    expect(error.message).not.toContain("42");
  });
});
