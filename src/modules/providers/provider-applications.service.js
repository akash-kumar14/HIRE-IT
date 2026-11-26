import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client.js";
import { providerProfiles } from "@/lib/db/schema/providers.js";
import { assertVerifiedUser } from "@/modules/auth/authorization.js";

export class ApplicationConflictError extends Error {
  constructor(message = "An application already exists for this account.") {
    super(message);
    this.name = "ApplicationConflictError";
    this.code = "APPLICATION_EXISTS";
    this.status = 409;
  }
}

export class ProviderProfileNotFoundError extends Error {
  constructor(message = "Provider profile not found.") {
    super(message);
    this.name = "ProviderProfileNotFoundError";
    this.code = "PROVIDER_PROFILE_NOT_FOUND";
    this.status = 404;
  }
}

function isUniqueViolation(error) {
  let current = error;

  while (current) {
    if (current.code === "23505") return true;
    current = current.cause;
  }

  return false;
}

export function toApplication(profile) {
  return {
    id: profile.id,
    userId: profile.userId,
    displayName: profile.displayName,
    bio: profile.bio,
    status: profile.status,
    submittedAt: profile.submittedAt,
    approvedAt: profile.approvedAt,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

export function toOwnProviderProfile(profile) {
  return {
    id: profile.id,
    userId: profile.userId,
    displayName: profile.displayName,
    bio: profile.bio,
    status: profile.status,
    isAvailable: profile.isAvailable,
    submittedAt: profile.submittedAt,
    approvedAt: profile.approvedAt,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

export async function findProviderProfileByUserId(userId, options = {}) {
  const { database = getDb() } = options;
  const [profile] = await database
    .select()
    .from(providerProfiles)
    .where(eq(providerProfiles.userId, userId))
    .limit(1);

  return profile ?? null;
}

export async function submitApplication(user, input, options = {}) {
  assertVerifiedUser(user);

  const { database = getDb(), now = new Date() } = options;
  const existing = await findProviderProfileByUserId(user.id, { database });

  if (existing && existing.status !== "rejected") {
    throw new ApplicationConflictError();
  }

  if (existing) {
    const [updated] = await database
      .update(providerProfiles)
      .set({
        displayName: input.displayName,
        bio: input.bio,
        status: "pending",
        isAvailable: false,
        submittedAt: now,
        approvedAt: null,
      })
      .where(eq(providerProfiles.id, existing.id))
      .returning();

    return toApplication(updated);
  }

  try {
    const [created] = await database
      .insert(providerProfiles)
      .values({
        userId: user.id,
        displayName: input.displayName,
        bio: input.bio,
        status: "pending",
        submittedAt: now,
      })
      .returning();

    return toApplication(created);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ApplicationConflictError();
    }

    throw error;
  }
}

export async function getOwnApplication(user, options = {}) {
  const profile = await findProviderProfileByUserId(user.id, options);

  if (!profile) {
    throw new ProviderProfileNotFoundError("Provider application not found.");
  }

  return toApplication(profile);
}

export async function getOwnProviderProfile(user, options = {}) {
  const profile = await findProviderProfileByUserId(user.id, options);

  if (!profile) {
    throw new ProviderProfileNotFoundError();
  }

  return toOwnProviderProfile(profile);
}
