import "dotenv/config";
import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { generate } from "otplib";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { POST as confirmMfa } from "@/app/api/v1/auth/mfa/confirm/route.js";
import { POST as enrollMfa } from "@/app/api/v1/auth/mfa/enroll/route.js";
import { POST as recoverMfa } from "@/app/api/v1/auth/mfa/recovery/route.js";
import { POST as verifyMfa } from "@/app/api/v1/auth/mfa/verify/route.js";
import { POST as confirmReset } from "@/app/api/v1/auth/password-reset/confirm/route.js";
import { POST as requestReset } from "@/app/api/v1/auth/password-reset/route.js";
import { POST as login } from "@/app/api/v1/auth/login/route.js";
import { POST as register } from "@/app/api/v1/auth/register/route.js";
import { requireMfaAdminProfile } from "@/modules/admin/admin-authorization.js";
import { getDb } from "@/lib/db/client.js";
import {
  adminProfiles,
  users,
} from "@/lib/db/schema/users.js";
import { MfaRequiredError } from "@/modules/auth/authorization.js";
import { requestPasswordReset } from "@/modules/auth/password-reset.service.js";
import { SESSION_COOKIE_NAME } from "@/modules/auth/session-cookie.js";

const databaseUrl = process.env.DATABASE_URL;
const originalSecret = process.env.SESSION_SECRET;
const createdUserIds = [];
let admin;
let secret;
let recoveryCodes;

function jsonRequest(url, body, token) {
  const headers = { "content-type": "application/json" };

  if (token) {
    headers.cookie = `${SESSION_COOKIE_NAME}=${token}`;
  }

  return new NextRequest(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

async function createAdminUser(label) {
  const response = await register(
    jsonRequest("http://localhost/api/v1/auth/register", {
      email: `m28-${label}-${randomUUID()}@example.com`,
      password: "Password123!",
      fullName: "M2.8 Test Admin",
    }),
  );
  const body = await response.json();
  const token = response.cookies.get(SESSION_COOKIE_NAME)?.value;

  createdUserIds.push(body.data.id);
  await getDb()
    .update(users)
    .set({ emailVerifiedAt: new Date() })
    .where(eq(users.id, body.data.id));
  await getDb()
    .insert(adminProfiles)
    .values({ userId: body.data.id, role: "admin" });

  return {
    user: body.data,
    token,
    password: "Password123!",
  };
}

async function loginAdmin() {
  const response = await login(
    jsonRequest("http://localhost/api/v1/auth/login", {
      email: admin.user.email,
      password: admin.password,
    }),
  );
  expect(response.status).toBe(200);

  return response.cookies.get(SESSION_COOKIE_NAME)?.value;
}

async function currentCode() {
  return generate({ secret });
}

async function captureResetToken(email) {
  let token = null;
  await requestPasswordReset(
    { email },
    {
      emailSender: async ({ token: resetToken }) => {
        token = resetToken;
      },
    },
  );

  return token;
}

describe.skipIf(!databaseUrl)("admin MFA", () => {
  beforeAll(() => {
    process.env.SESSION_SECRET = "integration-session-secret-long-enough";
  });

  afterAll(async () => {
    if (createdUserIds.length > 0) {
      await getDb().delete(users).where(inArray(users.id, createdUserIds));
    }

    if (originalSecret === undefined) {
      delete process.env.SESSION_SECRET;
    } else {
      process.env.SESSION_SECRET = originalSecret;
    }
  });

  it("enrolls and confirms MFA before granting admin access", async () => {
    admin = await createAdminUser("enroll");

    await expect(
      requireMfaAdminProfile(
        jsonRequest("http://localhost/api/v1/admin", {}, admin.token),
      ),
    ).rejects.toBeInstanceOf(MfaRequiredError);

    const enrollment = await enrollMfa(
      jsonRequest("http://localhost/api/v1/auth/mfa/enroll", {}, admin.token),
    );
    expect(enrollment.status).toBe(200);
    const enrollmentBody = await enrollment.json();
    secret = enrollmentBody.data.secret;
    expect(enrollmentBody.data.otpauthUri).toContain("otpauth://totp/");

    const code = await currentCode();
    const wrong = code === "000000" ? "111111" : "000000";
    const invalid = await confirmMfa(
      jsonRequest(
        "http://localhost/api/v1/auth/mfa/confirm",
        { code: wrong },
        admin.token,
      ),
    );
    expect(invalid.status).toBe(400);
    expect((await invalid.json()).error.code).toBe("INVALID_MFA_CODE");

    const confirmed = await confirmMfa(
      jsonRequest(
        "http://localhost/api/v1/auth/mfa/confirm",
        { code },
        admin.token,
      ),
    );
    expect(confirmed.status).toBe(200);
    const confirmedBody = await confirmed.json();
    recoveryCodes = confirmedBody.data.recoveryCodes;
    expect(recoveryCodes).toHaveLength(8);

    await expect(
      requireMfaAdminProfile(
        jsonRequest("http://localhost/api/v1/admin", {}, admin.token),
      ),
    ).rejects.toBeInstanceOf(MfaRequiredError);

    const verified = await verifyMfa(
      jsonRequest(
        "http://localhost/api/v1/auth/mfa/verify",
        { code: await currentCode() },
        admin.token,
      ),
    );
    expect(verified.status).toBe(200);
    expect((await verified.json()).data).toEqual({ verified: true });

    const current = await requireMfaAdminProfile(
      jsonRequest("http://localhost/api/v1/admin", {}, admin.token),
    );
    expect(current.adminProfile.role).toBe("admin");
  }, 60_000);

  it("does not let email-only password reset bypass MFA", async () => {
    const resetToken = await captureResetToken(admin.user.email);
    expect(resetToken).toBeTruthy();

    const reset = await confirmReset(
      jsonRequest("http://localhost/api/v1/auth/password-reset/confirm", {
        token: resetToken,
        password: "NewPassword123!",
      }),
    );
    expect(reset.status).toBe(200);
    admin.password = "NewPassword123!";

    admin.token = await loginAdmin();
    await expect(
      requireMfaAdminProfile(
        jsonRequest("http://localhost/api/v1/admin", {}, admin.token),
      ),
    ).rejects.toBeInstanceOf(MfaRequiredError);

    const verified = await verifyMfa(
      jsonRequest(
        "http://localhost/api/v1/auth/mfa/verify",
        { code: await currentCode() },
        admin.token,
      ),
    );
    expect(verified.status).toBe(200);

    const current = await requireMfaAdminProfile(
      jsonRequest("http://localhost/api/v1/admin", {}, admin.token),
    );
    expect(current.credential.confirmedAt).toBeTruthy();
  }, 60_000);

  it("consumes a recovery code once and marks the session verified", async () => {
    const freshToken = await loginAdmin();
    await expect(
      requireMfaAdminProfile(
        jsonRequest("http://localhost/api/v1/admin", {}, freshToken),
      ),
    ).rejects.toBeInstanceOf(MfaRequiredError);

    const recovery = await recoverMfa(
      jsonRequest(
        "http://localhost/api/v1/auth/mfa/recovery",
        { code: recoveryCodes[0] },
        freshToken,
      ),
    );
    expect(recovery.status).toBe(200);
    expect((await recovery.json()).data).toEqual({ verified: true });

    const current = await requireMfaAdminProfile(
      jsonRequest("http://localhost/api/v1/admin", {}, freshToken),
    );
    expect(current.session.mfaVerifiedAt).toBeTruthy();

    const anotherToken = await loginAdmin();
    const reused = await recoverMfa(
      jsonRequest(
        "http://localhost/api/v1/auth/mfa/recovery",
        { code: recoveryCodes[0] },
        anotherToken,
      ),
    );
    expect(reused.status).toBe(400);
    expect((await reused.json()).error.code).toBe("INVALID_RECOVERY_CODE");
  }, 60_000);
});
