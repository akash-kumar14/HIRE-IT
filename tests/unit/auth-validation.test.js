import { describe, expect, it } from "vitest";
import {
  readJsonBody,
  validateLogin,
  validateRegistration,
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
