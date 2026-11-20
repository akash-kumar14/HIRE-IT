import { compare, hash } from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(password) {
  if (typeof password !== "string" || password.length === 0) {
    throw new Error("Password is required");
  }

  return hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password, passwordHash) {
  if (typeof password !== "string" || password.length === 0) {
    return false;
  }

  if (typeof passwordHash !== "string" || passwordHash.length === 0) {
    return false;
  }

  return compare(password, passwordHash);
}
