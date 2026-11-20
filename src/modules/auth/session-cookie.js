import { SESSION_TTL_MS } from "./sessions.service.js";

export const SESSION_COOKIE_NAME = "hireit_session";

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

export function attachSessionCookie(response, token) {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    ...cookieOptions(),
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });

  return response;
}

export function clearSessionCookie(response) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...cookieOptions(),
    maxAge: 0,
  });

  return response;
}

export function readSessionToken(request) {
  return request.cookies.get(SESSION_COOKIE_NAME)?.value ?? null;
}
