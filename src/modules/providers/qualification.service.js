export class QualificationExpiredError extends Error {
  constructor(message = "A required qualification has expired.") {
    super(message);
    this.name = "QualificationExpiredError";
    this.code = "QUALIFICATION_EXPIRED";
    this.status = 403;
  }
}

function toDate(value) {
  if (value instanceof Date) return value;
  if (value === null || value === undefined || value === "") return null;

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function verificationIsExpired(verification, now = new Date()) {
  if (verification.status === "expired") return true;

  const expiresAt = toDate(verification.expiresAt);

  return expiresAt !== null && expiresAt.getTime() <= now.getTime();
}

export function effectiveVerificationStatus(verification, now = new Date()) {
  return verificationIsExpired(verification, now) ? "expired" : verification.status;
}

export function assertNoExpiredQualifications(verifications, now = new Date()) {
  if (verifications.some((verification) => verificationIsExpired(verification, now))) {
    throw new QualificationExpiredError();
  }
}
