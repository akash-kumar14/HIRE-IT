import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client.js";
import { rateLimitCounters } from "@/lib/db/schema/rate-limits.js";

export const AUTH_RATE_LIMITS = {
  register: { max: 10, windowMs: 15 * 60 * 1000 },
  login: { max: 10, windowMs: 10 * 60 * 1000 },
  password_reset: { max: 10, windowMs: 15 * 60 * 1000 },
  password_reset_confirm: { max: 10, windowMs: 10 * 60 * 1000 },
  email_verification: { max: 10, windowMs: 15 * 60 * 1000 },
  email_verification_confirm: { max: 10, windowMs: 10 * 60 * 1000 },
  mfa_enroll: { max: 10, windowMs: 10 * 60 * 1000 },
  mfa_confirm: { max: 10, windowMs: 10 * 60 * 1000 },
  mfa_verify: { max: 10, windowMs: 10 * 60 * 1000 },
  mfa_recovery: { max: 10, windowMs: 10 * 60 * 1000 },
};

export const IP_RATE_LIMIT = { max: 100, windowMs: 10 * 60 * 1000 };

export class RateLimitError extends Error {
  constructor(retryAfterSeconds) {
    super("Too many requests. Try again later.");
    this.name = "RateLimitError";
    this.code = "RATE_LIMIT_EXCEEDED";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function normalizeSubject(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("Rate limit subject is required");
  }

  return value.trim().toLowerCase().slice(0, 256);
}

export function getWindowStart(now, windowMs) {
  return new Date(Math.floor(now.getTime() / windowMs) * windowMs);
}

export function evaluateRateLimit({ count, max, windowStart, windowMs, now }) {
  return {
    allowed: count <= max,
    remaining: Math.max(0, max - count),
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((windowStart.getTime() + windowMs - now.getTime()) / 1000),
    ),
  };
}

export function getClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const forwardedIp = forwarded?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();

  return (forwardedIp || realIp || "unknown").slice(0, 64);
}

export async function consumeRateLimit({
  scope,
  subject,
  max,
  windowMs,
  database = getDb(),
  now = new Date(),
}) {
  const windowStart = getWindowStart(now, windowMs);
  const [row] = await database
    .insert(rateLimitCounters)
    .values({
      scope: normalizeSubject(scope),
      subject: normalizeSubject(subject),
      windowStart,
      count: 1,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        rateLimitCounters.scope,
        rateLimitCounters.subject,
        rateLimitCounters.windowStart,
      ],
      set: { count: sql`${rateLimitCounters.count} + 1`, updatedAt: now },
    })
    .returning({ count: rateLimitCounters.count });

  return evaluateRateLimit({
    count: row?.count ?? 1,
    max,
    windowStart,
    windowMs,
    now,
  });
}

export async function enforceAuthRateLimit({
  scope,
  subject,
  ip,
  database = getDb(),
  now = new Date(),
}) {
  const config = AUTH_RATE_LIMITS[scope];

  if (!config) {
    throw new Error(`Unknown rate limit scope: ${scope}`);
  }

  if (subject) {
    const result = await consumeRateLimit({
      scope: `${scope}:subject`,
      subject,
      max: config.max,
      windowMs: config.windowMs,
      database,
      now,
    });

    if (!result.allowed) {
      throw new RateLimitError(result.retryAfterSeconds);
    }
  }

  const result = await consumeRateLimit({
    scope: `${scope}:ip`,
    subject: ip ?? "unknown",
    max: IP_RATE_LIMIT.max,
    windowMs: IP_RATE_LIMIT.windowMs,
    database,
    now,
  });

  if (!result.allowed) {
    throw new RateLimitError(result.retryAfterSeconds);
  }

  return result;
}
