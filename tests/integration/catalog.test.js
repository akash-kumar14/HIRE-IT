import "dotenv/config";
import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { generate } from "otplib";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { GET as listCategories } from "@/app/api/v1/categories/route.js";
import {
  GET as listCategorySkills,
} from "@/app/api/v1/categories/[id]/skills/route.js";
import {
  POST as createCategoryRoute,
} from "@/app/api/v1/admin/categories/route.js";
import {
  PATCH as updateCategoryRoute,
} from "@/app/api/v1/admin/categories/[id]/route.js";
import { POST as createSkillRoute } from "@/app/api/v1/admin/skills/route.js";
import {
  PATCH as updateSkillRoute,
} from "@/app/api/v1/admin/skills/[id]/route.js";
import { POST as login } from "@/app/api/v1/auth/login/route.js";
import { POST as mfaVerify } from "@/app/api/v1/auth/mfa/verify/route.js";
import { POST as register } from "@/app/api/v1/auth/register/route.js";
import { getDb } from "@/lib/db/client.js";
import { adminProfiles, auditLogs, users } from "@/lib/db/schema/users.js";
import { serviceCategories, skills } from "@/lib/db/schema/providers.js";
import { SESSION_COOKIE_NAME } from "@/modules/auth/session-cookie.js";
import {
  confirmMfa,
  enrollMfa,
} from "@/modules/auth/mfa.service.js";

const databaseUrl = process.env.DATABASE_URL;
const originalSecret = process.env.SESSION_SECRET;
const createdUserIds = [];
const createdCategoryIds = [];
const createdSkillIds = [];
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
        email: `m31-${label}-${randomUUID()}@example.com`,
        password,
        fullName: "M3.1 Test User",
      },
    }),
  );
  const payload = await response.json();
  const token = response.cookies.get(SESSION_COOKIE_NAME)?.value;

  expect(response.status).toBe(201);
  createdUserIds.push(payload.data.id);

  return { ...payload.data, token, password };
}

async function makeAdmin(user) {
  await getDb()
    .update(users)
    .set({ emailVerifiedAt: new Date() })
    .where(inArray(users.id, [user.id]));
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

async function postCategory(token, label) {
  const response = await createCategoryRoute(
    apiRequest("http://localhost/api/v1/admin/categories", {
      method: "POST",
      body: {
        name: `Category ${label}`,
        slug: `m31-${label}`,
      },
      token,
    }),
  );
  const payload = await response.json();

  expect(response.status).toBe(201);
  createdCategoryIds.push(payload.data.id);

  return payload.data;
}

async function postSkill(token, categoryId, label) {
  const response = await createSkillRoute(
    apiRequest("http://localhost/api/v1/admin/skills", {
      method: "POST",
      body: {
        categoryId,
        name: `Skill ${label}`,
        slug: `m31-skill-${label}`,
      },
      token,
    }),
  );
  const payload = await response.json();

  expect(response.status).toBe(201);
  createdSkillIds.push(payload.data.id);

  return payload.data;
}

describe.skipIf(!databaseUrl)("catalog endpoints", () => {
  let admin;
  let customer;
  let unverifiedToken;
  let category;
  let skill;
  let temporaryCategory;

  beforeAll(async () => {
    process.env.SESSION_SECRET = "integration-session-secret-long-enough";
    admin = await registerUser("admin");
    admin.adminProfileId = await makeAdmin(admin);
    customer = await registerUser("customer");
    unverifiedToken = await loginUser(admin);
    category = await postCategory(admin.token, randomUUID());
    skill = await postSkill(admin.token, category.id, randomUUID());
    temporaryCategory = await postCategory(admin.token, randomUUID());
  }, 60_000);

  afterAll(async () => {
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

  it("exposes active categories and skills publicly", async () => {
    const categoriesResponse = await listCategories(
      apiRequest("http://localhost/api/v1/categories?limit=100"),
    );
    const categoriesPayload = await categoriesResponse.json();
    const publicCategory = categoriesPayload.data.find(
      (entry) => entry.id === category.id,
    );

    expect(categoriesResponse.status).toBe(200);
    expect(categoriesPayload.meta.pagination).toEqual({
      limit: 100,
      offset: 0,
      total: categoriesPayload.meta.pagination.total,
    });
    expect(publicCategory).toEqual({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: null,
      sortOrder: 0,
    });

    const skillsResponse = await listCategorySkills(
      apiRequest(`http://localhost/api/v1/categories/${category.id}/skills`),
      { params: Promise.resolve({ id: category.id }) },
    );
    const skillsPayload = await skillsResponse.json();

    expect(skillsResponse.status).toBe(200);
    expect(skillsPayload.data).toEqual([
      {
        id: skill.id,
        categoryId: category.id,
        name: skill.name,
        slug: skill.slug,
        description: null,
      },
    ]);
  });

  it("deactivates categories without deleting them and hides them publicly", async () => {
    const response = await updateCategoryRoute(
      apiRequest(`http://localhost/api/v1/admin/categories/${temporaryCategory.id}`, {
        method: "PATCH",
        body: { isActive: false },
        token: admin.token,
      }),
      { params: Promise.resolve({ id: temporaryCategory.id }) },
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.isActive).toBe(false);

    const publicResponse = await listCategories(
      apiRequest("http://localhost/api/v1/categories?limit=100"),
    );
    const publicPayload = await publicResponse.json();

    expect(
      publicPayload.data.some((entry) => entry.id === temporaryCategory.id),
    ).toBe(false);

    const skillsResponse = await listCategorySkills(
      apiRequest(
        `http://localhost/api/v1/categories/${temporaryCategory.id}/skills`,
      ),
      { params: Promise.resolve({ id: temporaryCategory.id }) },
    );

    expect(skillsResponse.status).toBe(404);

    const [audit] = await getDb()
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.entityId, temporaryCategory.id),
          eq(auditLogs.action, "admin.category.update"),
        ),
      );

    expect(audit.actorAdminProfileId).toBe(admin.adminProfileId);
    expect(audit.requestId).toBeTruthy();
  });

  it("deactivates skills without deleting them and hides them publicly", async () => {
    const temporarySkill = await postSkill(admin.token, category.id, randomUUID());
    const response = await updateSkillRoute(
      apiRequest(`http://localhost/api/v1/admin/skills/${temporarySkill.id}`, {
        method: "PATCH",
        body: { isActive: false },
        token: admin.token,
      }),
      { params: Promise.resolve({ id: temporarySkill.id }) },
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.isActive).toBe(false);

    const publicResponse = await listCategorySkills(
      apiRequest(`http://localhost/api/v1/categories/${category.id}/skills`),
      { params: Promise.resolve({ id: category.id }) },
    );
    const publicPayload = await publicResponse.json();

    expect(publicPayload.data.map((entry) => entry.id)).toEqual([skill.id]);

    const [audit] = await getDb()
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.entityId, temporarySkill.id),
          eq(auditLogs.action, "admin.skill.update"),
        ),
      );

    expect(audit.actorAdminProfileId).toBe(admin.adminProfileId);
  });

  it("rejects non-admins and admin sessions without verified MFA", async () => {
    const customerResponse = await createCategoryRoute(
      apiRequest("http://localhost/api/v1/admin/categories", {
        method: "POST",
        body: { name: "Forbidden", slug: "m31-forbidden" },
        token: customer.token,
      }),
    );

    expect(customerResponse.status).toBe(403);
    expect((await customerResponse.json()).error.code).toBe(
      "ADMIN_ACCESS_REQUIRED",
    );

    const unverifiedResponse = await createCategoryRoute(
      apiRequest("http://localhost/api/v1/admin/categories", {
        method: "POST",
        body: { name: "Needs MFA", slug: "m31-needs-mfa" },
        token: unverifiedToken,
      }),
    );

    expect(unverifiedResponse.status).toBe(403);
    expect((await unverifiedResponse.json()).error.code).toBe("MFA_REQUIRED");
  });

  it("rejects duplicates, malformed input, and unknown resources", async () => {
    const duplicateCategory = await createCategoryRoute(
      apiRequest("http://localhost/api/v1/admin/categories", {
        method: "POST",
        body: { name: "Duplicate category", slug: category.slug },
        token: admin.token,
      }),
    );

    expect(duplicateCategory.status).toBe(409);
    expect((await duplicateCategory.json()).error.code).toBe("CATEGORY_EXISTS");

    const duplicateSkill = await createSkillRoute(
      apiRequest("http://localhost/api/v1/admin/skills", {
        method: "POST",
        body: {
          categoryId: category.id,
          name: "Duplicate skill",
          slug: skill.slug,
        },
        token: admin.token,
      }),
    );

    expect(duplicateSkill.status).toBe(409);
    expect((await duplicateSkill.json()).error.code).toBe("SKILL_EXISTS");

    const invalidSlug = await createCategoryRoute(
      apiRequest("http://localhost/api/v1/admin/categories", {
        method: "POST",
        body: { name: "Invalid", slug: "Bad_Slug" },
        token: admin.token,
      }),
    );

    expect(invalidSlug.status).toBe(422);
    expect((await invalidSlug.json()).error.code).toBe("VALIDATION_ERROR");

    const unknownId = randomUUID();
    const missingCategory = await updateCategoryRoute(
      apiRequest(`http://localhost/api/v1/admin/categories/${unknownId}`, {
        method: "PATCH",
        body: { isActive: false },
        token: admin.token,
      }),
      { params: Promise.resolve({ id: unknownId }) },
    );

    expect(missingCategory.status).toBe(404);
    expect((await missingCategory.json()).error.code).toBe("NOT_FOUND");
  });
});
