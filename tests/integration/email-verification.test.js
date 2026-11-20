import "dotenv/config";
import { randomUUID } from "node:crypto";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { NextRequest } from "next/server";
import { afterAll, describe, expect, it } from "vitest";
import { POST as confirmVerification } from "@/app/api/v1/auth/email-verification/confirm/route.js";
import { POST as requestVerification } from "@/app/api/v1/auth/email-verification/route.js";
import { POST as register } from "@/app/api/v1/auth/register/route.js";
import { getDb } from "@/lib/db/client.js";
import { users, verificationTokens } from "@/lib/db/schema/users.js";
import { SESSION_COOKIE_NAME } from "@/modules/auth/session-cookie.js";
import { requestEmailVerification } from "@/modules/auth/verification.service.js";

const databaseUrl = process.env.DATABASE_URL;
const createdUserIds = [];

function jsonRequest(url, body) {
  return new NextRequest(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function withCookie(url, token) {
  return new NextRequest(url, {
    method: "POST",
    headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` },
  });
}

async function registerUser(label) {
  const response = await register(
    jsonRequest("http://localhost/api/v1/auth/register", {
      email: `m23-${label}-${randomUUID()}@example.com`,
      password: "Password123!",
      fullName: "M2.3 Test User",
    }),
  );
  const body = await response.json();

  createdUserIds.push(body.data.id);
  return { body, sessionToken: response.cookies.get(SESSION_COOKIE_NAME)?.value };
}

async function captureToken(userId, options = {}) {
  let captured = null;
  await requestEmailVerification(userId, {
    ...options,
    emailSender: async ({ token }) => {
      captured = token;
    },
  });

  return captured;
}

describe.skipIf(!databaseUrl)("email verification", () => {
  afterAll(async () => {
    if (createdUserIds.length > 0) {
      await getDb().delete(users).where(inArray(users.id, createdUserIds));
    }
  });

  it("creates a hashed token and confirms it once", async () => {
    const { body, sessionToken } = await registerUser("confirm");
    const requestResponse = await requestVerification(
      withCookie("http://localhost/api/v1/auth/email-verification", sessionToken),
    );

    expect(requestResponse.status).toBe(202);
    expect((await requestResponse.json()).data).toEqual({ accepted: true });

    const [stored] = await getDb()
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.userId, body.data.id),
          eq(verificationTokens.type, "email_verification"),
          isNull(verificationTokens.consumedAt),
        ),
      )
      .limit(1);

    expect(stored?.tokenHash).toMatch(/^[0-9a-f]{64}$/);

    const token = await captureToken(body.data.id);
    expect(token).toBeTruthy();

    const confirmResponse = await confirmVerification(
      jsonRequest("http://localhost/api/v1/auth/email-verification/confirm", {
        token,
      }),
    );

    expect(confirmResponse.status).toBe(200);
    expect((await confirmResponse.json()).data.emailVerifiedAt).toBeTruthy();

    const reused = await confirmVerification(
      jsonRequest("http://localhost/api/v1/auth/email-verification/confirm", {
        token,
      }),
    );
    expect(reused.status).toBe(400);
    expect((await reused.json()).error.code).toBe("INVALID_VERIFICATION_TOKEN");

    const secondRequest = await requestVerification(
      withCookie("http://localhost/api/v1/auth/email-verification", sessionToken),
    );
    expect(secondRequest.status).toBe(202);
  });

  it("rejects expired and malformed tokens", async () => {
    const { body } = await registerUser("expired");
    const token = await captureToken(body.data.id, { ttlMs: -1_000 });

    const expired = await confirmVerification(
      jsonRequest("http://localhost/api/v1/auth/email-verification/confirm", {
        token,
      }),
    );
    expect(expired.status).toBe(400);
    expect((await expired.json()).error.code).toBe("INVALID_VERIFICATION_TOKEN");

    const malformed = await confirmVerification(
      jsonRequest("http://localhost/api/v1/auth/email-verification/confirm", {
        token: "not-a-token",
      }),
    );
    expect(malformed.status).toBe(400);
  });

  it("requires authentication to request verification", async () => {
    const response = await requestVerification(
      new NextRequest("http://localhost/api/v1/auth/email-verification", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe("AUTHENTICATION_REQUIRED");
  });
});
