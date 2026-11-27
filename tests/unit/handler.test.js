import { describe, expect, it } from "vitest";
import { handleRequest } from "@/lib/api/handler.js";
import { ValidationError } from "@/modules/auth/auth.validation.js";

function testRequest() {
  return new Request("http://localhost/api/v1/test", {
    headers: { "x-request-id": "request-123" },
  });
}

describe("handleRequest", () => {
  it("maps validation failures to a 422 envelope", async () => {
    const response = await handleRequest(testRequest(), async () => {
      throw new ValidationError("Bad input.");
    });

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Bad input." },
      meta: { requestId: "request-123" },
    });
  });

  it("maps duplicate email to the public 409 code", async () => {
    const response = await handleRequest(testRequest(), async () => {
      const error = new Error("Email is already registered");
      error.code = "DUPLICATE_EMAIL";
      throw error;
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "EMAIL_ALREADY_EXISTS",
        message: "An account with that email already exists.",
      },
    });
  });

  it("passes through typed authorization errors", async () => {
    const response = await handleRequest(testRequest(), async () => {
      throw Object.assign(new Error("MFA is required."), {
        code: "MFA_REQUIRED",
        status: 403,
      });
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "MFA_REQUIRED", message: "MFA is required." },
      meta: { requestId: "request-123" },
    });
  });

  it("maps database connectivity failures to a sanitized 503 envelope", async () => {
    const response = await handleRequest(testRequest(), async () => {
      const timeout = Object.assign(new Error("connect ETIMEDOUT secret-host"), {
        code: "ETIMEDOUT",
      });
      const aggregate = Object.assign(new Error("database password is secret"), {
        errors: [timeout],
      });
      const socketEvent = { type: "error", error: aggregate };
      const queryError = Object.assign(new Error("Failed query"), {
        cause: socketEvent,
      });

      throw queryError;
    });

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "Service temporarily unavailable.",
      },
      meta: { requestId: "request-123" },
    });
  });

  it("sanitizes unexpected errors", async () => {
    const response = await handleRequest(testRequest(), async () => {
      throw new Error("database password is secret");
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "INTERNAL_ERROR", message: "Unexpected error." },
      meta: { requestId: "request-123" },
    });
  });
});
