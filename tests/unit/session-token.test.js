import { describe, expect, it } from "vitest";
import {
  generateSessionToken,
  hashSessionToken,
} from "@/modules/auth/session-token.js";

describe("session tokens", () => {
  it("generates unique opaque URL-safe tokens", () => {
    const first = generateSessionToken();
    const second = generateSessionToken();

    expect(first).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(first).not.toBe(second);
  });

  it("hashes tokens deterministically without exposing them", () => {
    const token = generateSessionToken();
    const hash = hashSessionToken(token);

    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toBe(token);
    expect(hashSessionToken(token)).toBe(hash);
    expect(hashSessionToken(generateSessionToken())).not.toBe(hash);
  });

  it("rejects an empty token", () => {
    expect(() => hashSessionToken("")).toThrow("Session token is required");
    expect(() => hashSessionToken(null)).toThrow("Session token is required");
  });
});
