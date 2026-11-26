import "dotenv/config";
import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { NextRequest } from "next/server";
import { generate } from "otplib";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  GET as listApplications,
} from "@/app/api/v1/admin/provider-applications/route.js";
import {
  GET as getApplication,
} from "@/app/api/v1/admin/provider-applications/[id]/route.js";
import {
  POST as approveApplication,
} from "@/app/api/v1/admin/provider-applications/[id]/approve/route.js";
import {
  POST as rejectApplication,
} from "@/app/api/v1/admin/provider-applications/[id]/reject/route.js";
import { POST as mfaVerify } from "@/app/api/v1/auth/mfa/verify/route.js";
import { POST as register } from "@/app/api/v1/auth/register/route.js";
import { getDb } from "@/lib/db/client.js";
import {
  providerProfiles,
  providerSkills,
  providerVerifications,
  serviceCategories,
  skills,
  verificationRequirements,
} from "@/lib/db/schema/providers.js";
import { adminProfiles, auditLogs, users } from "@/lib/db/schema/users.js";
import { AUDIT_ACTIONS } from "@/modules/audit/audit.service.js";
import { SESSION_COOKIE_NAME } from "@/modules/auth/session-cookie.js";
import { confirmMfa, enrollMfa } from "@/modules/auth/mfa.service.js";

const databaseUrl = process.env.DATABASE_URL;
const originalSecret = process.env.SESSION_SECRET;
const createdUserIds = [];
const createdProfileIds = [];
const createdCategoryIds = [];
const createdSkillIds = [];
const createdRequirementIds = [];
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
        email: `m35-${label}-${randomUUID()}@example.com`,
        password,
        fullName: "M3.5 Test User",
      },
    }),
  );
  const payload = await response.json();

  expect(response.status).toBe(201);
  createdUserIds.push(payload.data.id);

  return {
    ...payload.data,
    token: response.cookies.get(SESSION_COOKIE_NAME)?.value,
  };
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

async function createPendingApplication(label) {
  const user = await registerUser(label);
  const [profile] = await getDb()
    .insert(providerProfiles)
    .values({
      userId: user.id,
      displayName: `Provider ${label}`,
      bio: "Home services",
      status: "pending",
      submittedAt: new Date(),
    })
    .returning();

  createdProfileIds.push(profile.id);

  return { ...user, profileId: profile.id };
}

function listRequest(token, query = "status=pending&limit=10") {
  return apiRequest(
    `http://localhost/api/v1/admin/provider-applications?${query}`,
    { token },
  );
}

function detailRequest(token, id) {
  return apiRequest(`http://localhost/api/v1/admin/provider-applications/${id}`, {
    token,
  });
}

function contextFor(id) {
  return { params: { id } };
}

describe.skipIf(!databaseUrl)("admin application review endpoints", () => {
  let admin;
  let applicant;
  let secondApplicant;
  let skill;
  let requirement;

  beforeAll(async () => {
    process.env.SESSION_SECRET = "integration-session-secret-long-enough";
    admin = await registerUser("admin");
    await makeAdmin(admin);
    applicant = await createPendingApplication("applicant");
    secondApplicant = await createPendingApplication("second");

    const [category] = await getDb()
      .insert(serviceCategories)
      .values({ name: `Category ${randomUUID()}`, slug: `m35-${randomUUID()}` })
      .returning();
    createdCategoryIds.push(category.id);
    const [createdSkill] = await getDb()
      .insert(skills)
      .values({
        categoryId: category.id,
        name: `Skill ${randomUUID()}`,
        slug: `m35-skill-${randomUUID()}`,
      })
      .returning();
    skill = createdSkill;
    createdSkillIds.push(skill.id);
    const [createdRequirement] = await getDb()
      .insert(verificationRequirements)
      .values({ categoryId: category.id, name: `Requirement ${randomUUID()}` })
      .returning();
    requirement = createdRequirement;
    createdRequirementIds.push(requirement.id);

    await getDb().insert(providerSkills).values({
      providerProfileId: applicant.profileId,
      skillId: skill.id,
      yearsOfExperience: 4,
      isPrimary: true,
    });
    await getDb().insert(providerVerifications).values({
      providerProfileId: applicant.profileId,
      requirementId: requirement.id,
      status: "pending",
      documentObjectKey: "verification-documents/private.pdf",
    });
  }, 60_000);

  afterAll(async () => {
    if (createdProfileIds.length > 0) {
      await getDb()
        .delete(providerVerifications)
        .where(inArray(providerVerifications.providerProfileId, createdProfileIds));
      await getDb()
        .delete(providerSkills)
        .where(inArray(providerSkills.providerProfileId, createdProfileIds));
      await getDb()
        .delete(auditLogs)
        .where(inArray(auditLogs.entityId, createdProfileIds));
      await getDb()
        .delete(providerProfiles)
        .where(inArray(providerProfiles.id, createdProfileIds));
    }
    if (createdRequirementIds.length > 0) {
      await getDb()
        .delete(verificationRequirements)
        .where(inArray(verificationRequirements.id, createdRequirementIds));
    }
    if (createdSkillIds.length > 0) {
      await getDb().delete(skills).where(inArray(skills.id, createdSkillIds));
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

  it("requires MFA admin access for list and detail", async () => {
    const providerList = await listApplications(listRequest(applicant.token));

    expect(providerList.status).toBe(403);

    const adminList = await listApplications(listRequest(admin.token));
    const adminListPayload = await adminList.json();

    expect(adminList.status).toBe(200);
    expect(adminListPayload.meta.pagination).toMatchObject({
      status: "pending",
      limit: 10,
    });
    expect(adminListPayload.data.some((item) => item.id === applicant.profileId)).toBe(
      true,
    );

    const providerDetail = await getApplication(
      detailRequest(applicant.token, applicant.profileId),
      contextFor(applicant.profileId),
    );

    expect(providerDetail.status).toBe(403);

    const adminDetail = await getApplication(
      detailRequest(admin.token, applicant.profileId),
      contextFor(applicant.profileId),
    );

    expect(adminDetail.status).toBe(200);
    const detailPayload = await adminDetail.json();

    expect(detailPayload.data.applicant.email).toBe(applicant.email);
    expect(detailPayload.data.skills[0].name).toBe(skill.name);
    expect(detailPayload.data.verifications[0]).toMatchObject({
      requirementName: requirement.name,
      hasDocument: true,
    });
    expect(detailPayload.data.verifications[0].objectKey).toBeUndefined();
  }, 60_000);

  it("approves a pending application once and audits the decision", async () => {
    const response = await approveApplication(
      apiRequest(
        `http://localhost/api/v1/admin/provider-applications/${applicant.profileId}/approve`,
        {
          method: "POST",
          token: admin.token,
          body: { note: "Documents verified" },
        },
      ),
      contextFor(applicant.profileId),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data).toMatchObject({
      id: applicant.profileId,
      status: "approved",
    });
    expect(payload.data.approvedAt).toBeTruthy();

    const [event] = await getDb()
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.entityId, applicant.profileId));

    expect(event.action).toBe(AUDIT_ACTIONS.PROVIDER_APPLICATION_APPROVE);
    expect(event.actorAdminProfileId).toBeTruthy();
    expect(event.metadata).toEqual({ note: "Documents verified" });

    const duplicate = await approveApplication(
      apiRequest(
        `http://localhost/api/v1/admin/provider-applications/${applicant.profileId}/approve`,
        { method: "POST", token: admin.token, body: {} },
      ),
      contextFor(applicant.profileId),
    );

    expect(duplicate.status).toBe(409);
  }, 60_000);

  it("rejects with an audited reason and blocks later approval", async () => {
    const missingReason = await rejectApplication(
      apiRequest(
        `http://localhost/api/v1/admin/provider-applications/${secondApplicant.profileId}/reject`,
        { method: "POST", token: admin.token, body: {} },
      ),
      contextFor(secondApplicant.profileId),
    );

    expect(missingReason.status).toBe(422);

    const response = await rejectApplication(
      apiRequest(
        `http://localhost/api/v1/admin/provider-applications/${secondApplicant.profileId}/reject`,
        {
          method: "POST",
          token: admin.token,
          body: { reason: "Incomplete documents" },
        },
      ),
      contextFor(secondApplicant.profileId),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.status).toBe("rejected");

    const [event] = await getDb()
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.entityId, secondApplicant.profileId));

    expect(event.action).toBe(AUDIT_ACTIONS.PROVIDER_APPLICATION_REJECT);
    expect(event.metadata).toEqual({ reason: "Incomplete documents" });

    const laterApproval = await approveApplication(
      apiRequest(
        `http://localhost/api/v1/admin/provider-applications/${secondApplicant.profileId}/approve`,
        { method: "POST", token: admin.token, body: {} },
      ),
      contextFor(secondApplicant.profileId),
    );

    expect(laterApproval.status).toBe(409);
  }, 60_000);
});
