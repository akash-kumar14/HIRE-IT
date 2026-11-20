import "dotenv/config";
import { randomUUID } from "node:crypto";
import { inArray } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { getDb } from "@/lib/db/client.js";
import { users } from "@/lib/db/schema/users.js";
import { hashPassword, verifyPassword } from "@/modules/auth/password.js";
import {
  createSession,
  findActiveSessionByToken,
  revokeAllUserSessions,
  revokeSession,
  touchSession,
} from "@/modules/auth/sessions.service.js";
import {
  createUser,
  DuplicateEmailError,
  findUserByEmail,
  updateUserPasswordHash,
} from "@/modules/users/users.service.js";

const databaseUrl = process.env.DATABASE_URL;
const createdUserIds = [];

async function makeUser(label) {
  const passwordHash = await hashPassword("TestPassword123!");
  const user = await createUser({
    email: `m21-${label}-${randomUUID()}@example.com`,
    passwordHash,
    fullName: "M2.1 Test User",
  });

  createdUserIds.push(user.id);
  return user;
}

describe.skipIf(!databaseUrl)("users and sessions data layer", () => {
  afterAll(async () => {
    if (createdUserIds.length > 0) {
      await getDb().delete(users).where(inArray(users.id, createdUserIds));
    }
  });

  it("stores a normalized email and verifies the password hash", async () => {
    const email = `Mixed.Case-${randomUUID()}@Example.COM`;
    const passwordHash = await hashPassword("OriginalPassword123!");
    const user = await createUser({
      email: `  ${email}  `,
      passwordHash,
      fullName: "  Mixed Case  ",
    });

    createdUserIds.push(user.id);

    const found = await findUserByEmail(email);
    expect(found?.id).toBe(user.id);
    expect(found?.email).toBe(email.toLowerCase());
    expect(found?.fullName).toBe("Mixed Case");
    await expect(verifyPassword("OriginalPassword123!", found.passwordHash)).resolves.toBe(true);

    const rotatedHash = await hashPassword("RotatedPassword123!");
    const updated = await updateUserPasswordHash(user.id, rotatedHash);
    expect(updated?.passwordHash).toBe(rotatedHash);
    await expect(verifyPassword("OriginalPassword123!", updated.passwordHash)).resolves.toBe(false);
  });

  it("rejects duplicate normalized emails", async () => {
    const user = await makeUser("duplicate");

    await expect(
      createUser({
        email: `  ${user.email.toUpperCase()}  `,
        passwordHash: "placeholder-hash",
        fullName: "Duplicate User",
      }),
    ).rejects.toBeInstanceOf(DuplicateEmailError);
  });

  it("creates, finds, touches, and revokes a session", async () => {
    const user = await makeUser("session");
    const now = new Date();
    const { token, session } = await createSession(user.id, {
      now,
      ttlMs: 60_000,
    });

    expect(session.tokenHash).not.toBe(token);
    expect(session.userId).toBe(user.id);

    const active = await findActiveSessionByToken(token, {
      now: new Date(now.getTime() + 1_000),
    });
    expect(active?.id).toBe(session.id);

    const touchedAt = new Date(now.getTime() + 2_000);
    const touched = await touchSession(session.id, { now: touchedAt });
    expect(touched?.lastUsedAt?.toISOString()).toBe(touchedAt.toISOString());

    await expect(revokeSession(session.id, { now: touchedAt })).resolves.toBe(true);
    await expect(findActiveSessionByToken(token, { now: touchedAt })).resolves.toBeNull();
    await expect(revokeSession(session.id, { now: touchedAt })).resolves.toBe(false);
  });

  it("ignores expired sessions and revokes all active sessions for a user", async () => {
    const user = await makeUser("revoke-all");
    const now = new Date();
    const active = await createSession(user.id, { now, ttlMs: 60_000 });
    const expired = await createSession(user.id, { now, ttlMs: -1_000 });

    await expect(
      findActiveSessionByToken(expired.token, {
        now: new Date(now.getTime() + 1_000),
      }),
    ).resolves.toBeNull();

    await expect(revokeAllUserSessions(user.id, { now })).resolves.toBe(2);
    await expect(findActiveSessionByToken(active.token, { now })).resolves.toBeNull();
  });
});
