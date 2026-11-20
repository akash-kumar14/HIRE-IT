import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db/client.js";
import { userSessions } from "@/lib/db/schema/users.js";
import { generateSessionToken, hashSessionToken } from "./session-token.js";

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function createSession(userId, options = {}) {
  const {
    database = getDb(),
    now = new Date(),
    ttlMs = SESSION_TTL_MS,
  } = options;
  const token = generateSessionToken();
  const [session] = await database
    .insert(userSessions)
    .values({
      userId,
      tokenHash: hashSessionToken(token),
      expiresAt: new Date(now.getTime() + ttlMs),
      createdAt: now,
    })
    .returning();

  return { token, session };
}

export async function findActiveSessionByToken(token, options = {}) {
  const { database = getDb(), now = new Date() } = options;

  if (typeof token !== "string" || token.length === 0) {
    return null;
  }

  const [session] = await database
    .select()
    .from(userSessions)
    .where(
      and(
        eq(userSessions.tokenHash, hashSessionToken(token)),
        isNull(userSessions.revokedAt),
        gt(userSessions.expiresAt, now),
      ),
    )
    .limit(1);

  return session ?? null;
}

export async function touchSession(sessionId, options = {}) {
  const { database = getDb(), now = new Date() } = options;
  const [session] = await database
    .update(userSessions)
    .set({ lastUsedAt: now })
    .where(
      and(
        eq(userSessions.id, sessionId),
        isNull(userSessions.revokedAt),
        gt(userSessions.expiresAt, now),
      ),
    )
    .returning();

  return session ?? null;
}

export async function revokeSession(sessionId, options = {}) {
  const { database = getDb(), now = new Date() } = options;
  const revoked = await database
    .update(userSessions)
    .set({ revokedAt: now })
    .where(and(eq(userSessions.id, sessionId), isNull(userSessions.revokedAt)))
    .returning({ id: userSessions.id });

  return revoked.length > 0;
}

export async function revokeAllUserSessions(userId, options = {}) {
  const { database = getDb(), now = new Date() } = options;
  const revoked = await database
    .update(userSessions)
    .set({ revokedAt: now })
    .where(
      and(eq(userSessions.userId, userId), isNull(userSessions.revokedAt)),
    )
    .returning({ id: userSessions.id });

  return revoked.length;
}
