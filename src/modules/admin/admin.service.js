import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client.js";
import { adminProfiles } from "@/lib/db/schema/users.js";
import { assertSuperAdmin } from "@/modules/auth/authorization.js";
import { findUserByEmail, findUserById } from "@/modules/users/users.service.js";

export class AdminBootstrapError extends Error {
  constructor() {
    super("The initial administrator has already been provisioned.");
    this.name = "AdminBootstrapError";
    this.code = "ADMIN_BOOTSTRAP_NOT_ALLOWED";
    this.status = 409;
  }
}

export class DuplicateAdminProfileError extends Error {
  constructor() {
    super("That user already has an administrator profile.");
    this.name = "DuplicateAdminProfileError";
    this.code = "ADMIN_PROFILE_EXISTS";
    this.status = 409;
  }
}

export class AdminTargetError extends Error {
  constructor() {
    super("The target user is not eligible for an administrator profile.");
    this.name = "AdminTargetError";
    this.code = "ADMIN_TARGET_UNAVAILABLE";
    this.status = 422;
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

function isEligibleUser(user) {
  return (
    user?.status === "active" &&
    user.deletedAt === null &&
    user.emailVerifiedAt !== null
  );
}

export function toPublicAdminProfile(profile) {
  return {
    id: profile.id,
    userId: profile.userId,
    role: profile.role,
    mfaEnrolledAt: profile.mfaEnrolledAt,
    createdAt: profile.createdAt,
  };
}

export async function findAdminProfileByUserId(userId, options = {}) {
  const { database = getDb() } = options;
  const [profile] = await database
    .select()
    .from(adminProfiles)
    .where(eq(adminProfiles.userId, userId))
    .limit(1);

  return profile ?? null;
}

export async function bootstrapInitialSuperAdmin(input, options = {}) {
  const { database = getDb() } = options;
  const [existing] = await database
    .select({ id: adminProfiles.id })
    .from(adminProfiles)
    .limit(1);

  if (existing) {
    throw new AdminBootstrapError();
  }

  const user = await findUserByEmail(input.email, { database });

  if (!isEligibleUser(user)) {
    throw new AdminTargetError();
  }

  try {
    const [profile] = await database
      .insert(adminProfiles)
      .values({
        userId: user.id,
        role: "super_admin",
        createdByUserId: null,
      })
      .returning();

    return toPublicAdminProfile(profile);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AdminBootstrapError();
    }

    throw error;
  }
}

export async function inviteAdmin(input, options = {}) {
  const { database = getDb() } = options;
  const [actor] = await database
    .select()
    .from(adminProfiles)
    .where(eq(adminProfiles.id, input.actorAdminProfileId))
    .limit(1);

  assertSuperAdmin(actor);

  const actorUser = await findUserById(actor.userId, { database });

  if (!isEligibleUser(actorUser)) {
    throw new AdminTargetError();
  }

  if (input.role !== "admin") {
    throw new AdminTargetError();
  }

  const user = await findUserByEmail(input.email, { database });

  if (!isEligibleUser(user)) {
    throw new AdminTargetError();
  }

  try {
    const [profile] = await database
      .insert(adminProfiles)
      .values({
        userId: user.id,
        role: "admin",
        createdByUserId: actor.userId,
      })
      .returning();

    return toPublicAdminProfile(profile);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new DuplicateAdminProfileError();
    }

    throw error;
  }
}
