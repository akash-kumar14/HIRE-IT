import "dotenv/config";
import { randomUUID } from "node:crypto";
import { inArray } from "drizzle-orm";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  DELETE as deleteServiceArea,
  GET as listServiceAreas,
  POST as createServiceArea,
} from "@/app/api/v1/providers/me/service-areas/route.js";
import {
  DELETE as deleteServiceAreaById,
} from "@/app/api/v1/providers/me/service-areas/[id]/route.js";
import {
  GET as getAvailability,
  PATCH as patchAvailability,
} from "@/app/api/v1/providers/me/availability/route.js";
import {
  PUT as putWeeklyAvailability,
} from "@/app/api/v1/providers/me/availability/weekly/route.js";
import { POST as register } from "@/app/api/v1/auth/register/route.js";
import { getDb } from "@/lib/db/client.js";
import { providerAvailability } from "@/lib/db/schema/bookings.js";
import { providerProfiles, providerServiceAreas } from "@/lib/db/schema/providers.js";
import { users } from "@/lib/db/schema/users.js";
import { SESSION_COOKIE_NAME } from "@/modules/auth/session-cookie.js";

const databaseUrl = process.env.DATABASE_URL;
const originalSecret = process.env.SESSION_SECRET;
const createdUserIds = [];
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
        email: `m36-${label}-${randomUUID()}@example.com`,
        password,
        fullName: "M3.6 Test User",
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

async function createProvider(label, status) {
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

  return { ...user, profileId: profile.id };
}

const areaInput = {
  label: "Agra Cantt",
  latitude: "27.1766700",
  longitude: "78.0080700",
  radiusMeters: 5000,
  isPrimary: true,
};

const weeklyInput = {
  slots: [
    {
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "18:00",
      timezone: "Asia/Kolkata",
    },
    {
      dayOfWeek: 6,
      startTime: "10:00",
      endTime: "14:00",
      timezone: "Asia/Kolkata",
      isAvailable: false,
    },
  ],
};

describe.skipIf(!databaseUrl)("provider service areas and availability endpoints", () => {
  let approved;
  let otherApproved;
  let pending;
  let noProfile;

  beforeAll(async () => {
    process.env.SESSION_SECRET = "integration-session-secret-long-enough";
    approved = await createProvider("approved", "approved");
    otherApproved = await createProvider("other", "approved");
    pending = await createProvider("pending", "pending");
    noProfile = await registerUser("no-profile");
  }, 60_000);

  afterAll(async () => {
    if (createdProfileIds.length > 0) {
      await getDb()
        .delete(providerAvailability)
        .where(inArray(providerAvailability.providerProfileId, createdProfileIds));
      await getDb()
        .delete(providerServiceAreas)
        .where(inArray(providerServiceAreas.providerProfileId, createdProfileIds));
      await getDb()
        .delete(providerProfiles)
        .where(inArray(providerProfiles.id, createdProfileIds));
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

  it("creates, lists, and deletes own service areas", async () => {
    const created = await createServiceArea(
      apiRequest("http://localhost/api/v1/providers/me/service-areas", {
        method: "POST",
        token: approved.token,
        body: areaInput,
      }),
    );
    const createdPayload = await created.json();

    expect(created.status).toBe(201);
    expect(createdPayload.data).toMatchObject({
      label: "Agra Cantt",
      radiusMeters: 5000,
      isPrimary: true,
    });

    const listed = await listServiceAreas(
      apiRequest("http://localhost/api/v1/providers/me/service-areas?limit=5", {
        token: approved.token,
      }),
    );
    const listedPayload = await listed.json();

    expect(listed.status).toBe(200);
    expect(listedPayload.data).toHaveLength(1);
    expect(listedPayload.data[0].id).toBe(createdPayload.data.id);
    expect(Number(listedPayload.data[0].latitude)).toBeCloseTo(27.17667);
    expect(listedPayload.meta.pagination).toMatchObject({ limit: 5, offset: 0, total: 1 });

    const deleted = await deleteServiceAreaById(
      apiRequest(
        `http://localhost/api/v1/providers/me/service-areas/${createdPayload.data.id}`,
        { method: "DELETE", token: approved.token },
      ),
      { params: Promise.resolve({ id: createdPayload.data.id }) },
    );

    expect(deleted.status).toBe(200);
    expect((await deleted.json()).data.id).toBe(createdPayload.data.id);
  });

  it("rejects invalid areas and cross-provider deletion", async () => {
    const invalid = await createServiceArea(
      apiRequest("http://localhost/api/v1/providers/me/service-areas", {
        method: "POST",
        token: approved.token,
        body: { ...areaInput, radiusMeters: -1 },
      }),
    );

    expect(invalid.status).toBe(422);
    expect((await invalid.json()).error.code).toBe("VALIDATION_ERROR");

    const foreign = await createServiceArea(
      apiRequest("http://localhost/api/v1/providers/me/service-areas", {
        method: "POST",
        token: otherApproved.token,
        body: { ...areaInput, label: "Private area" },
      }),
    );
    const foreignPayload = await foreign.json();

    expect(foreign.status).toBe(201);

    const denied = await deleteServiceAreaById(
      apiRequest(
        `http://localhost/api/v1/providers/me/service-areas/${foreignPayload.data.id}`,
        { method: "DELETE", token: approved.token },
      ),
      { params: Promise.resolve({ id: foreignPayload.data.id }) },
    );

    expect(denied.status).toBe(404);
    expect((await denied.json()).error.code).toBe("SERVICE_AREA_NOT_FOUND");
  });

  it("requires authentication and a provider profile", async () => {
    const anonymous = await listServiceAreas(
      apiRequest("http://localhost/api/v1/providers/me/service-areas"),
    );

    expect(anonymous.status).toBe(401);
    expect((await anonymous.json()).error.code).toBe("AUTHENTICATION_REQUIRED");

    const noProfileResponse = await getAvailability(
      apiRequest("http://localhost/api/v1/providers/me/availability", {
        token: noProfile.token,
      }),
    );

    expect(noProfileResponse.status).toBe(404);
    expect((await noProfileResponse.json()).error.code).toBe("PROVIDER_PROFILE_NOT_FOUND");
  });

  it("replaces weekly slots and preserves them when availability is disabled", async () => {
    const replaced = await putWeeklyAvailability(
      apiRequest("http://localhost/api/v1/providers/me/availability/weekly", {
        method: "PUT",
        token: approved.token,
        body: weeklyInput,
      }),
    );
    const replacedPayload = await replaced.json();

    expect(replaced.status).toBe(200);
    expect(replacedPayload.data.weeklySlots).toHaveLength(2);

    const enabled = await patchAvailability(
      apiRequest("http://localhost/api/v1/providers/me/availability", {
        method: "PATCH",
        token: approved.token,
        body: { isAvailable: true },
      }),
    );

    expect(enabled.status).toBe(200);
    expect((await enabled.json()).data.isAvailable).toBe(true);

    const disabled = await patchAvailability(
      apiRequest("http://localhost/api/v1/providers/me/availability", {
        method: "PATCH",
        token: approved.token,
        body: { isAvailable: false },
      }),
    );

    expect(disabled.status).toBe(200);

    const current = await getAvailability(
      apiRequest("http://localhost/api/v1/providers/me/availability", {
        token: approved.token,
      }),
    );
    const currentPayload = await current.json();

    expect(current.status).toBe(200);
    expect(currentPayload.data.isAvailable).toBe(false);
    expect(currentPayload.data.weeklySlots).toHaveLength(2);

    const cleared = await putWeeklyAvailability(
      apiRequest("http://localhost/api/v1/providers/me/availability/weekly", {
        method: "PUT",
        token: approved.token,
        body: { slots: [] },
      }),
    );

    expect(cleared.status).toBe(200);
    expect((await cleared.json()).data.weeklySlots).toEqual([]);
  });

  it("rejects invalid weekly slots and unapproved availability", async () => {
    const invalid = await putWeeklyAvailability(
      apiRequest("http://localhost/api/v1/providers/me/availability/weekly", {
        method: "PUT",
        token: approved.token,
        body: {
          slots: [
            weeklyInput.slots[0],
            { ...weeklyInput.slots[0], startTime: "18:00", endTime: "09:00" },
          ],
        },
      }),
    );

    expect(invalid.status).toBe(422);

    const unapprovedToggle = await patchAvailability(
      apiRequest("http://localhost/api/v1/providers/me/availability", {
        method: "PATCH",
        token: pending.token,
        body: { isAvailable: true },
      }),
    );

    expect(unapprovedToggle.status).toBe(403);
    expect((await unapprovedToggle.json()).error.code).toBe("PROVIDER_NOT_APPROVED");

    const unapprovedSchedule = await putWeeklyAvailability(
      apiRequest("http://localhost/api/v1/providers/me/availability/weekly", {
        method: "PUT",
        token: pending.token,
        body: weeklyInput,
      }),
    );

    expect(unapprovedSchedule.status).toBe(403);
  });
});
