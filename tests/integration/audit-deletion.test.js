import "dotenv/config";
import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { GET as getCurrentDeletionRequest } from "@/app/api/v1/account/deletion-requests/current/route.js";
import { POST as createDeletionRequest } from "@/app/api/v1/account/deletion-requests/route.js";
import { POST as register } from "@/app/api/v1/auth/register/route.js";
import { getDb } from "@/lib/db/client.js";
import {
  adminProfiles,
  auditLogs,
  users,
} from "@/lib/db/schema/users.js";
import { AUDIT_ACTIONS } from "@/modules/audit/audit.service.js";
import { enrollMfa } from "@/modules/auth/mfa.service.js";
import { SESSION_COOKIE_NAME } from "@/modules/auth/session-cookie.js";

const databaseUrl = process.env.DATABASE_URL;
const originalSecret = process.env.SESSION_SECRET;
const createdUserIds = [];

function request(url, token, { method = "GET", body } = {}) {
  const headers = {};

  if (token) {
    headers.cookie = `${SESSION_COOKIE_NAME}=${token}`;
  }

  const init = { method, headers };

  if (body !== undefined) {
    headers["content-type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  return new NextRequest(url, init);
}

async function createUser() {
  const response = await register(
    request("http://localhost/api/v1/auth/register", null, {
      method: "POST",
      body: {
        email: `m29-${randomUUID()}@example.com`,
        password: "Password123!",
        fullName: "M2.9 Test User",
      },
    }),
  );
  const body = await response.json();

  createdUserIds.push(body.data.id);
  expect(response.status).toBe(201);

  return {
    user: body.data,
    token: response.cookies.get(SESSION_COOKIE_NAME)?.value,
  };
}

describe.skipIf(!databaseUrl)("audit log and account deletion requests", () => {
  beforeAll(() => {
    process.env.SESSION_SECRET = "integration-session-secret-long-enough";
  });

  afterAll(async () => {
    if (originalSecret === undefined) {
      delete process.env.SESSION_SECRET;
    } else {
      process.env.SESSION_SECRET = originalSecret;
    }

    if (!databaseUrl || createdUserIds.length === 0) {
      return;
    }

    const database = getDb();
    const events = await database
      .select({ id: auditLogs.id })
      .from(auditLogs)
      .where(inArray(auditLogs.actorUserId, createdUserIds));

    if (events.length > 0) {
      await database
        .delete(auditLogs)
        .where(
          inArray(
            auditLogs.id,
            events.map((event) => event.id),
          ),
        );
    }

    await database.delete(users).where(inArray(users.id, createdUserIds));
  });

  it("creates one pending request, exposes its status, and audits it", async () => {
    const { user, token } = await createUser();
    const response = await createDeletionRequest(
      request("http://localhost/api/v1/account/deletion-requests", token, {
        method: "POST",
        body: { reason: "  Moving away  " },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data).toMatchObject({
      status: "pending",
      reason: "Moving away",
      reviewedAt: null,
      completedAt: null,
    });

    const requestId = response.headers.get("x-request-id");
    const current = await getCurrentDeletionRequest(
      request("http://localhost/api/v1/account/deletion-requests/current", token),
    );
    const currentBody = await current.json();

    expect(current.status).toBe(200);
    expect(currentBody.data.id).toBe(body.data.id);

    const duplicate = await createDeletionRequest(
      request("http://localhost/api/v1/account/deletion-requests", token, {
        method: "POST",
        body: {},
      }),
    );
    const duplicateBody = await duplicate.json();

    expect(duplicate.status).toBe(409);
    expect(duplicateBody.error.code).toBe("DELETION_REQUEST_PENDING");

    const [event] = await getDb()
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.action, AUDIT_ACTIONS.DELETION_REQUEST_CREATED),
          eq(auditLogs.entityId, body.data.id),
        ),
      );

    expect(event).toMatchObject({
      actorUserId: user.id,
      actorAdminProfileId: null,
      requestId,
      metadata: { status: "pending" },
    });
  });

  it("returns null when the user has no deletion request", async () => {
    const { token } = await createUser();
    const response = await getCurrentDeletionRequest(
      request("http://localhost/api/v1/account/deletion-requests/current", token),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toBeNull();
  });

  it("audits MFA enrollment without recording the secret", async () => {
    const { user } = await createUser();
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

    const [event] = await getDb()
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.action, AUDIT_ACTIONS.MFA_ENROLL),
          eq(auditLogs.actorAdminProfileId, profile.id),
        ),
      );

    expect(event).toMatchObject({
      actorUserId: user.id,
      actorAdminProfileId: profile.id,
      entityType: "admin_mfa_credential",
    });
    expect(JSON.stringify(event.metadata)).not.toContain(enrollment.secret);
    expect(JSON.stringify(event.metadata)).not.toContain("otpauth");
  });
});
