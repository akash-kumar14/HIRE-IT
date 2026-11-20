import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client.js";
import { users } from "@/lib/db/schema/users.js";

export function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt,
    createdAt: user.createdAt,
  };
}

export class DuplicateEmailError extends Error {
  constructor() {
    super("Email is already registered");
    this.name = "DuplicateEmailError";
    this.code = "DUPLICATE_EMAIL";
  }
}

function isUniqueViolation(error) {
  let current = error;

  while (current) {
    if (current.code === "23505") {
      return true;
    }

    current = current.cause;
  }

  return false;
}

export function normalizeEmail(email) {
  if (typeof email !== "string") {
    throw new TypeError("Email must be a string");
  }

  const normalized = email.trim().toLowerCase();

  if (!normalized) {
    throw new Error("Email is required");
  }

  return normalized;
}

export async function createUser(input, options = {}) {
  const { database = getDb() } = options;
  const { email, passwordHash, fullName, phone } = input;

  if (typeof passwordHash !== "string" || passwordHash.length === 0) {
    throw new Error("Password hash is required");
  }

  if (typeof fullName !== "string" || fullName.trim().length === 0) {
    throw new Error("Full name is required");
  }

  try {
    const [user] = await database
      .insert(users)
      .values({
        email: normalizeEmail(email),
        passwordHash,
        fullName: fullName.trim(),
        phone: phone ?? null,
      })
      .returning();

    return user;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new DuplicateEmailError();
    }

    throw error;
  }
}

export async function findUserByEmail(email, options = {}) {
  const { database = getDb() } = options;
  const [user] = await database
    .select()
    .from(users)
    .where(eq(users.email, normalizeEmail(email)))
    .limit(1);

  return user ?? null;
}

export async function findUserById(userId, options = {}) {
  const { database = getDb() } = options;
  const [user] = await database
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user ?? null;
}

export async function updateUserPasswordHash(userId, passwordHash, options = {}) {
  const { database = getDb() } = options;

  if (typeof passwordHash !== "string" || passwordHash.length === 0) {
    throw new Error("Password hash is required");
  }

  const [user] = await database
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, userId))
    .returning();

  return user ?? null;
}
