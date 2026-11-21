import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db/client.js";
import { verificationTokens } from "@/lib/db/schema/users.js";
import { sendPasswordResetEmail } from "@/infrastructure/email/stub.js";
import {
  findUserByEmail,
  findUserById,
  updateUserPasswordHash,
} from "@/modules/users/users.service.js";
import { hashPassword } from "./password.js";
import { revokeAllUserSessions } from "./sessions.service.js";
import {
  generateVerificationToken,
  hashVerificationToken,
} from "./verification-token.js";

export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

export class InvalidPasswordResetTokenError extends Error {
  constructor() {
    super("Invalid or expired password reset token");
    this.name = "InvalidPasswordResetTokenError";
    this.code = "INVALID_PASSWORD_RESET_TOKEN";
  }
}

function isUsableUser(user) {
  return user?.status === "active" && user.deletedAt === null;
}

export async function requestPasswordReset(input, options = {}) {
  const {
    database = getDb(),
    emailSender = sendPasswordResetEmail,
    now = new Date(),
    ttlMs = PASSWORD_RESET_TTL_MS,
  } = options;
  const user = await findUserByEmail(input.email, { database });

  if (!isUsableUser(user)) {
    return { sent: false, reason: "unavailable" };
  }

  const token = generateVerificationToken();

  await database
    .update(verificationTokens)
    .set({ consumedAt: now })
    .where(
      and(
        eq(verificationTokens.userId, user.id),
        eq(verificationTokens.type, "password_reset"),
        isNull(verificationTokens.consumedAt),
      ),
    );

  await database.insert(verificationTokens).values({
    userId: user.id,
    type: "password_reset",
    tokenHash: hashVerificationToken(token),
    expiresAt: new Date(now.getTime() + ttlMs),
    createdAt: now,
  });

  await emailSender({ to: user.email, token, userId: user.id });

  return { sent: true, reason: null };
}

export async function confirmPasswordReset(input, options = {}) {
  const { database = getDb(), now = new Date() } = options;

  if (typeof input?.token !== "string" || input.token.length === 0) {
    throw new InvalidPasswordResetTokenError();
  }

  const tokenHash = hashVerificationToken(input.token);
  const passwordHash = await hashPassword(input.password);

  await database.transaction(async (transaction) => {
    const [record] = await transaction
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.tokenHash, tokenHash),
          eq(verificationTokens.type, "password_reset"),
          isNull(verificationTokens.consumedAt),
          gt(verificationTokens.expiresAt, now),
        ),
      )
      .limit(1);

    if (!record) {
      throw new InvalidPasswordResetTokenError();
    }

    const [consumed] = await transaction
      .update(verificationTokens)
      .set({ consumedAt: now })
      .where(
        and(
          eq(verificationTokens.id, record.id),
          isNull(verificationTokens.consumedAt),
        ),
      )
      .returning();

    if (!consumed) {
      throw new InvalidPasswordResetTokenError();
    }

    const user = await findUserById(record.userId, { database: transaction });

    if (!isUsableUser(user) || !user.passwordHash) {
      throw new InvalidPasswordResetTokenError();
    }

    const updated = await updateUserPasswordHash(user.id, passwordHash, {
      database: transaction,
    });

    if (!updated) {
      throw new InvalidPasswordResetTokenError();
    }

    await revokeAllUserSessions(user.id, { database: transaction, now });
  });

  return { updated: true };
}
