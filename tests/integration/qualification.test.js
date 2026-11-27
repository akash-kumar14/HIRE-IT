import "dotenv/config";
import { randomUUID } from "node:crypto";
import { inArray } from "drizzle-orm";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { POST as register } from "@/app/api/v1/auth/register/route.js";
import {
  PATCH as patchAvailability,
} from "@/app/api/v1/providers/me/availability/route.js";
import {
  PUT as putWeeklyAvailability,
} from "@/app/api/v1/providers/me/availability/weekly/route.js";
import {
  GET as getOwnVerifications,
} from "@/app/api/v1/providers/me/verifications/route.js";
import { getDb } from "@/lib/db/client.js";
import { providerAvailability } from "@/lib/db/schema/bookings.js";
import {
  providerProfiles,
  providerServiceAreas,
  providerVerifications,
  serviceCategories,
  verificationRequirements,
} from "@/lib/db/schema/providers.js";
import { users } from "@/lib/db/schema/users.js";
import { SESSION_COOKIE_NAME } from "@/modules/auth/session-cookie.js";

const databaseUrl = process.env.DATABASE_URL;
const originalSecret = process.env.SESSION_SECRET;
const createdUserIds = [];
const createdProfileIds = [];
const createdCategoryIds = [];
const createdRequirementIds = [];
const password = "Password123!";
const PAST = new Date("2020-01-01T00:00:00.000Z");
const FUTURE = new Date("2099-01-01T00:00:00.000Z");

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
        email: `m37-${label}-${randomUUID()}@example.com`,
        password,
        fullName: "M3.7 Test User",
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

async function createProvider(label, status, requirementId, expiresAt = null) {
  const user = await registerUser(label);
  const [profile] = await getDb()
    .insert(providerProfiles)
    .values({
      userId: user.id,
      displayName: `Provider ${label}`,
      bio: "Home services",
      status,
      isAvailable: false,
      submittedAt: new Date(),
      approvedAt: status === "approved" ? new Date() : null,
    })
    .returning();

  createdProfileIds.push(profile.id);

  if (expiresAt) {
    await getDb().insert(providerVerifications).values({
      providerProfileId: profile.id,
      requirementId,
      status: "approved",
      verifiedAt: PAST,
      reviewedAt: PAST,
      expiresAt,
      documentObjectKey: `verification-documents/${profile.id}/private.pdf`,
    });
  }

  return { ...user, profileId: profile.id };
}

const weeklyInput = {
  slots: [
    {
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "18:00",
      timezone: "Asia/Kolkata",
    },
  ],
};

describe.skipIf(!databaseUrl)("qualification expiry and M3 acceptance", () => {
  let expiredProvider;
  let currentProvider;
  let pendingProvider;

  beforeAll(async () => {
    process.env.SESSION_SECRET = "integration-session-secret-long-enough";
    const [category] = await getDb()
      .insert(serviceCategories)
      .values({ name: `Category ${randomUUID()}`, slug: `m37-${randomUUID()}` })
      .returning();
    createdCategoryIds.push(category.id);
    const [requirement] = await getDb()
      .insert(verificationRequirements)
      .values({ categoryId: category.id, name: `Requirement ${randomUUID()}` })
      .returning();
    createdRequirementIds.push(requirement.id);

    expiredProvider = await createProvider(
      "expired",
      "approved",
      requirement.id,
      PAST,
    );
    currentProvider = await createProvider(
      "current",
      "approved",
      requirement.id,
      FUTURE,
    );
    pendingProvider = await createProvider("pending", "pending", requirement.id);
  }, 60_000);

  afterAll(async () => {
    if (createdProfileIds.length > 0) {
      await getDb()
        .delete(providerAvailability)
        .where(inArray(providerAvailability.providerProfileId, createdProfileIds));
      await getDb()
        .delete(providerVerifications)
        .where(inArray(providerVerifications.providerProfileId, createdProfileIds));
      await getDb()
        .delete(providerServiceAreas)
        .where(inArray(providerServiceAreas.providerProfileId, createdProfileIds));
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

  it("reports expired qualifications without exposing private documents", async () => {
    const response = await getOwnVerifications(
      apiRequest("http://localhost/api/v1/providers/me/verifications", {
        token: expiredProvider.token,
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data).toHaveLength(1);
    expect(payload.data[0]).toMatchObject({ status: "expired", isExpired: true });
    expect(payload.data[0]).not.toHaveProperty("documentObjectKey");
    expect(payload.data[0]).not.toHaveProperty("reviewedByAdminProfileId");
    expect(JSON.stringify(payload)).not.toContain("verification-documents");
  });

  it("blocks availability writes for expired qualifications but allows current ones", async () => {
    const expiredToggle = await patchAvailability(
      apiRequest("http://localhost/api/v1/providers/me/availability", {
        method: "PATCH",
        token: expiredProvider.token,
        body: { isAvailable: true },
      }),
    );

    expect(expiredToggle.status).toBe(403);
    expect((await expiredToggle.json()).error.code).toBe("QUALIFICATION_EXPIRED");

    const expiredWeekly = await putWeeklyAvailability(
      apiRequest("http://localhost/api/v1/providers/me/availability/weekly", {
        method: "PUT",
        token: expiredProvider.token,
        body: weeklyInput,
      }),
    );

    expect(expiredWeekly.status).toBe(403);

    const expiredDisable = await patchAvailability(
      apiRequest("http://localhost/api/v1/providers/me/availability", {
        method: "PATCH",
        token: expiredProvider.token,
        body: { isAvailable: false },
      }),
    );

    expect(expiredDisable.status).toBe(200);

    const currentToggle = await patchAvailability(
      apiRequest("http://localhost/api/v1/providers/me/availability", {
        method: "PATCH",
        token: currentProvider.token,
        body: { isAvailable: true },
      }),
    );

    expect(currentToggle.status).toBe(200);
    expect((await currentToggle.json()).data.isAvailable).toBe(true);

    const currentWeekly = await putWeeklyAvailability(
      apiRequest("http://localhost/api/v1/providers/me/availability/weekly", {
        method: "PUT",
        token: currentProvider.token,
        body: weeklyInput,
      }),
    );

    expect(currentWeekly.status).toBe(200);
    expect((await currentWeekly.json()).data.weeklySlots).toHaveLength(1);
  });

  it("keeps unapproved providers from enabling availability", async () => {
    const response = await patchAvailability(
      apiRequest("http://localhost/api/v1/providers/me/availability", {
        method: "PATCH",
        token: pendingProvider.token,
        body: { isAvailable: true },
      }),
    );

    expect(response.status).toBe(403);
    expect((await response.json()).error.code).toBe("PROVIDER_NOT_APPROVED");
  });
});
