import "dotenv/config";
import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { NextRequest } from "next/server";
import { afterAll, describe, expect, it, vi } from "vitest";
import { POST as requestReset } from "@/app/api/v1/auth/password-reset/route.js";
import { consumeRateLimit } from "@/lib/api/rate-limit.js";
import { getDb } from "@/lib/db/client.js";
import { rateLimitCounters } from "@/lib/db/schema/rate-limits.js";

const databaseUrl = process.env.DATABASE_URL;
const cleanupSubjects = [];

function jsonRequest(url, body, ip) {
  return new NextRequest(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

describe.skipIf(!databaseUrl)("shared rate limiting", () => {
  afterAll(async () => {
    if (cleanupSubjects.length > 0) {
      await getDb()
        .delete(rateLimitCounters)
        .where(inArray(rateLimitCounters.subject, cleanupSubjects));
    }
  });

  it("increments one fixed-window counter and resets in the next window", async () => {
    const scope = `test:${randomUUID()}`;
    const subject = randomUUID();
    cleanupSubjects.push(subject);
    const now = new Date("2026-11-21T12:00:15.000Z");
    const options = { scope, subject, max: 2, windowMs: 60_000, now };

    expect((await consumeRateLimit(options)).allowed).toBe(true);
    const second = await consumeRateLimit(options);
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(0);

    const blocked = await consumeRateLimit(options);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);

    const rows = await getDb()
      .select()
      .from(rateLimitCounters)
      .where(eq(rateLimitCounters.scope, scope));
    expect(rows).toHaveLength(1);
    expect(rows[0].count).toBe(3);

    const nextWindow = await consumeRateLimit({
      ...options,
      now: new Date(now.getTime() + 60_000),
    });
    expect(nextWindow.allowed).toBe(true);
  });

  it("returns a sanitized 429 with Retry-After after the route limit is exceeded", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-21T12:00:00.000Z"));

    try {
      const email = `m25-${randomUUID()}@example.com`;
      const ip = randomUUID();
      cleanupSubjects.push(email, ip);
      const url = "http://localhost/api/v1/auth/password-reset";

      for (let attempt = 0; attempt < 10; attempt += 1) {
        const response = await requestReset(jsonRequest(url, { email }, ip));
        expect(response.status).toBe(202);
      }

      const blocked = await requestReset(jsonRequest(url, { email }, ip));
      expect(blocked.status).toBe(429);
      const body = await blocked.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("RATE_LIMIT_EXCEEDED");
      expect(body.meta.requestId).toBeTruthy();
      expect(body.meta.retryAfterSeconds).toBeGreaterThan(0);
      expect(blocked.headers.get("retry-after")).toBeTruthy();

      const rows = await getDb()
        .select()
        .from(rateLimitCounters)
        .where(inArray(rateLimitCounters.subject, [email, ip]));
      expect(rows.find((row) => row.subject === email)?.count).toBe(11);
      expect(rows.find((row) => row.subject === ip)).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not consume quota for invalid payloads", async () => {
    const email = `bad@@${randomUUID()}`;
    const ip = randomUUID();

    const response = await requestReset(
      jsonRequest("http://localhost/api/v1/auth/password-reset", { email }, ip),
    );
    expect(response.status).toBe(422);
    expect((await response.json()).error.code).toBe("VALIDATION_ERROR");

    const rows = await getDb()
      .select()
      .from(rateLimitCounters)
      .where(eq(rateLimitCounters.subject, email));
    expect(rows).toEqual([]);
  });
});
