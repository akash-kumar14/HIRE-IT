import "dotenv/config";
import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { NextRequest } from "next/server";
import { afterAll, describe, expect, it } from "vitest";
import { POST as register } from "@/app/api/v1/auth/register/route.js";
import { requireAdminProfile } from "@/modules/admin/admin-authorization.js";
import {
  AdminBootstrapError,
  AdminTargetError,
  bootstrapInitialSuperAdmin,
  inviteAdmin,
} from "@/modules/admin/admin.service.js";
import { DuplicateAdminProfileError } from "@/modules/admin/admin.service.js";
import { AdminPermissionError } from "@/modules/auth/authorization.js";
import { getDb } from "@/lib/db/client.js";
import { users } from "@/lib/db/schema/users.js";
import { SESSION_COOKIE_NAME } from "@/modules/auth/session-cookie.js";

const databaseUrl = process.env.DATABASE_URL;
const createdUserIds = [];
let superAdmin;
let superAdminToken;

function jsonRequest(url, body) {
  return new NextRequest(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function withCookie(url, token) {
  return new NextRequest(url, {
    method: "GET",
    headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` },
  });
}

async function createVerifiedUser(label) {
  const response = await register(
    jsonRequest("http://localhost/api/v1/auth/register", {
      email: `m27-${label}-${randomUUID()}@example.com`,
      password: "Password123!",
      fullName: "M2.7 Test User",
    }),
  );
  const body = await response.json();
  const token = response.cookies.get(SESSION_COOKIE_NAME)?.value;

  createdUserIds.push(body.data.id);
  await getDb()
    .update(users)
    .set({ emailVerifiedAt: new Date() })
    .where(eq(users.id, body.data.id));

  return { user: body.data, token };
}

describe.skipIf(!databaseUrl)("admin bootstrap and profiles", () => {
  afterAll(async () => {
    if (createdUserIds.length > 0) {
      await getDb().delete(users).where(inArray(users.id, createdUserIds));
    }
  });

  it("bootstraps one super admin and refuses a second bootstrap", async () => {
    const { user, token } = await createVerifiedUser("bootstrap");
    superAdminToken = token;

    superAdmin = await bootstrapInitialSuperAdmin({ email: user.email });
    expect(superAdmin).toMatchObject({
      userId: user.id,
      role: "super_admin",
      mfaEnrolledAt: null,
    });

    await expect(
      bootstrapInitialSuperAdmin({ email: user.email }),
    ).rejects.toBeInstanceOf(AdminBootstrapError);
  });

  it("allows only a super admin to invite regular admins", async () => {
    const { user } = await createVerifiedUser("invited");
    const invited = await inviteAdmin({
      actorAdminProfileId: superAdmin.id,
      email: user.email,
      role: "admin",
    });

    expect(invited).toMatchObject({ userId: user.id, role: "admin" });

    await expect(
      inviteAdmin({
        actorAdminProfileId: invited.id,
        email: user.email,
        role: "admin",
      }),
    ).rejects.toBeInstanceOf(AdminPermissionError);

    await expect(
      inviteAdmin({
        actorAdminProfileId: superAdmin.id,
        email: user.email,
        role: "super_admin",
      }),
    ).rejects.toBeInstanceOf(AdminTargetError);

    await expect(
      inviteAdmin({
        actorAdminProfileId: superAdmin.id,
        email: user.email,
        role: "admin",
      }),
    ).rejects.toBeInstanceOf(DuplicateAdminProfileError);
  });

  it("requires an admin profile for admin authorization", async () => {
    const { token } = await createVerifiedUser("non-admin");

    await expect(
      requireAdminProfile(withCookie("http://localhost/api/v1/admin", token)),
    ).rejects.toMatchObject({
      code: "ADMIN_ACCESS_REQUIRED",
      status: 403,
    });

    const current = await requireAdminProfile(
      withCookie("http://localhost/api/v1/admin", superAdminToken),
    );
    expect(current.adminProfile).toMatchObject({
      id: superAdmin.id,
      role: "super_admin",
    });
  });
});
