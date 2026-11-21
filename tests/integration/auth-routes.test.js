import "dotenv/config";
import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { NextRequest } from "next/server";
import { afterAll, describe, expect, it } from "vitest";
import { GET as me } from "@/app/api/v1/auth/me/route.js";
import { POST as login } from "@/app/api/v1/auth/login/route.js";
import { POST as logout } from "@/app/api/v1/auth/logout/route.js";
import { POST as register } from "@/app/api/v1/auth/register/route.js";
import { getDb } from "@/lib/db/client.js";
import { users } from "@/lib/db/schema/users.js";
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
      email: `m22-${label}-${randomUUID()}@example.com`,
      password: "Password123!",
      fullName: "M2.2 Test User",
    }),
  );
  const body = await response.json();

  createdUserIds.push(body.data.id);
  return { response, body, token: response.cookies.get(SESSION_COOKIE_NAME)?.value };
}

describe.skipIf(!databaseUrl)("auth routes", () => {
  afterAll(async () => {
    if (createdUserIds.length > 0) {
      await getDb().delete(users).where(inArray(users.id, createdUserIds));
    }
  });

  it("registers, authenticates with the cookie, and logs out", async () => {
    const { response, body, token } = await registerUser("register");

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.passwordHash).toBeUndefined();
    expect(token).toBeTruthy();

    const meResponse = await me(
      withCookie("http://localhost/api/v1/auth/me", token),
    );
    expect(meResponse.status).toBe(200);
    expect((await meResponse.json()).data.id).toBe(body.data.id);

    const logoutResponse = await logout(
      withCookie("http://localhost/api/v1/auth/logout", token, "POST"),
    );
    expect(logoutResponse.status).toBe(200);
    expect(logoutResponse.cookies.get(SESSION_COOKIE_NAME)?.maxAge).toBe(0);

    const meAfterLogout = await me(
      withCookie("http://localhost/api/v1/auth/me", token),
    );
    expect(meAfterLogout.status).toBe(401);
  });

  it("logs in with valid credentials and rejects invalid ones", async () => {
    const { body } = await registerUser("login");
    const valid = await login(
      jsonRequest("http://localhost/api/v1/auth/login", {
        email: body.data.email,
        password: "Password123!",
      }),
    );

    expect(valid.status).toBe(200);
    expect(valid.cookies.get(SESSION_COOKIE_NAME)?.value).toBeTruthy();

    const invalid = await login(
      jsonRequest("http://localhost/api/v1/auth/login", {
        email: body.data.email,
        password: "WrongPassword123!",
      }),
    );

    expect(invalid.status).toBe(401);
    expect((await invalid.json()).error.code).toBe("INVALID_CREDENTIALS");
  });

  it("rejects duplicate registration and invalid payloads", async () => {
    const { body } = await registerUser("duplicate");
    const duplicate = await register(
      jsonRequest("http://localhost/api/v1/auth/register", {
        email: body.data.email.toUpperCase(),
        password: "Password123!",
        fullName: "Duplicate User",
      }),
    );

    expect(duplicate.status).toBe(409);
    expect((await duplicate.json()).error.code).toBe("EMAIL_ALREADY_EXISTS");

    const invalid = await register(
      jsonRequest("http://localhost/api/v1/auth/register", {
        email: "not-an-email",
        password: "short",
        fullName: "",
      }),
    );

    expect(invalid.status).toBe(422);
    expect((await invalid.json()).error.code).toBe("VALIDATION_ERROR");
  });

  it("blocks suspended users", async () => {
    const { body, token } = await registerUser("suspended");
    await getDb()
      .update(users)
      .set({ status: "suspended" })
      .where(eq(users.id, body.data.id));

    const loginResponse = await login(
      jsonRequest("http://localhost/api/v1/auth/login", {
        email: body.data.email,
        password: "Password123!",
      }),
    );
    expect(loginResponse.status).toBe(401);

    const meResponse = await me(
      withCookie("http://localhost/api/v1/auth/me", token),
    );
    expect(meResponse.status).toBe(403);
    expect((await meResponse.json()).error.code).toBe("ACCOUNT_SUSPENDED");
  });

  it("requires authentication for logout", async () => {
    const response = await logout(
      new NextRequest("http://localhost/api/v1/auth/logout", { method: "POST" }),
    );

    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe("AUTHENTICATION_REQUIRED");
  });
});
