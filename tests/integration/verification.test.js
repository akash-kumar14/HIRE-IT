import "dotenv/config";
import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { generate } from "otplib";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { POST as login } from "@/app/api/v1/auth/login/route.js";
import { POST as mfaVerify } from "@/app/api/v1/auth/mfa/verify/route.js";
import { POST as register } from "@/app/api/v1/auth/register/route.js";
import {
  POST as createRequirement,
} from "@/app/api/v1/admin/verification-requirements/route.js";
import {
  GET as listRequirements,
} from "@/app/api/v1/categories/[id]/requirements/route.js";
import {
  GET as ownVerifications,
} from "@/app/api/v1/providers/me/verifications/route.js";
import { getDb } from "@/lib/db/client.js";
import {
  providerProfiles,
  providerVerifications,
  serviceCategories,
  verificationRequirements,
} from "@/lib/db/schema/providers.js";
import { adminProfiles, auditLogs, users } from "@/lib/db/schema/users.js";
import { SESSION_COOKIE_NAME } from "@/modules/auth/session-cookie.js";
import {
  confirmMfa,
  enrollMfa,
} from "@/modules/auth/mfa.service.js";

const databaseUrl = process.env.DATABASE_URL;
const originalSecret = process.env.SESSION_SECRET;
const createdUserIds = [];
const createdCategoryIds = [];
const createdRequirementIds = [];
const createdProfileIds = [];
const password = "Password123!";

function apiRequest(url, { method = "GET", body, token } = {}) {
  const headers = {};

  if (body !== undefined) headers["content-type"] = "application/json";
  if (token) headers.cookie = `${SESSION_COOKIE_NAME}=${token}`;

  return new NextRequest(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function registerUser(label) {
  const response = await register(
    apiRequest("http://localhost/api/v1/auth/register", {
      method: "POST",
      body: {
        email: `m33-${label}-${randomUUID()}@example.com`,
        password,
        fullName: "M3.3 Test User",
      },
    }),
  );
  const payload = await response.json();

  expect(response.status).toBe(201);
  createdUserIds.push(payload.data.id);

  return { ...payload.data, token: response.cookies.get(SESSION_COOKIE_NAME)?.value };
}

async function makeAdmin(user) {
  await getDb()
    .update(users)
    .set({ emailVerifiedAt: new Date() })
    .where(eq(users.id, user.id));
  const [profile] = await getDb()
    .insert(adminProfiles)
    .values({ userId: user.id, role: "admin" })
    .returning();
  const enrollment = await enrollMfa({
    adminProfileId: profile.id,
    email: user.email,
  });

  await confirmMfa({
    adminProfileId: profile.id,
    code: await generate({ secret: enrollment.secret }),
  });

  const response = await mfaVerify(
    apiRequest("http://localhost/api/v1/auth/mfa/verify", {
      method: "POST",
      body: { code: await generate({ secret: enrollment.secret }) },
      token: user.token,
    }),
  );

  expect(response.status).toBe(200);

  return profile.id;
}

async function loginUser(user) {
  const response = await login(
    apiRequest("http://localhost/api/v1/auth/login", {
      method: "POST",
      body: { email: user.email, password },
    }),
  );

  expect(response.status).toBe(200);

  return response.cookies.get(SESSION_COOKIE_NAME)?.value;
}

async function createCategory(label) {
  const [category] = await getDb()
    .insert(serviceCategories)
    .values({
      name: `Category ${label}`,
      slug: `m33-${label}`,
      isActive: true,
    })
    .returning();

  createdCategoryIds.push(category.id);

  return category;
}

function postRequirement(token, categoryId, name) {
  return createRequirement(
    apiRequest("http://localhost/api/v1/admin/verification-requirements", {
      method: "POST",
      body: {
        categoryId,
        name,
        description: "Government-issued identity document",
        documentType: "identity_document",
        isRequired: true,
        validityMonths: 60,
      },
      token,
    }),
  );
}

describe.skipIf(!databaseUrl)("verification endpoints", () => {
  let admin;
  let customer;
  let noProfile;
  let unmfaToken;
  let category;
  let requirement;

  beforeAll(async () => {
    process.env.SESSION_SECRET = "integration-session-secret-long-enough";
    admin = await registerUser("admin");
    admin.adminProfileId = await makeAdmin(admin);
    unmfaToken = await loginUser(admin);
    customer = await registerUser("customer");
    noProfile = await registerUser("no-profile");
    category = await createCategory(randomUUID());
    const response = await postRequirement(
      admin.token,
      category.id,
      `Identity Proof ${randomUUID()}`,
    );
    const payload = await response.json();

    expect(response.status).toBe(201);
    createdRequirementIds.push(payload.data.id);
    requirement = payload.data;
  }, 60_000);

  afterAll(async () => {
    if (createdProfileIds.length > 0) {
      await getDb()
        .delete(providerVerifications)
        .where(inArray(providerVerifications.providerProfileId, createdProfileIds));
      await getDb()
        .delete(providerProfiles)
        .where(inArray(providerProfiles.id, createdProfileIds));
    }
    if (createdRequirementIds.length > 0) {
      await getDb()
        .delete(verificationRequirements)
        .where(inArray(verificationRequirements.id, createdRequirementIds));
    }
    if (createdCategoryIds.length > 0) {
      await getDb()
        .delete(serviceCategories)
        .where(inArray(serviceCategories.id, createdCategoryIds));
    }
    if (createdUserIds.length > 0) {
      await getDb().delete(users).where(inArray(users.id, createdUserIds));
    }

    if (originalSecret === undefined) {
      delete process.env.SESSION_SECRET;
    } else {
      process.env.SESSION_SECRET = originalSecret;
    }
  }, 60_000);

  it("creates requirements with an audit record and rejects duplicates", async () => {
    expect(requirement).toMatchObject({
      categoryId: category.id,
      documentType: "identity_document",
      isRequired: true,
      validityMonths: 60,
      isActive: true,
    });

    const [event] = await getDb()
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.entityId, requirement.id))
      .limit(1);

    expect(event.action).toBe("admin.verification_requirement.create");
    expect(event.entityType).toBe("verification_requirement");
    expect(event.actorUserId).toBe(admin.id);

    const duplicate = await postRequirement(admin.token, category.id, requirement.name);

    expect(duplicate.status).toBe(409);
    expect((await duplicate.json()).error.code).toBe(
      "VERIFICATION_REQUIREMENT_EXISTS",
    );
  });

  it("rejects unauthorized and invalid requirement creation", async () => {
    const customerResponse = await postRequirement(
      customer.token,
      category.id,
      "Customer Requirement",
    );
    const noMfaResponse = await postRequirement(
      unmfaToken,
      category.id,
      "No MFA Requirement",
    );
    const missingCategory = await postRequirement(
      admin.token,
      randomUUID(),
      "Missing Category Requirement",
    );

    expect(customerResponse.status).toBe(403);
    expect((await customerResponse.json()).error.code).toBe(
      "ADMIN_ACCESS_REQUIRED",
    );
    expect(noMfaResponse.status).toBe(403);
    expect((await noMfaResponse.json()).error.code).toBe("MFA_REQUIRED");
    expect(missingCategory.status).toBe(404);
    expect((await missingCategory.json()).error.code).toBe("NOT_FOUND");
  });

  it("lists only active requirements for an active category", async () => {
    const [inactive] = await getDb()
      .insert(verificationRequirements)
      .values({
        categoryId: category.id,
        name: `Inactive Requirement ${randomUUID()}`,
        isActive: false,
      })
      .returning();
    createdRequirementIds.push(inactive.id);

    const response = await listRequirements(
      apiRequest(
        `http://localhost/api/v1/categories/${category.id}/requirements?limit=10`,
      ),
      { params: Promise.resolve({ id: category.id }) },
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data).toHaveLength(1);
    expect(payload.data[0]).toEqual({
      id: requirement.id,
      categoryId: category.id,
      name: requirement.name,
      description: "Government-issued identity document",
      documentType: "identity_document",
      isRequired: true,
      validityMonths: 60,
    });
    expect(payload.meta.pagination).toMatchObject({ limit: 10, offset: 0, total: 1 });
    expect(payload.data.map((item) => item.id)).not.toContain(inactive.id);
  });

  it("returns 404 for requirements of an inactive category", async () => {
    const [inactiveCategory] = await getDb()
      .insert(serviceCategories)
      .values({
        name: `Inactive Category ${randomUUID()}`,
        slug: `m33-inactive-${randomUUID()}`,
        isActive: false,
      })
      .returning();
    createdCategoryIds.push(inactiveCategory.id);

    const response = await listRequirements(
      apiRequest(
        `http://localhost/api/v1/categories/${inactiveCategory.id}/requirements`,
      ),
      { params: Promise.resolve({ id: inactiveCategory.id }) },
    );

    expect(response.status).toBe(404);
    expect((await response.json()).error.code).toBe("NOT_FOUND");
  });

  it("exposes own verification records without private document keys", async () => {
    await getDb()
      .update(users)
      .set({ emailVerifiedAt: new Date() })
      .where(eq(users.id, customer.id));
    const [profile] = await getDb()
      .insert(providerProfiles)
      .values({ userId: customer.id, displayName: "Verified Provider" })
      .returning();
    createdProfileIds.push(profile.id);

    const verifiedAt = new Date();
    const [record] = await getDb()
      .insert(providerVerifications)
      .values({
        providerProfileId: profile.id,
        requirementId: requirement.id,
        status: "approved",
        documentObjectKey: "private/identity-document.pdf",
        reviewedByAdminProfileId: admin.adminProfileId,
        verifiedAt,
        expiresAt: new Date(verifiedAt.getTime() + 86_400_000),
      })
      .returning();

    const response = await ownVerifications(
      apiRequest("http://localhost/api/v1/providers/me/verifications", {
        token: customer.token,
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data).toHaveLength(1);
    expect(payload.data[0]).toMatchObject({
      id: record.id,
      requirementId: requirement.id,
      status: "approved",
      isExpired: false,
      requirement: {
        id: requirement.id,
        name: requirement.name,
        documentType: "identity_document",
      },
    });
    expect(payload.data[0]).not.toHaveProperty("documentObjectKey");
    expect(payload.data[0]).not.toHaveProperty("reviewedByAdminProfileId");
  });

  it("rejects own verification reads for anonymous users and non-providers", async () => {
    const anonymous = await ownVerifications(
      apiRequest("http://localhost/api/v1/providers/me/verifications"),
    );
    const missingProfile = await ownVerifications(
      apiRequest("http://localhost/api/v1/providers/me/verifications", {
        token: noProfile.token,
      }),
    );

    expect(anonymous.status).toBe(401);
    expect((await anonymous.json()).error.code).toBe("AUTHENTICATION_REQUIRED");
    expect(missingProfile.status).toBe(404);
    expect((await missingProfile.json()).error.code).toBe(
      "PROVIDER_PROFILE_NOT_FOUND",
    );
  });
});
