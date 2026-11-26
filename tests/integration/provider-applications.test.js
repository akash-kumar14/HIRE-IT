import "dotenv/config";
import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { POST as register } from "@/app/api/v1/auth/register/route.js";
import { POST as submitApplication } from "@/app/api/v1/provider-applications/route.js";
import {
  GET as ownApplication,
} from "@/app/api/v1/provider-applications/me/route.js";
import { GET as ownProfile } from "@/app/api/v1/providers/me/route.js";
import { getDb } from "@/lib/db/client.js";
import { providerProfiles } from "@/lib/db/schema/providers.js";
import { users } from "@/lib/db/schema/users.js";
import { SESSION_COOKIE_NAME } from "@/modules/auth/session-cookie.js";

const databaseUrl = process.env.DATABASE_URL;
const originalSecret = process.env.SESSION_SECRET;
const createdUserIds = [];
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

async function registerUser(label, { verified = true } = {}) {
  const response = await register(
    apiRequest("http://localhost/api/v1/auth/register", {
      method: "POST",
      body: {
        email: `m32-${label}-${randomUUID()}@example.com`,
        password,
        fullName: "M3.2 Test User",
      },
    }),
  );
  const payload = await response.json();
  const token = response.cookies.get(SESSION_COOKIE_NAME)?.value;

  expect(response.status).toBe(201);
  createdUserIds.push(payload.data.id);

  if (verified) {
    await getDb()
      .update(users)
      .set({ emailVerifiedAt: new Date() })
      .where(eq(users.id, payload.data.id));
  }

  return { ...payload.data, token };
}

function postApplication(user, displayName, bio = null) {
  return submitApplication(
    apiRequest("http://localhost/api/v1/provider-applications", {
      method: "POST",
      body: { displayName, bio },
      token: user.token,
    }),
  );
}

describe.skipIf(!databaseUrl)("provider application endpoints", () => {
  let applicant;
  let unverified;
  let noProfile;
  let reapply;

  beforeAll(async () => {
    process.env.SESSION_SECRET = "integration-session-secret-long-enough";
    applicant = await registerUser("applicant");
    unverified = await registerUser("unverified", { verified: false });
    noProfile = await registerUser("no-profile");
    reapply = await registerUser("reapply");
  }, 60_000);

  afterAll(async () => {
    if (createdUserIds.length > 0) {
      await getDb()
        .delete(providerProfiles)
        .where(inArray(providerProfiles.userId, createdUserIds));
      await getDb().delete(users).where(inArray(users.id, createdUserIds));
    }

    if (originalSecret === undefined) {
      delete process.env.SESSION_SECRET;
    } else {
      process.env.SESSION_SECRET = originalSecret;
    }
  }, 60_000);

  it("submits an application and exposes own status and profile", async () => {
    const response = await postApplication(
      applicant,
      "Akash Repairs",
      "Home repairs and electrical work",
    );
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.data).toMatchObject({
      userId: applicant.id,
      displayName: "Akash Repairs",
      bio: "Home repairs and electrical work",
      status: "pending",
    });
    expect(payload.data.submittedAt).toBeTruthy();
    expect(payload.data.approvedAt).toBeNull();

    const statusResponse = await ownApplication(
      apiRequest("http://localhost/api/v1/provider-applications/me", {
        token: applicant.token,
      }),
    );
    const statusPayload = await statusResponse.json();

    expect(statusResponse.status).toBe(200);
    expect(statusPayload.data.id).toBe(payload.data.id);
    expect(statusPayload.data.status).toBe("pending");

    const profileResponse = await ownProfile(
      apiRequest("http://localhost/api/v1/providers/me", {
        token: applicant.token,
      }),
    );
    const profilePayload = await profileResponse.json();

    expect(profileResponse.status).toBe(200);
    expect(profilePayload.data.id).toBe(payload.data.id);
    expect(profilePayload.data.isAvailable).toBe(false);
  });

  it("rejects duplicate applications", async () => {
    const response = await postApplication(applicant, "Duplicate");
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.error.code).toBe("APPLICATION_EXISTS");
  });

  it("rejects unverified and unauthenticated submissions", async () => {
    const unverifiedResponse = await postApplication(unverified, "Unverified");
    const unverifiedPayload = await unverifiedResponse.json();

    expect(unverifiedResponse.status).toBe(403);
    expect(unverifiedPayload.error.code).toBe("EMAIL_VERIFICATION_REQUIRED");

    const anonymousResponse = await submitApplication(
      apiRequest("http://localhost/api/v1/provider-applications", {
        method: "POST",
        body: { displayName: "Anonymous" },
      }),
    );

    expect(anonymousResponse.status).toBe(401);
    expect((await anonymousResponse.json()).error.code).toBe(
      "AUTHENTICATION_REQUIRED",
    );
  });

  it("returns 404 for own reads before applying", async () => {
    const applicationResponse = await ownApplication(
      apiRequest("http://localhost/api/v1/provider-applications/me", {
        token: noProfile.token,
      }),
    );
    const profileResponse = await ownProfile(
      apiRequest("http://localhost/api/v1/providers/me", {
        token: noProfile.token,
      }),
    );

    expect(applicationResponse.status).toBe(404);
    expect((await applicationResponse.json()).error.code).toBe(
      "PROVIDER_PROFILE_NOT_FOUND",
    );
    expect(profileResponse.status).toBe(404);
  });

  it("allows a rejected applicant to resubmit as pending", async () => {
    const first = await postApplication(reapply, "First Attempt");
    const firstPayload = await first.json();

    expect(first.status).toBe(201);

    await getDb()
      .update(providerProfiles)
      .set({ status: "rejected" })
      .where(eq(providerProfiles.userId, reapply.id));

    const second = await postApplication(reapply, "Second Attempt", "Revised");
    const secondPayload = await second.json();

    expect(second.status).toBe(201);
    expect(secondPayload.data.id).toBe(firstPayload.data.id);
    expect(secondPayload.data).toMatchObject({
      displayName: "Second Attempt",
      bio: "Revised",
      status: "pending",
    });
    expect(
      new Date(secondPayload.data.submittedAt).getTime(),
    ).toBeGreaterThanOrEqual(new Date(firstPayload.data.submittedAt).getTime());
  });
});
