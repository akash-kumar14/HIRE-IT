import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { successResponse } from "@/lib/api/response.js";
import {
  attachSessionCookie,
  clearSessionCookie,
  readSessionToken,
  SESSION_COOKIE_NAME,
} from "@/modules/auth/session-cookie.js";

const makeResponse = () => successResponse({ ok: true }, { requestId: "req-1" });

describe("session cookies", () => {
  it("attaches a secure HTTP-only session cookie", () => {
    const response = attachSessionCookie(makeResponse(), "session-token");
    const cookie = response.cookies.get(SESSION_COOKIE_NAME);

    expect(cookie?.value).toBe("session-token");
    expect(cookie).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: 604800,
    });
  });

  it("clears the session cookie", () => {
    const response = clearSessionCookie(makeResponse());
    const cookie = response.cookies.get(SESSION_COOKIE_NAME);

    expect(cookie?.value).toBe("");
    expect(cookie?.maxAge).toBe(0);
  });

  it("reads the session token from a request", () => {
    const request = new NextRequest("http://localhost", {
      headers: { cookie: `${SESSION_COOKIE_NAME}=token-value` },
    });

    expect(readSessionToken(request)).toBe("token-value");
    expect(readSessionToken(new NextRequest("http://localhost"))).toBeNull();
  });
});
