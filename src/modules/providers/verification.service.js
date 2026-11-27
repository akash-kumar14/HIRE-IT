import { and, asc, count, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client.js";
import {
  providerVerifications,
  serviceCategories,
  verificationRequirements,
} from "@/lib/db/schema/providers.js";
import { CatalogNotFoundError } from "@/modules/categories/catalog.service.js";
import {
  ProviderProfileNotFoundError,
  findProviderProfileByUserId,
} from "@/modules/providers/provider-applications.service.js";
import {
  effectiveVerificationStatus,
  verificationIsExpired,
} from "@/modules/providers/qualification.service.js";
import {
  AUDIT_ACTIONS,
  recordAdminAction,
} from "@/modules/audit/audit.service.js";

export class VerificationConflictError extends Error {
  constructor(message = "A verification requirement already exists.") {
    super(message);
    this.name = "VerificationConflictError";
    this.code = "VERIFICATION_REQUIREMENT_EXISTS";
    this.status = 409;
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

export function toPublicRequirement(requirement) {
  return {
    id: requirement.id,
    categoryId: requirement.categoryId,
    name: requirement.name,
    description: requirement.description,
    documentType: requirement.documentType,
    isRequired: requirement.isRequired,
    validityMonths: requirement.validityMonths,
  };
}

export function toAdminRequirement(requirement) {
  return {
    ...toPublicRequirement(requirement),
    isActive: requirement.isActive,
    createdAt: requirement.createdAt,
    updatedAt: requirement.updatedAt,
  };
}

export function toOwnVerification(verification, requirement, options = {}) {
  const { now = new Date() } = options;

  return {
    id: verification.id,
    requirementId: verification.requirementId,
    status: effectiveVerificationStatus(verification, now),
    isExpired: verificationIsExpired(verification, now),
    verifiedAt: verification.verifiedAt,
    expiresAt: verification.expiresAt,
    rejectionReason: verification.rejectionReason,
    requirement: {
      id: requirement.id,
      name: requirement.name,
      documentType: requirement.documentType,
      isRequired: requirement.isRequired,
      validityMonths: requirement.validityMonths,
    },
  };
}

async function findActiveCategory(categoryId, database) {
  const [category] = await database
    .select()
    .from(serviceCategories)
    .where(
      and(
        eq(serviceCategories.id, categoryId),
        eq(serviceCategories.isActive, true),
      ),
    )
    .limit(1);

  if (!category) {
    throw new CatalogNotFoundError("Category not found.");
  }

  return category;
}

export async function listRequirementsByCategory(
  categoryId,
  { limit = 20, offset = 0 } = {},
  options = {},
) {
  const { database = getDb() } = options;

  await findActiveCategory(categoryId, database);

  const filter = and(
    eq(verificationRequirements.categoryId, categoryId),
    eq(verificationRequirements.isActive, true),
  );
  const rows = await database
    .select()
    .from(verificationRequirements)
    .where(filter)
    .orderBy(asc(verificationRequirements.name))
    .limit(limit)
    .offset(offset);
  const [{ total }] = await database
    .select({ total: count() })
    .from(verificationRequirements)
    .where(filter);

  return { items: rows.map(toPublicRequirement), total };
}

export async function createVerificationRequirement(input, options = {}) {
  const {
    database = getDb(),
    actorAdminProfileId,
    requestId = null,
  } = options;

  await findActiveCategory(input.categoryId, database);

  try {
    return await database.transaction(async (tx) => {
      const [requirement] = await tx
        .insert(verificationRequirements)
        .values(input)
        .returning();

      await recordAdminAction(
        {
          adminProfileId: actorAdminProfileId,
          action: AUDIT_ACTIONS.VERIFICATION_REQUIREMENT_CREATE,
          entityType: "verification_requirement",
          entityId: requirement.id,
          requestId,
          metadata: {},
        },
        { database: tx },
      );

      return toAdminRequirement(requirement);
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new VerificationConflictError(
        "A requirement with that name already exists in this category.",
      );
    }

    throw error;
  }
}

export async function listOwnVerifications(user, options = {}) {
  const { database = getDb() } = options;
  const profile = await findProviderProfileByUserId(user.id, { database });

  if (!profile) {
    throw new ProviderProfileNotFoundError();
  }

  const rows = await database
    .select({
      verification: providerVerifications,
      requirement: verificationRequirements,
    })
    .from(providerVerifications)
    .innerJoin(
      verificationRequirements,
      eq(providerVerifications.requirementId, verificationRequirements.id),
    )
    .where(eq(providerVerifications.providerProfileId, profile.id))
    .orderBy(asc(verificationRequirements.name));

  return rows.map((row) => toOwnVerification(row.verification, row.requirement));
}
