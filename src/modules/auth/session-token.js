import { createHash, randomBytes } from "node:crypto";

const TOKEN_BYTES = 32;

export function generateSessionToken() {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

export function hashSessionToken(token) {
  if (typeof token !== "string" || token.length === 0) {
    throw new Error("Session token is required");
  }

  return createHash("sha256").update(token).digest("hex");
}
