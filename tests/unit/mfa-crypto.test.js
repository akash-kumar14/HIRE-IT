import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  decryptTotpSecret,
  encryptTotpSecret,
  generateRecoveryCodes,
  hashRecoveryCode,
  normalizeRecoveryCode,
} from "@/modules/auth/mfa-crypto.js";

const originalSecret = process.env.SESSION_SECRET;

beforeAll(() => {
  process.env.SESSION_SECRET = "test-session-secret-that-is-long-enough";
});

afterAll(() => {
  if (originalSecret === undefined) {
    delete process.env.SESSION_SECRET;
  } else {
    process.env.SESSION_SECRET = originalSecret;
  }
});

describe("TOTP secret encryption", () => {
  it("round-trips a secret without storing it in plaintext", () => {
    const secret = "JBSWY3DPEHPK3PXP";
    const encrypted = encryptTotpSecret(secret);

    expect(encrypted).not.toContain(secret);
    expect(encrypted.startsWith("v1.")).toBe(true);
    expect(decryptTotpSecret(encrypted)).toBe(secret);
  });

  it("rejects tampered payloads and malformed values", () => {
    const encrypted = encryptTotpSecret("JBSWY3DPEHPK3PXP");
    const parts = encrypted.split(".");
    parts[3] = `${parts[3]}AA`;

    expect(() => decryptTotpSecret(parts.join("."))).toThrow();
    expect(() => decryptTotpSecret("not-a-payload")).toThrow();
  });
});

describe("recovery codes", () => {
  it("normalizes and hashes codes consistently", () => {
    expect(normalizeRecoveryCode(" ab-cd ef ")).toBe("ABCDEF");
    expect(hashRecoveryCode("ab-cd ef")).toBe(hashRecoveryCode("ABCDEF"));
  });

  it("generates unique formatted codes", () => {
    const codes = generateRecoveryCodes(4);

    expect(codes).toHaveLength(4);
    expect(new Set(codes).size).toBe(4);
    expect(codes[0]).toMatch(/^[0-9A-F]{6}-[0-9A-F]{6}-[0-9A-F]{6}$/);
  });
});
