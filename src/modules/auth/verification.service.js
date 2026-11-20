import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db/client.js";
import { users, verificationTokens } from "@/lib/db/schema/users.js";
import { findUserById, toPublicUser } from "@/modules/users/users.service.js";
import { sendVerificationEmail } from "@/infrastructure/email/stub.js";
import {
  generateVerificationToken,
  hashVerificationToken,
} from "./verification-token.js";

export const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

export class InvalidVerificationTokenError extends Error {
  constructor() {
    super("Invalid or expired verification token");
    this.name = "InvalidVerificationTokenError";
    this.code = "INVALID_VERIFICATION_TOKEN";
  }
}

export async function requestEmailVerification(userId, options = {}) {
  const {
    database = getDb(),
    emailSender = sendVerificationEmail,
    now = new Date(),
    ttlMs = EMAIL_VERIFICATION_TTL_MS,
  } = options;
  const user = await findUserById(userId, { database });

  if (!user || user.status !== "active" || user.deletedAt) {
    return { sent: false, reason: "unavailable" };
  }

  if (user.emailVerifiedAt) {
    return { sent: false, reason: "already_verified" };
  }

  const token = generateVerificationToken();

  await database
    .update(verificationTokens)
    .set({ consumedAt: now })
    .where(
      and(
        eq(verificationTokens.userId, userId),
        eq(verificationTokens.type, "email_verification"),
        isNull(verificationTokens.consumedAt),
      ),
    );

  await database.insert(verificationTokens).values({
    userId,
    type: "email_verification",
    tokenHash: hashVerificationToken(token),
    expiresAt: new Date(now.getTime() + ttlMs),
    createdAt: now,
  });

  await emailSender({ to: user.email, token, userId });

  return { sent: true, reason: null };
}

export async function confirmEmailVerification(input, options = {}) {
  const { database = getDb(), now = new Date() } = options;

  if (typeof input?.token !== "string" || input.token.length === 0) {
    throw new InvalidVerificationTokenError();
  }

  const tokenHash = hashVerificationToken(input.token);
  const [record] = await database
    .select()
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.tokenHash, tokenHash),
        eq(verificationTokens.type, "email_verification"),
        isNull(verificationTokens.consumedAt),
        gt(verificationTokens.expiresAt, now),
      ),
    )
    .limit(1);

  if (!record) {
    throw new InvalidVerificationTokenError();
  }

  const [consumed] = await database
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
    throw new InvalidVerificationTokenError();
  }

  const [user] = await database
    .update(users)
    .set({ emailVerifiedAt: now })
    .where(eq(users.id, record.userId))
    .returning();

  if (!user) {
    throw new InvalidVerificationTokenError();
  }

  return toPublicUser(user);
}
