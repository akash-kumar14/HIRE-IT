import { describe, expect, it } from "vitest";
import {
  generateVerificationToken,
  hashVerificationToken,
} from "@/modules/auth/verification-token.js";

describe("verification tokens", () => {
  it("generates unique opaque URL-safe tokens", () => {
    const first = generateVerificationToken();
    const second = generateVerificationToken();

    expect(first).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(first).not.toBe(second);
  });

  it("hashes tokens deterministically without exposing them", () => {
    const token = generateVerificationToken();
    const hash = hashVerificationToken(token);

    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toBe(token);
    expect(hashVerificationToken(token)).toBe(hash);
  });

  it("rejects an empty token", () => {
    expect(() => hashVerificationToken("")).toThrow(
      "Verification token is required",
    );
    expect(() => hashVerificationToken(null)).toThrow(
      "Verification token is required",
    );
  });
});
