import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

function getEncryptionKey() {
  const secret = process.env.SESSION_SECRET;

  if (typeof secret !== "string" || secret.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters.");
  }

  return createHash("sha256").update(secret).digest();
}

export function encryptTotpSecret(secret) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(secret, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    "v1",
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptTotpSecret(payload) {
  const parts = typeof payload === "string" ? payload.split(".") : [];

  if (parts.length !== 4 || parts[0] !== "v1") {
    throw new Error("Invalid encrypted TOTP secret.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(parts[1], "base64url"),
  );
  decipher.setAuthTag(Buffer.from(parts[2], "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(parts[3], "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function normalizeRecoveryCode(code) {
  return code.replace(/[^a-z0-9]/gi, "").toUpperCase();
}

export function hashRecoveryCode(code) {
  return createHash("sha256").update(normalizeRecoveryCode(code)).digest("hex");
}

export function generateRecoveryCodes(count = 8) {
  return Array.from({ length: count }, () => {
    const value = randomBytes(9).toString("hex").toUpperCase();
    return `${value.slice(0, 6)}-${value.slice(6, 12)}-${value.slice(12, 18)}`;
  });
}
