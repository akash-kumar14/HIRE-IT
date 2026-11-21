import "dotenv/config";
import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { NextRequest } from "next/server";
import { afterAll, describe, expect, it } from "vitest";
import { POST as requestVerification } from "@/app/api/v1/auth/email-verification/route.js";
import { GET as me } from "@/app/api/v1/auth/me/route.js";
import { POST as register } from "@/app/api/v1/auth/register/route.js";
import { getDb } from "@/lib/db/client.js";
import { users, verificationTokens } from "@/lib/db/schema/users.js";
import { SESSION_COOKIE_NAME } from "@/modules/auth/session-cookie.js";

const databaseUrl = process.env.DATABASE_URL;
const createdUserIds = [];

function jsonRequest(url, body) {
  return new NextRequest(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function withCookie(url, token, method = "GET") {
  return new NextRequest(url, {
    method,
    headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` },
  });
}

async function registerUser(label) {
  const response = await register(
    jsonRequest("http://localhost/api/v1/auth/register", {
      email: `m26-${label}-${randomUUID()}@example.com`,
      password: "Password123!",
      fullName: "M2.6 Test User",
    }),
  );
  const body = await response.json();

  createdUserIds.push(body.data.id);
  return { body, token: response.cookies.get(SESSION_COOKIE_NAME)?.value };
}

async function setStatus(userId, status) {
  await getDb()
    .update(users)
    .set({
      status,
      deletedAt: status === "deleted" ? new Date() : null,
    })
    .where(eq(users.id, userId));
}

describe.skipIf(!databaseUrl)("authorization guard", () => {
  afterAll(async () => {
    if (createdUserIds.length > 0) {
      await getDb().delete(users).where(inArray(users.id, createdUserIds));
    }
  });

  it("returns the current user for an active session", async () => {
    const { body, token } = await registerUser("active");
    const response = await me(withCookie("http://localhost/api/v1/auth/me", token));

    expect(response.status).toBe(200);
    expect((await response.json()).data.id).toBe(body.data.id);
  });

  it("requires a session", async () => {
    const response = await me(
      new NextRequest("http://localhost/api/v1/auth/me", { method: "GET" }),
    );

    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe("AUTHENTICATION_REQUIRED");
  });

  it("blocks suspended users and recovers when reactivated", async () => {
    const { body, token } = await registerUser("suspended");
    const request = () =>
      me(withCookie("http://localhost/api/v1/auth/me", token));

    await setStatus(body.data.id, "suspended");
    const blocked = await request();
    expect(blocked.status).toBe(403);
    expect((await blocked.json()).error.code).toBe("ACCOUNT_SUSPENDED");

    await setStatus(body.data.id, "active");
    const restored = await request();
    expect(restored.status).toBe(200);
    expect((await restored.json()).data.id).toBe(body.data.id);
  });

  it("blocks deleted users", async () => {
    const { body, token } = await registerUser("deleted");
    await setStatus(body.data.id, "deleted");

    const response = await me(
      withCookie("http://localhost/api/v1/auth/me", token),
    );
    expect(response.status).toBe(403);
    expect((await response.json()).error.code).toBe("ACCOUNT_UNAVAILABLE");
  });

  it("blocks suspended users from verification requests without issuing tokens", async () => {
    const { body, token } = await registerUser("verification");
    await setStatus(body.data.id, "suspended");

    const response = await requestVerification(
      withCookie(
        "http://localhost/api/v1/auth/email-verification",
        token,
        "POST",
      ),
    );
    expect(response.status).toBe(403);
    expect((await response.json()).error.code).toBe("ACCOUNT_SUSPENDED");

    const tokens = await getDb()
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.userId, body.data.id),
          eq(verificationTokens.type, "email_verification"),
        ),
      )
      .limit(1);
    expect(tokens).toEqual([]);
  });
});
