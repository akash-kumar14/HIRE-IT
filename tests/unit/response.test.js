import { describe, expect, it } from "vitest";
import { errorResponse, successResponse } from "@/lib/api/response";

describe("API response envelope", () => {
  it("returns a success envelope with request metadata", async () => {
    const response = successResponse(
      { ok: true },
      { status: 201, requestId: "req-123", meta: { page: 1 } },
    );

    expect(response.status).toBe(201);
    expect(response.headers.get("x-request-id")).toBe("req-123");
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { ok: true },
      meta: { page: 1, requestId: "req-123" },
    });
  });

  it("returns an error envelope with request metadata", async () => {
    const response = errorResponse("INVALID_INPUT", "Bad input", {
      status: 422,
      requestId: "req-456",
    });

    expect(response.status).toBe(422);
    expect(response.headers.get("x-request-id")).toBe("req-456");
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: { code: "INVALID_INPUT", message: "Bad input" },
      meta: { requestId: "req-456" },
    });
  });
});
