import "dotenv/config";
import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { NextRequest } from "next/server";
import { generate } from "otplib";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { POST as complete } from "@/app/api/v1/uploads/complete/route.js";
import { POST as presign } from "@/app/api/v1/uploads/presign/route.js";
import { GET as download } from "@/app/api/v1/files/[id]/download/route.js";
import { POST as register } from "@/app/api/v1/auth/register/route.js";
import { POST as mfaVerify } from "@/app/api/v1/auth/mfa/verify/route.js";
import { getDb } from "@/lib/db/client.js";
import {
  providerProfiles,
  providerVerifications,
  serviceCategories,
  verificationRequirements,
} from "@/lib/db/schema/providers.js";
import { rateLimitCounters } from "@/lib/db/schema/rate-limits.js";
import { uploads } from "@/lib/db/schema/uploads.js";
import { adminProfiles, users } from "@/lib/db/schema/users.js";
import { resetMockStorage } from "@/infrastructure/storage/index.js";
import { SESSION_COOKIE_NAME } from "@/modules/auth/session-cookie.js";
import { confirmMfa, enrollMfa } from "@/modules/auth/mfa.service.js";

const databaseUrl = process.env.DATABASE_URL;
const originalSecret = process.env.SESSION_SECRET;
const originalDriver = process.env.STORAGE_DRIVER;
const createdUserIds = [];
const createdProfileIds = [];
const createdCategoryIds = [];
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
        email: `m34-${label}-${randomUUID()}@example.com`,
        password,
        fullName: "M3.4 Test User",
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

describe.skipIf(!databaseUrl)("upload endpoints", () => {
  let provider;
  let other;
  let admin;
  let verification;

  beforeAll(async () => {
    process.env.SESSION_SECRET = "integration-session-secret-long-enough";
    process.env.STORAGE_DRIVER = "mock";
    resetMockStorage();
    provider = await registerUser("provider");
    other = await registerUser("other");
    admin = await registerUser("admin");
    await makeAdmin(admin);

    const [category] = await getDb()
      .insert(serviceCategories)
      .values({ name: `Category ${randomUUID()}`, slug: `m34-${randomUUID()}` })
      .returning();
    createdCategoryIds.push(category.id);
    const [requirement] = await getDb()
      .insert(verificationRequirements)
      .values({ categoryId: category.id, name: `Requirement ${randomUUID()}` })
      .returning();
    createdRequirementIds.push(requirement.id);
    const [profile] = await getDb()
      .insert(providerProfiles)
      .values({ userId: provider.id, displayName: "Upload Provider", status: "approved" })
      .returning();
    createdProfileIds.push(profile.id);
    const [row] = await getDb()
      .insert(providerVerifications)
      .values({ providerProfileId: profile.id, requirementId: requirement.id })
      .returning();
    verification = row;
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
      await getDb()
        .delete(uploads)
        .where(inArray(uploads.userId, createdUserIds));
      await getDb()
        .delete(rateLimitCounters)
        .where(inArray(rateLimitCounters.subject, createdUserIds));
      await getDb().delete(users).where(inArray(users.id, createdUserIds));
    }
    resetMockStorage();

    if (originalDriver === undefined) {
      delete process.env.STORAGE_DRIVER;
    } else {
      process.env.STORAGE_DRIVER = originalDriver;
    }
    if (originalSecret === undefined) {
      delete process.env.SESSION_SECRET;
    } else {
      process.env.SESSION_SECRET = originalSecret;
    }
  }, 60_000);

  it("presigns, completes, and authorizes downloads", async () => {
    const presignResponse = await presign(
      apiRequest("http://localhost/api/v1/uploads/presign", {
        method: "POST",
        token: provider.token,
        body: {
          purpose: "verification_document",
          relatedEntityId: verification.id,
          fileName: "identity.pdf",
          mimeType: "application/pdf",
          sizeBytes: 1024,
        },
      }),
    );
    const presignPayload = await presignResponse.json();

    expect(presignResponse.status).toBe(201);
    expect(presignPayload.data.method).toBe("PUT");
    expect(presignPayload.data.url).toContain("https://storage.mock/");
    expect(presignPayload.data.status).toBe("pending");

    const uploadId = presignPayload.data.id;
    const [row] = await getDb()
      .select()
      .from(uploads)
      .where(eq(uploads.id, uploadId));

    expect(row.objectKey).toMatch(
      /^verification-documents\/[0-9a-f-]+\/[0-9a-f-]+\/[0-9a-f-]+\.pdf$/,
    );

    const wrongUserResponse = await complete(
      apiRequest("http://localhost/api/v1/uploads/complete", {
        method: "POST",
        token: other.token,
        body: { uploadId },
      }),
    );

    expect(wrongUserResponse.status).toBe(404);

    const completeResponse = await complete(
      apiRequest("http://localhost/api/v1/uploads/complete", {
        method: "POST",
        token: provider.token,
        body: { uploadId },
      }),
    );
    const completePayload = await completeResponse.json();

    expect(completeResponse.status).toBe(200);
    expect(completePayload.data.status).toBe("completed");
    const [updatedVerification] = await getDb()
      .select()
      .from(providerVerifications)
      .where(eq(providerVerifications.id, verification.id));

    expect(updatedVerification.documentObjectKey).toBe(row.objectKey);

    const ownerDownloadResponse = await download(
      apiRequest(`http://localhost/api/v1/files/${uploadId}/download`, {
        token: provider.token,
      }),
      { params: { id: uploadId } },
    );
    const ownerDownloadPayload = await ownerDownloadResponse.json();

    expect(ownerDownloadResponse.status).toBe(200);
    expect(ownerDownloadPayload.data.url).toContain("https://storage.mock/");

    const forbiddenResponse = await download(
      apiRequest(`http://localhost/api/v1/files/${uploadId}/download`, {
        token: other.token,
      }),
      { params: { id: uploadId } },
    );

    expect(forbiddenResponse.status).toBe(403);

    const adminDownloadResponse = await download(
      apiRequest(`http://localhost/api/v1/files/${uploadId}/download`, {
        token: admin.token,
      }),
      { params: { id: uploadId } },
    );

    expect(adminDownloadResponse.status).toBe(200);

    const duplicateResponse = await complete(
      apiRequest("http://localhost/api/v1/uploads/complete", {
        method: "POST",
        token: provider.token,
        body: { uploadId },
      }),
    );

    expect(duplicateResponse.status).toBe(409);
  }, 60_000);

  it("rejects invalid presign requests before creating an upload", async () => {
    const invalidType = await presign(
      apiRequest("http://localhost/api/v1/uploads/presign", {
        method: "POST",
        token: provider.token,
        body: {
          purpose: "verification_document",
          relatedEntityId: verification.id,
          fileName: "script.html",
          mimeType: "text/html",
          sizeBytes: 1024,
        },
      }),
    );

    expect(invalidType.status).toBe(422);

    const oversized = await presign(
      apiRequest("http://localhost/api/v1/uploads/presign", {
        method: "POST",
        token: provider.token,
        body: {
          purpose: "verification_document",
          relatedEntityId: verification.id,
          fileName: "identity.pdf",
          mimeType: "application/pdf",
          sizeBytes: 11 * 1024 * 1024,
        },
      }),
    );

    expect(oversized.status).toBe(413);

    const wrongTarget = await presign(
      apiRequest("http://localhost/api/v1/uploads/presign", {
        method: "POST",
        token: provider.token,
        body: {
          purpose: "verification_document",
          relatedEntityId: randomUUID(),
          fileName: "identity.pdf",
          mimeType: "application/pdf",
          sizeBytes: 1024,
        },
      }),
    );

    expect(wrongTarget.status).toBe(404);

    const anonymous = await presign(
      apiRequest("http://localhost/api/v1/uploads/presign", {
        method: "POST",
        body: {
          purpose: "verification_document",
          relatedEntityId: verification.id,
          fileName: "identity.pdf",
          mimeType: "application/pdf",
          sizeBytes: 1024,
        },
      }),
    );

    expect(anonymous.status).toBe(401);
  }, 60_000);
});
