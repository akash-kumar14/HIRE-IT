import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_AUTH_REDIRECT,
  getApiErrorMessage,
  postJson,
  readSearchParam,
  resolveNextPath,
} from "@/lib/ui/auth-forms.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("resolveNextPath", () => {
  it("keeps a safe relative path", () => {
    expect(resolveNextPath("  /dashboard?tab=tasks  ")).toBe(
      "/dashboard?tab=tasks",
    );
  });

  it("rejects external and malformed targets", () => {
    expect(resolveNextPath("//evil.example")).toBe(DEFAULT_AUTH_REDIRECT);
    expect(resolveNextPath("https://evil.example")).toBe(DEFAULT_AUTH_REDIRECT);
    expect(resolveNextPath("/\\evil.example")).toBe(DEFAULT_AUTH_REDIRECT);
    expect(resolveNextPath(undefined)).toBe(DEFAULT_AUTH_REDIRECT);
    expect(resolveNextPath("/me", "/login")).toBe("/me");
  });
});

describe("getApiErrorMessage", () => {
  it("uses the sanitized API error message", () => {
    const payload = { error: { code: "INVALID_CREDENTIALS", message: "Nope." } };

    expect(getApiErrorMessage(payload, "Fallback")).toBe("Nope.");
    expect(getApiErrorMessage(null, "Fallback")).toBe("Fallback");
  });
});

describe("readSearchParam", () => {
  it("reads a string token", () => {
    expect(readSearchParam("token-123")).toBe("token-123");
  });

  it("reads the first value from repeated params", () => {
    expect(readSearchParam(["first", "second"])).toBe("first");
  });

  it("returns an empty string for missing or malformed params", () => {
    expect(readSearchParam(undefined)).toBe("");
    expect(readSearchParam([])).toBe("");
    expect(readSearchParam(42)).toBe("");
  });
});

describe("postJson", () => {
  it("posts JSON and returns the success payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { id: "user-1" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      postJson("/api/v1/auth/login", { email: "person@example.com" }),
    ).resolves.toEqual({ success: true, data: { id: "user-1" } });
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "person@example.com" }),
    });
  });

  it("throws the API error message for failed requests", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: { message: "Invalid email or password." } }),
      }),
    );

    await expect(postJson("/api/v1/auth/login", {})).rejects.toThrow(
      "Invalid email or password.",
    );
  });
});
