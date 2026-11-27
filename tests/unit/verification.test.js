import { describe, expect, it } from "vitest";
import {
  providerProfiles,
  providerVerifications,
  serviceCategories,
  verificationRequirements,
} from "@/lib/db/schema/providers.js";
import { auditLogs } from "@/lib/db/schema/users.js";
import { AUDIT_ACTIONS } from "@/modules/audit/audit.service.js";
import { CatalogNotFoundError } from "@/modules/categories/catalog.service.js";
import { ProviderProfileNotFoundError } from "@/modules/providers/provider-applications.service.js";
import {
  VerificationConflictError,
  createVerificationRequirement,
  listOwnVerifications,
  listRequirementsByCategory,
  toOwnVerification,
  toPublicRequirement,
} from "@/modules/providers/verification.service.js";
import { validateVerificationRequirementCreate } from "@/modules/providers/verification.validation.js";

const CATEGORY_ID = "6b6d0f2a-6f7e-4b3c-9d21-0e5c4a7b9f10";
const USER_ID = "8b6d0f2a-6f7e-4b3c-9d21-0e5c4a7b9f10";
const PROFILE_ID = "3e9c4b17-5a2d-4f68-8b10-7c6d9e2a4f31";
const REQUIREMENT_ID = "4e9c4b17-5a2d-4f68-8b10-7c6d9e2a4f32";
const VERIFICATION_ID = "5e9c4b17-5a2d-4f68-8b10-7c6d9e2a4f33";
const ADMIN_PROFILE_ID = "7e9c4b17-5a2d-4f68-8b10-7c6d9e2a4f34";

function categoryRow(overrides = {}) {
  return {
    id: CATEGORY_ID,
    name: "Home Cleaning",
    slug: "home-cleaning",
    description: null,
    isActive: true,
    sortOrder: 0,
    ...overrides,
  };
}

function requirementRow(overrides = {}) {
  const now = new Date();

  return {
    id: REQUIREMENT_ID,
    categoryId: CATEGORY_ID,
    name: "Identity Proof",
    description: null,
    documentType: "identity_document",
    isRequired: true,
    validityMonths: 60,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function verificationRow(overrides = {}) {
  const now = new Date();

  return {
    id: VERIFICATION_ID,
    providerProfileId: PROFILE_ID,
    requirementId: REQUIREMENT_ID,
    status: "approved",
    documentObjectKey: "private/identity.pdf",
    reviewedByAdminProfileId: ADMIN_PROFILE_ID,
    reviewedAt: now,
    verifiedAt: now,
    expiresAt: new Date(now.getTime() + 86_400_000),
    rejectionReason: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function createFakeDatabase({
  categories = [categoryRow()],
  requirements = [requirementRow()],
  profile = null,
  verifications = [],
  uniqueViolation = false,
} = {}) {
  const state = { inserts: [], audits: [] };
  const database = {
    select: (fields) => ({
      from: (table) => {
        if (fields?.total) {
          return { where: async () => [{ total: requirements.length }] };
        }

        if (fields?.verification) {
          return {
            innerJoin: () => ({
              where: () => ({ orderBy: async () => verifications }),
            }),
          };
        }

        const rows =
          table === serviceCategories
            ? categories
            : table === providerProfiles
              ? profile
                ? [profile]
                : []
              : requirements;

        return {
          where: () => ({
            limit: async () => rows.slice(0, 1),
            orderBy: () => ({
              limit: () => ({ offset: async () => rows }),
            }),
          }),
        };
      },
    }),
    insert: (table) => ({
      values: (values) => ({
        returning: async () => {
          if (table === auditLogs) {
            state.audits.push(values);
            return [values];
          }

          if (uniqueViolation) {
            const error = new Error("duplicate key");
            error.code = "23505";
            throw error;
          }

          const row = { ...values, id: REQUIREMENT_ID };
          state.inserts.push(row);
          return [row];
        },
      }),
    }),
    transaction: async (callback) => callback(database),
  };

  return { database, state };
}

describe("verification requirement validation", () => {
  it("normalizes input and applies defaults", () => {
    expect(
      validateVerificationRequirementCreate({
        categoryId: CATEGORY_ID,
        name: "  Identity Proof  ",
        description: "  Government ID  ",
        documentType: "  identity_document  ",
      }),
    ).toEqual({
      categoryId: CATEGORY_ID,
      name: "Identity Proof",
      description: "Government ID",
      documentType: "identity_document",
      isRequired: true,
      validityMonths: null,
    });
  });

  it("rejects invalid category IDs and validity periods", () => {
    expect(() =>
      validateVerificationRequirementCreate({ categoryId: "not-a-uuid", name: "ID" }),
    ).toThrow("A valid category ID is required.");
    expect(() =>
      validateVerificationRequirementCreate({
        categoryId: CATEGORY_ID,
        name: "ID",
        validityMonths: 0,
      }),
    ).toThrow("Validity months must be an integer between 1 and 600.");
  });
});

describe("verification mapping", () => {
  it("omits admin fields from public and own-facing records", () => {
    const requirement = requirementRow({ documentType: null, validityMonths: null });

    expect(toPublicRequirement(requirement)).toEqual({
      id: REQUIREMENT_ID,
      categoryId: CATEGORY_ID,
      name: "Identity Proof",
      description: null,
      documentType: null,
      isRequired: true,
      validityMonths: null,
    });
    expect(toPublicRequirement(requirement)).not.toHaveProperty("isActive");

    const record = toOwnVerification(verificationRow(), requirement);

    expect(record).toMatchObject({
      id: VERIFICATION_ID,
      requirementId: REQUIREMENT_ID,
      status: "approved",
    });
    expect(record.requirement.name).toBe("Identity Proof");
    expect(record).not.toHaveProperty("documentObjectKey");
    expect(record).not.toHaveProperty("reviewedByAdminProfileId");
  });
});

describe("verification errors", () => {
  it("exposes a sanitizable conflict code and status", () => {
    const error = new VerificationConflictError();

    expect([error.code, error.status]).toEqual([
      "VERIFICATION_REQUIREMENT_EXISTS",
      409,
    ]);
  });
});

describe("listRequirementsByCategory", () => {
  it("returns active requirements with pagination totals", async () => {
    const { database } = createFakeDatabase();

    await expect(
      listRequirementsByCategory(CATEGORY_ID, { limit: 5, offset: 1 }, { database }),
    ).resolves.toEqual({
      items: [toPublicRequirement(requirementRow())],
      total: 1,
    });
  });

  it("rejects inactive or missing categories", async () => {
    const { database } = createFakeDatabase({ categories: [] });

    await expect(
      listRequirementsByCategory(CATEGORY_ID, {}, { database }),
    ).rejects.toBeInstanceOf(CatalogNotFoundError);
  });
});

describe("createVerificationRequirement", () => {
  const input = validateVerificationRequirementCreate({
    categoryId: CATEGORY_ID,
    name: "Identity Proof",
    documentType: "identity_document",
    validityMonths: 60,
  });

  it("inserts a requirement and records an audited admin action", async () => {
    const { database, state } = createFakeDatabase({ requirements: [] });

    const created = await createVerificationRequirement(input, {
      database,
      actorAdminProfileId: ADMIN_PROFILE_ID,
      requestId: "req-verification-create",
    });

    expect(state.inserts).toEqual([
      expect.objectContaining({ name: "Identity Proof", validityMonths: 60 }),
    ]);
    expect(state.audits).toEqual([
      expect.objectContaining({
        actorAdminProfileId: ADMIN_PROFILE_ID,
        action: AUDIT_ACTIONS.VERIFICATION_REQUIREMENT_CREATE,
        entityType: "verification_requirement",
        entityId: REQUIREMENT_ID,
        requestId: "req-verification-create",
      }),
    ]);
    expect(created.id).toBe(REQUIREMENT_ID);
  });

  it("maps duplicate requirement names to a conflict", async () => {
    const { database, state } = createFakeDatabase({ uniqueViolation: true });

    await expect(
      createVerificationRequirement(input, { database }),
    ).rejects.toBeInstanceOf(VerificationConflictError);
    expect(state.audits).toEqual([]);
  });

  it("rejects a category that is not active", async () => {
    const { database, state } = createFakeDatabase({ categories: [] });

    await expect(
      createVerificationRequirement(input, { database }),
    ).rejects.toBeInstanceOf(CatalogNotFoundError);
    expect(state.inserts).toEqual([]);
  });
});

describe("listOwnVerifications", () => {
  const user = { id: USER_ID };

  it("returns the provider's records with requirement details", async () => {
    const verification = verificationRow();
    const requirement = requirementRow();
    const { database } = createFakeDatabase({
      profile: { id: PROFILE_ID, userId: USER_ID },
      verifications: [{ verification, requirement }],
    });

    await expect(listOwnVerifications(user, { database })).resolves.toEqual([
      toOwnVerification(verification, requirement),
    ]);
  });

  it("returns 404 when the user has no provider profile", async () => {
    const { database } = createFakeDatabase();

    await expect(listOwnVerifications(user, { database })).rejects.toBeInstanceOf(
      ProviderProfileNotFoundError,
    );
  });
});
