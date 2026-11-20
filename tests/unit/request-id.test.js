import { describe, expect, it } from "vitest";
import { createRequestId } from "@/lib/api/request-id";

const requestWith = (value) => ({
  headers: {
    get: (name) => (name === "x-request-id" ? value : null),
  },
});

describe("createRequestId", () => {
  it("reuses a valid incoming request ID", () => {
    expect(createRequestId(requestWith("client-request-123"))).toBe(
      "client-request-123",
    );
  });

  it("replaces an invalid incoming request ID", () => {
    const requestId = createRequestId(requestWith("bad id!"));

    expect(requestId).not.toBe("bad id!");
    expect(requestId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("generates an ID when none is provided", () => {
    const requestId = createRequestId(requestWith(null));

    expect(requestId).toMatch(/^[0-9a-f-]{36}$/);
  });
});
