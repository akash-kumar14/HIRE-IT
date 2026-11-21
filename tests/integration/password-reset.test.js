import "dotenv/config";
import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { NextRequest } from "next/server";
import { afterAll, describe, expect, it } from "vitest";
import { POST as confirmReset } from "@/app/api/v1/auth/password-reset/confirm/route.js";
import { POST as requestReset } from "@/app/api/v1/auth/password-reset/route.js";
import { GET as me } from "@/app/api/v1/auth/me/route.js";
import { POST as login } from "@/app/api/v1/auth/login/route.js";
import { POST as register } from "@/app/api/v1/auth/register/route.js";
import { getDb } from "@/lib/db/client.js";
import { users, verificationTokens } from "@/lib/db/schema/users.js";
import { SESSION_COOKIE_NAME } from "@/modules/auth/session-cookie.js";
import { requestPasswordReset } from "@/modules/auth/password-reset.service.js";

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
    method: "GET",
    headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` },
  });
}

async function registerUser(label) {
  const response = await register(
    jsonRequest("http://localhost/api/v1/auth/register", {
      email: `m24-${label}-${randomUUID()}@example.com`,
      password: "Password123!",
      fullName: "M2.4 Test User",
    }),
  );
  const body = await response.json();

  createdUserIds.push(body.data.id);
  return { body, sessionToken: response.cookies.get(SESSION_COOKIE_NAME)?.value };
}

async function captureToken(email, options = {}) {
  let captured = null;
  await requestPasswordReset(
    { email },
    {
      ...options,
      emailSender: async ({ token }) => {
        captured = token;
      },
    },
  );

  return captured;
}

describe.skipIf(!databaseUrl)("password reset", () => {
  afterAll(async () => {
    if (createdUserIds.length > 0) {
      await getDb().delete(users).where(inArray(users.id, createdUserIds));
    }
  });

  it("returns a generic response and stores only a hashed token", async () => {
    const { body } = await registerUser("request");
    const known = await requestReset(
      jsonRequest("http://localhost/api/v1/auth/password-reset", {
        email: body.data.email,
      }),
    );

    expect(known.status).toBe(202);
    expect((await known.json()).data).toEqual({ accepted: true });

    const [stored] = await getDb()
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.userId, body.data.id),
          eq(verificationTokens.type, "password_reset"),
        ),
      )
      .limit(1);

    expect(stored?.tokenHash).toMatch(/^[0-9a-f]{64}$/);

    const unknown = await requestReset(
      jsonRequest("http://localhost/api/v1/auth/password-reset", {
        email: `missing-${randomUUID()}@example.com`,
      }),
    );

    expect(unknown.status).toBe(202);
    expect((await unknown.json()).data).toEqual({ accepted: true });
  });

  it("resets the password, revokes sessions, and rejects token reuse", async () => {
    const { body, sessionToken } = await registerUser("confirm");
    const resetToken = await captureToken(body.data.email);
    expect(resetToken).toBeTruthy();

    const confirm = await confirmReset(
      jsonRequest("http://localhost/api/v1/auth/password-reset/confirm", {
        token: resetToken,
        password: "NewPassword123!",
      }),
    );

    expect(confirm.status).toBe(200);
    expect((await confirm.json()).data).toEqual({ updated: true });

    const staleSession = await me(
      withCookie("http://localhost/api/v1/auth/me", sessionToken),
    );
    expect(staleSession.status).toBe(401);

    const oldLogin = await login(
      jsonRequest("http://localhost/api/v1/auth/login", {
        email: body.data.email,
        password: "Password123!",
      }),
    );
    expect(oldLogin.status).toBe(401);

    const newLogin = await login(
      jsonRequest("http://localhost/api/v1/auth/login", {
        email: body.data.email,
        password: "NewPassword123!",
      }),
    );
    expect(newLogin.status).toBe(200);

    const [stored] = await getDb()
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.userId, body.data.id),
          eq(verificationTokens.type, "password_reset"),
        ),
      )
      .limit(1);
    expect(stored?.consumedAt).toBeTruthy();

    const reused = await confirmReset(
      jsonRequest("http://localhost/api/v1/auth/password-reset/confirm", {
        token: resetToken,
        password: "AnotherPassword123!",
      }),
    );
    expect(reused.status).toBe(400);
    expect((await reused.json()).error.code).toBe("INVALID_PASSWORD_RESET_TOKEN");
  });

  it("rejects expired and malformed tokens and invalid payloads", async () => {
    const { body } = await registerUser("expired");
    const expiredToken = await captureToken(body.data.email, { ttlMs: -1000 });

    const expired = await confirmReset(
      jsonRequest("http://localhost/api/v1/auth/password-reset/confirm", {
        token: expiredToken,
        password: "NewPassword123!",
      }),
    );
    expect(expired.status).toBe(400);
    expect((await expired.json()).error.code).toBe("INVALID_PASSWORD_RESET_TOKEN");

    const malformed = await confirmReset(
      jsonRequest("http://localhost/api/v1/auth/password-reset/confirm", {
        token: "not-a-token",
        password: "NewPassword123!",
      }),
    );
    expect(malformed.status).toBe(400);

    const weak = await confirmReset(
      jsonRequest("http://localhost/api/v1/auth/password-reset/confirm", {
        token: expiredToken,
        password: "short",
      }),
    );
    expect(weak.status).toBe(422);
    expect((await weak.json()).error.code).toBe("VALIDATION_ERROR");
  });

  it("does not issue tokens for suspended users while staying generic", async () => {
    const { body } = await registerUser("suspended");
    await getDb()
      .update(users)
      .set({ status: "suspended" })
      .where(eq(users.id, body.data.id));

    const response = await requestReset(
      jsonRequest("http://localhost/api/v1/auth/password-reset", {
        email: body.data.email,
      }),
    );

    expect(response.status).toBe(202);
    expect((await response.json()).data).toEqual({ accepted: true });

    const stored = await getDb()
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.userId, body.data.id),
          eq(verificationTokens.type, "password_reset"),
        ),
      )
      .limit(1);
    expect(stored).toEqual([]);
  });
});
