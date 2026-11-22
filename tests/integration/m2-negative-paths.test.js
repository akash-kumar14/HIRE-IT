import "dotenv/config";
import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import { generate } from "otplib";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { GET as getCurrentDeletionRequest } from "@/app/api/v1/account/deletion-requests/current/route.js";
import { POST as createDeletionRequest } from "@/app/api/v1/account/deletion-requests/route.js";
import { POST as confirmMfaRoute } from "@/app/api/v1/auth/mfa/confirm/route.js";
import { POST as enrollMfaRoute } from "@/app/api/v1/auth/mfa/enroll/route.js";
import { POST as recoverMfaRoute } from "@/app/api/v1/auth/mfa/recovery/route.js";
import { POST as verifyMfaRoute } from "@/app/api/v1/auth/mfa/verify/route.js";
import { POST as register } from "@/app/api/v1/auth/register/route.js";
import { getDb } from "@/lib/db/client.js";
import {
  adminProfiles,
  auditLogs,
  users,
  userSessions,
} from "@/lib/db/schema/users.js";
import { inviteAdmin } from "@/modules/admin/admin.service.js";
import { AUDIT_ACTIONS } from "@/modules/audit/audit.service.js";
import { AdminPermissionError } from "@/modules/auth/authorization.js";
import { confirmMfa, enrollMfa } from "@/modules/auth/mfa.service.js";
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

async function createUser({ verified = false, admin = false } = {}) {
  const response = await register(
    request("http://localhost/api/v1/auth/register", null, {
      method: "POST",
      body: {
        email: `m210-${randomUUID()}@example.com`,
        password: "Password123!",
        fullName: "M2.10 Test User",
      },
    }),
  );
  const body = await response.json();

  createdUserIds.push(body.data.id);

  let profile = null;

  if (verified) {
    await getDb()
      .update(users)
      .set({ emailVerifiedAt: new Date() })
      .where(eq(users.id, body.data.id));
  }

  if (admin) {
    [profile] = await getDb()
      .insert(adminProfiles)
      .values({ userId: body.data.id, role: "admin" })
      .returning();
  }

  return {
    user: body.data,
    token: response.cookies.get(SESSION_COOKIE_NAME)?.value,
    profile,
  };
}

async function setStatus(userId, status) {
  await getDb()
    .update(users)
    .set({
      status,
      deletedAt: status === "deleted" ? new Date() : null,
    })
    .where(eq(users.id, userId));
}

describe.skipIf(!databaseUrl)("M2 positive and negative paths", () => {
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

  it("rejects non-admin sessions on every MFA route", async () => {
    const { user, token } = await createUser();
    const cases = [
      [enrollMfaRoute, {}],
      [confirmMfaRoute, { code: "000000" }],
      [verifyMfaRoute, { code: "000000" }],
      [recoverMfaRoute, { code: "aaaaaaaaaa" }],
    ];

    for (const [route, body] of cases) {
      const response = await route(
        request("http://localhost/api/v1/auth/mfa", token, {
          method: "POST",
          body,
        }),
      );

      expect(response.status).toBe(403);
      expect((await response.json()).error.code).toBe("ADMIN_ACCESS_REQUIRED");
    }

    const profiles = await getDb()
      .select({ id: adminProfiles.id })
      .from(adminProfiles)
      .where(eq(adminProfiles.userId, user.id));
    expect(profiles).toHaveLength(0);
  });

  it("applies account status checks before admin MFA setup", async () => {
    const { user, token } = await createUser({ admin: true });
    const setup = () =>
      enrollMfaRoute(
        request("http://localhost/api/v1/auth/mfa/enroll", token, {
          method: "POST",
          body: {},
        }),
      );

    await setStatus(user.id, "suspended");
    const suspended = await setup();
    expect(suspended.status).toBe(403);
    expect((await suspended.json()).error.code).toBe("ACCOUNT_SUSPENDED");

    await setStatus(user.id, "deleted");
    const deleted = await setup();
    expect(deleted.status).toBe(403);
    expect((await deleted.json()).error.code).toBe("ACCOUNT_UNAVAILABLE");
  });

  it("does not verify a session or audit a failed MFA attempt", async () => {
    const { user, token, profile } = await createUser({
      verified: true,
      admin: true,
    });
    const enrollment = await enrollMfa({
      adminProfileId: profile.id,
      email: user.email,
    });
    const code = await generate({ secret: enrollment.secret });
    const confirmed = await confirmMfa({ adminProfileId: profile.id, code });
    expect(confirmed.recoveryCodes).toHaveLength(8);

    const wrongCode = code === "000000" ? "111111" : "000000";
    const invalid = await verifyMfaRoute(
      request("http://localhost/api/v1/auth/mfa/verify", token, {
        method: "POST",
        body: { code: wrongCode },
      }),
    );
    expect(invalid.status).toBe(400);
    expect((await invalid.json()).error.code).toBe("INVALID_MFA_CODE");

    const [session] = await getDb()
      .select()
      .from(userSessions)
      .where(eq(userSessions.userId, user.id))
      .orderBy(desc(userSessions.createdAt))
      .limit(1);
    expect(session.mfaVerifiedAt).toBeNull();

    const verifyEvents = () =>
      getDb()
        .select()
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.action, AUDIT_ACTIONS.MFA_VERIFY),
            eq(auditLogs.actorUserId, user.id),
          ),
        );
    expect(await verifyEvents()).toHaveLength(0);

    const valid = await verifyMfaRoute(
      request("http://localhost/api/v1/auth/mfa/verify", token, {
        method: "POST",
        body: { code: await generate({ secret: enrollment.secret }) },
      }),
    );
    expect(valid.status).toBe(200);

    const events = await verifyEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      actorAdminProfileId: profile.id,
      entityType: "user_session",
      requestId: null,
    });
  }, 60_000);

  it("requires authentication for deletion requests", async () => {
    const create = await createDeletionRequest(
      request("http://localhost/api/v1/account/deletion-requests", null, {
        method: "POST",
        body: {},
      }),
    );
    const current = await getCurrentDeletionRequest(
      request("http://localhost/api/v1/account/deletion-requests/current"),
    );

    for (const response of [create, current]) {
      expect(response.status).toBe(401);
      expect((await response.json()).error.code).toBe("AUTHENTICATION_REQUIRED");
    }
  });

  it("isolates deletion status and omits reason text from audit metadata", async () => {
    const owner = await createUser();
    const other = await createUser();
    const auditQuery = () =>
      getDb()
        .select()
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.action, AUDIT_ACTIONS.DELETION_REQUEST_CREATED),
            eq(auditLogs.actorUserId, owner.user.id),
          ),
        );

    const created = await createDeletionRequest(
      request("http://localhost/api/v1/account/deletion-requests", owner.token, {
        method: "POST",
        body: { reason: "private relocation details" },
      }),
    );
    expect(created.status).toBe(201);
    const createdBody = await created.json();

    const otherCurrent = await getCurrentDeletionRequest(
      request(
        "http://localhost/api/v1/account/deletion-requests/current",
        other.token,
      ),
    );
    expect((await otherCurrent.json()).data).toBeNull();

    const before = await auditQuery();
    expect(before).toHaveLength(1);
    expect(JSON.stringify(before[0])).not.toContain("private relocation details");

    const duplicate = await createDeletionRequest(
      request("http://localhost/api/v1/account/deletion-requests", owner.token, {
        method: "POST",
        body: {},
      }),
    );
    expect(duplicate.status).toBe(409);
    expect(await auditQuery()).toHaveLength(before.length);
    expect((await duplicate.json()).error.code).toBe("DELETION_REQUEST_PENDING");
    expect(createdBody.data.status).toBe("pending");
  });

  it("does not audit a denied admin invitation", async () => {
    const actor = await createUser({ admin: true });
    const target = await createUser();

    await expect(
      inviteAdmin({
        actorAdminProfileId: actor.profile.id,
        email: target.user.email,
        role: "admin",
      }),
    ).rejects.toBeInstanceOf(AdminPermissionError);

    const events = await getDb()
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.action, AUDIT_ACTIONS.ADMIN_INVITE),
          eq(auditLogs.actorUserId, actor.user.id),
        ),
      );
    expect(events).toHaveLength(0);
  });
});
