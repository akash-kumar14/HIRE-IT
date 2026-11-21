import { and, eq, isNull } from "drizzle-orm";
import { generateSecret, generateURI, verify } from "otplib";
import { getDb } from "@/lib/db/client.js";
import {
  adminMfaCredentials,
  adminProfiles,
  userSessions,
} from "@/lib/db/schema/users.js";
import {
  decryptTotpSecret,
  encryptTotpSecret,
  generateRecoveryCodes,
  hashRecoveryCode,
} from "./mfa-crypto.js";

export class MfaError extends Error {
  constructor(code, message, status) {
    super(message);
    this.name = "MfaError";
    this.code = code;
    this.status = status;
  }
}

export class MfaAlreadyEnrolledError extends MfaError {
  constructor() {
    super("MFA_ALREADY_ENROLLED", "MFA is already enrolled.", 409);
  }
}

export class MfaNotEnrolledError extends MfaError {
  constructor() {
    super("MFA_NOT_ENROLLED", "MFA enrollment is not complete.", 409);
  }
}

export class InvalidMfaCodeError extends MfaError {
  constructor() {
    super("INVALID_MFA_CODE", "Invalid authentication code.", 400);
  }
}

export class InvalidRecoveryCodeError extends MfaError {
  constructor() {
    super("INVALID_RECOVERY_CODE", "Invalid recovery code.", 400);
  }
}

export async function findMfaCredential(adminProfileId, options = {}) {
  const { database = getDb() } = options;
  const [credential] = await database
    .select()
    .from(adminMfaCredentials)
    .where(eq(adminMfaCredentials.adminProfileId, adminProfileId))
    .limit(1);

  return credential ?? null;
}

async function assertValidTotp(secret, code) {
  const result = await verify({ secret, token: code, epochTolerance: 30 });

  if (!result?.valid) {
    throw new InvalidMfaCodeError();
  }
}

export async function enrollMfa(input, options = {}) {
  const { database = getDb() } = options;
  const existing = await findMfaCredential(input.adminProfileId, { database });

  if (existing?.confirmedAt) {
    throw new MfaAlreadyEnrolledError();
  }

  const secret = generateSecret();
  const totpSecretEncrypted = encryptTotpSecret(secret);
  const values = {
    totpSecretEncrypted,
    recoveryCodeHashes: { codes: [] },
    confirmedAt: null,
    lastUsedAt: null,
  };

  if (existing) {
    await database
      .update(adminMfaCredentials)
      .set(values)
      .where(eq(adminMfaCredentials.id, existing.id));
  } else {
    await database.insert(adminMfaCredentials).values({
      adminProfileId: input.adminProfileId,
      ...values,
    });
  }

  return {
    secret,
    otpauthUri: generateURI({
      issuer: "HIRE-IT",
      label: input.email,
      secret,
    }),
  };
}

export async function confirmMfa(input, options = {}) {
  const { database = getDb() } = options;
  const credential = await findMfaCredential(input.adminProfileId, { database });

  if (!credential) {
    throw new MfaNotEnrolledError();
  }

  if (credential.confirmedAt) {
    throw new MfaAlreadyEnrolledError();
  }

  await assertValidTotp(decryptTotpSecret(credential.totpSecretEncrypted), input.code);

  const recoveryCodes = generateRecoveryCodes();
  const now = new Date();

  await database.transaction(async (tx) => {
    await tx
      .update(adminMfaCredentials)
      .set({
        confirmedAt: now,
        recoveryCodeHashes: {
          codes: recoveryCodes.map((code) => ({ hash: hashRecoveryCode(code), usedAt: null })),
        },
        lastUsedAt: now,
      })
      .where(eq(adminMfaCredentials.id, credential.id));

    await tx
      .update(adminProfiles)
      .set({ mfaEnrolledAt: now })
      .where(eq(adminProfiles.id, input.adminProfileId));
  });

  return { recoveryCodes, confirmedAt: now };
}

export async function verifyMfa(input, options = {}) {
  const { database = getDb() } = options;
  const credential = await findMfaCredential(input.adminProfileId, { database });

  if (!credential?.confirmedAt) {
    throw new MfaNotEnrolledError();
  }

  await assertValidTotp(decryptTotpSecret(credential.totpSecretEncrypted), input.code);

  const now = new Date();

  await database.transaction(async (tx) => {
    await tx
      .update(adminMfaCredentials)
      .set({ lastUsedAt: now })
      .where(eq(adminMfaCredentials.id, credential.id));

    const [session] = await tx
      .update(userSessions)
      .set({ mfaVerifiedAt: now })
      .where(
        and(eq(userSessions.id, input.sessionId), isNull(userSessions.revokedAt)),
      )
      .returning({ id: userSessions.id });

    if (!session) {
      throw new Error("Session is no longer active.");
    }
  });

  return { verified: true };
}

export async function recoverMfa(input, options = {}) {
  const { database = getDb() } = options;
  const credential = await findMfaCredential(input.adminProfileId, { database });

  if (!credential?.confirmedAt) {
    throw new MfaNotEnrolledError();
  }

  const codeHash = hashRecoveryCode(input.code);
  const codes = credential.recoveryCodeHashes?.codes ?? [];
  const matching = codes.find((entry) => entry.hash === codeHash && !entry.usedAt);

  if (!matching) {
    throw new InvalidRecoveryCodeError();
  }

  const now = new Date();
  const nextCodes = codes.map((entry) =>
    entry.hash === codeHash ? { ...entry, usedAt: now } : entry,
  );

  await database.transaction(async (tx) => {
    await tx
      .update(adminMfaCredentials)
      .set({ recoveryCodeHashes: { codes: nextCodes }, lastUsedAt: now })
      .where(eq(adminMfaCredentials.id, credential.id));

    const [session] = await tx
      .update(userSessions)
      .set({ mfaVerifiedAt: now })
      .where(
        and(eq(userSessions.id, input.sessionId), isNull(userSessions.revokedAt)),
      )
      .returning({ id: userSessions.id });

    if (!session) {
      throw new Error("Session is no longer active.");
    }
  });

  return { verified: true };
}
