import { describe, expect, it } from "vitest";
import {
  readJsonBody,
  validateLogin,
  validateMfaCode,
  validateMfaRecoveryCode,
  validatePasswordResetConfirm,
  validatePasswordResetRequest,
  validateRegistration,
  validateVerificationConfirm,
  ValidationError,
} from "@/modules/auth/auth.validation.js";

describe("validateRegistration", () => {
  it("normalizes email and trims fields", () => {
    expect(
      validateRegistration({
        email: "  Person@Example.COM ",
        password: "Password123!",
        fullName: "  Person Name  ",
        phone: "  9990000000  ",
      }),
    ).toEqual({
      email: "person@example.com",
      password: "Password123!",
      fullName: "Person Name",
      phone: "9990000000",
    });
  });

  it("rejects invalid email, password, name, and phone", () => {
    expect(() =>
      validateRegistration({
        email: "not-an-email",
        password: "Password123!",
        fullName: "Person",
      }),
    ).toThrow(ValidationError);
    expect(() =>
      validateRegistration({
        email: "person@example.com",
        password: "short",
        fullName: "Person",
      }),
    ).toThrow("Password must be between 8 and 128 characters.");
    expect(() =>
      validateRegistration({
        email: "person@example.com",
        password: "Password123!",
        fullName: "  ",
      }),
    ).toThrow("Full name must be between 1 and 120 characters.");
    expect(() =>
      validateRegistration({
        email: "person@example.com",
        password: "Password123!",
        fullName: "Person",
        phone: "x".repeat(33),
      }),
    ).toThrow("Phone number must be at most 32 characters.");
  });
});

describe("validateLogin", () => {
  it("returns normalized credentials", () => {
    expect(
      validateLogin({ email: " Person@Example.COM ", password: "Password123!" }),
    ).toEqual({ email: "person@example.com", password: "Password123!" });
  });

  it("rejects a non-object body", () => {
    expect(() => validateLogin([])).toThrow(
      "Request body must be a JSON object.",
    );
  });
});

describe("validateVerificationConfirm", () => {
  it("returns a trimmed token", () => {
    expect(
      validateVerificationConfirm({ token: "  verification-token  " }),
    ).toEqual({ token: "verification-token" });
  });

  it("rejects a missing token", () => {
    expect(() => validateVerificationConfirm({})).toThrow(
      "Verification token is required.",
    );
    expect(() => validateVerificationConfirm({ token: "   " })).toThrow(
      "Verification token is required.",
    );
  });
});

describe("validatePasswordResetRequest", () => {
  it("returns a normalized email", () => {
    expect(
      validatePasswordResetRequest({ email: "  Person@Example.COM " }),
    ).toEqual({ email: "person@example.com" });
  });

  it("rejects invalid emails and non-object bodies", () => {
    expect(() => validatePasswordResetRequest({ email: "not-an-email" })).toThrow(
      ValidationError,
    );
    expect(() => validatePasswordResetRequest([])).toThrow(
      "Request body must be a JSON object.",
    );
  });
});

describe("validatePasswordResetConfirm", () => {
  it("returns a trimmed token and the password", () => {
    expect(
      validatePasswordResetConfirm({
        token: "  reset-token  ",
        password: "NewPassword123!",
      }),
    ).toEqual({ token: "reset-token", password: "NewPassword123!" });
  });

  it("rejects missing tokens and weak passwords", () => {
    expect(() => validatePasswordResetConfirm({ password: "NewPassword123!" })).toThrow(
      "Reset token is required.",
    );
    expect(() =>
      validatePasswordResetConfirm({ token: "reset-token", password: "short" }),
    ).toThrow("Password must be between 8 and 128 characters.");
  });
});

describe("MFA validation", () => {
  it("accepts a 6-digit code and trims it", () => {
    expect(validateMfaCode({ code: " 123456 " })).toEqual({ code: "123456" });
  });

  it("rejects malformed codes and recovery codes", () => {
    expect(() => validateMfaCode({ code: "12ab56" })).toThrow(ValidationError);
    expect(() => validateMfaCode({ code: "12345" })).toThrow(ValidationError);
    expect(() => validateMfaCode({ code: 123456 })).toThrow(ValidationError);
    expect(() => validateMfaRecoveryCode({ code: "abc" })).toThrow(
      ValidationError,
    );
    expect(() => validateMfaRecoveryCode({ code: "AAAAAAAAAAAA!" })).toThrow(
      ValidationError,
    );
  });
});

describe("readJsonBody", () => {
  it("parses a JSON body", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "person@example.com" }),
    });

    await expect(readJsonBody(request)).resolves.toEqual({
      email: "person@example.com",
    });
  });

  it("throws a validation error for malformed JSON", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    });

    await expect(readJsonBody(request)).rejects.toThrow(
      "Request body must be valid JSON.",
    );
  });
});
