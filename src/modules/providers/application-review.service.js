import { and, asc, count, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client.js";
import {
  providerProfiles,
  providerSkills,
  providerVerifications,
  skills,
  verificationRequirements,
} from "@/lib/db/schema/providers.js";
import { users } from "@/lib/db/schema/users.js";
import {
  AUDIT_ACTIONS,
  recordAdminAction,
} from "@/modules/audit/audit.service.js";
import {
  ProviderProfileNotFoundError,
  toApplication,
} from "./provider-applications.service.js";

export class ApplicationStateError extends Error {
  constructor(message = "Application must be pending to be reviewed.") {
    super(message);
    this.name = "ApplicationStateError";
    this.code = "APPLICATION_INVALID_STATE";
    this.status = 409;
  }
}

const applicantFields = {
  id: users.id,
  email: users.email,
  fullName: users.fullName,
  phone: users.phone,
  emailVerifiedAt: users.emailVerifiedAt,
  status: users.status,
};

function toApplicant(user) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    emailVerifiedAt: user.emailVerifiedAt,
    status: user.status,
  };
}

function toAdminApplication(row) {
  return {
    ...toApplication(row.profile),
    isAvailable: row.profile.isAvailable,
    applicant: toApplicant(row.user),
  };
}

export async function listApplications(filters, options = {}) {
  const { database = getDb() } = options;
  const filter =
    filters.status === "all"
      ? undefined
      : eq(providerProfiles.status, filters.status);
  const rows = await database
    .select({ profile: providerProfiles, user: applicantFields })
    .from(providerProfiles)
    .innerJoin(users, eq(users.id, providerProfiles.userId))
    .where(filter)
    .orderBy(desc(providerProfiles.submittedAt), desc(providerProfiles.createdAt))
    .limit(filters.limit)
    .offset(filters.offset);
  const [{ total }] = await database
    .select({ total: count() })
    .from(providerProfiles)
    .where(filter);

  return { items: rows.map(toAdminApplication), total };
}

export async function getApplication(applicationId, options = {}) {
  const { database = getDb() } = options;
  const [row] = await database
    .select({ profile: providerProfiles, user: applicantFields })
    .from(providerProfiles)
    .innerJoin(users, eq(users.id, providerProfiles.userId))
    .where(eq(providerProfiles.id, applicationId))
    .limit(1);

  if (!row) {
    throw new ProviderProfileNotFoundError("Provider application not found.");
  }

  const skillRows = await database
    .select({
      id: skills.id,
      name: skills.name,
      categoryId: skills.categoryId,
      yearsOfExperience: providerSkills.yearsOfExperience,
      isPrimary: providerSkills.isPrimary,
    })
    .from(providerSkills)
    .innerJoin(skills, eq(skills.id, providerSkills.skillId))
    .where(eq(providerSkills.providerProfileId, applicationId))
    .orderBy(asc(skills.name));
  const verificationRows = await database
    .select({
      id: providerVerifications.id,
      requirementName: verificationRequirements.name,
      documentType: verificationRequirements.documentType,
      status: providerVerifications.status,
      verifiedAt: providerVerifications.verifiedAt,
      expiresAt: providerVerifications.expiresAt,
      hasDocument: sql`${providerVerifications.documentObjectKey} is not null`,
    })
    .from(providerVerifications)
    .innerJoin(
      verificationRequirements,
      eq(verificationRequirements.id, providerVerifications.requirementId),
    )
    .where(eq(providerVerifications.providerProfileId, applicationId))
    .orderBy(asc(verificationRequirements.name));

  return {
    ...toAdminApplication(row),
    skills: skillRows.map((item) => ({
      id: item.id,
      name: item.name,
      categoryId: item.categoryId,
      yearsOfExperience: item.yearsOfExperience,
      isPrimary: item.isPrimary,
    })),
    verifications: verificationRows.map((item) => ({
      id: item.id,
      requirementName: item.requirementName,
      documentType: item.documentType,
      status: item.status,
      verifiedAt: item.verifiedAt,
      expiresAt: item.expiresAt,
      hasDocument: Boolean(item.hasDocument),
    })),
  };
}

async function decideApplication(
  applicationId,
  decision,
  { actorAdminProfileId, requestId = null, metadata = {} },
  options = {},
) {
  const { database = getDb(), now = new Date() } = options;

  return database.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(providerProfiles)
      .where(eq(providerProfiles.id, applicationId))
      .limit(1);

    if (!current) {
      throw new ProviderProfileNotFoundError("Provider application not found.");
    }

    if (current.status !== "pending") {
      throw new ApplicationStateError();
    }

    const [updated] = await tx
      .update(providerProfiles)
      .set({
        status: decision,
        isAvailable: false,
        approvedAt: decision === "approved" ? now : null,
      })
      .where(
        and(
          eq(providerProfiles.id, applicationId),
          eq(providerProfiles.status, "pending"),
        ),
      )
      .returning();

    if (!updated) {
      throw new ApplicationStateError();
    }

    const action =
      decision === "approved"
        ? AUDIT_ACTIONS.PROVIDER_APPLICATION_APPROVE
        : AUDIT_ACTIONS.PROVIDER_APPLICATION_REJECT;

    await recordAdminAction(
      {
        adminProfileId: actorAdminProfileId,
        action,
        entityType: "provider_application",
        entityId: updated.id,
        requestId,
        metadata,
      },
      { database: tx },
    );

    return toApplication(updated);
  });
}

export function approveApplication(
  applicationId,
  input,
  context,
  options = {},
) {
  return decideApplication(
    applicationId,
    "approved",
    { ...context, metadata: input.note ? { note: input.note } : {} },
    options,
  );
}

export function rejectApplication(
  applicationId,
  input,
  context,
  options = {},
) {
  return decideApplication(
    applicationId,
    "rejected",
    { ...context, metadata: { reason: input.reason } },
    options,
  );
}
