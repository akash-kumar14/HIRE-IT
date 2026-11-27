import { describe, expect, it } from "vitest";
import { providerProfiles, providerVerifications } from "@/lib/db/schema/providers.js";
import { setOwnAvailability } from "@/modules/providers/provider-settings.service.js";
import {
  QualificationExpiredError,
  assertNoExpiredQualifications,
  effectiveVerificationStatus,
  verificationIsExpired,
} from "@/modules/providers/qualification.service.js";

const USER_ID = "9e9c4b17-5a2d-4f68-8b10-7c6d9e2a4f31";
const PROFILE_ID = "ae9c4b17-5a2d-4f68-8b10-7c6d9e2a4f32";
const NOW = new Date("2026-11-27T00:00:00.000Z");
const PAST = new Date("2020-01-01T00:00:00.000Z");
const FUTURE = new Date("2099-01-01T00:00:00.000Z");

function rowsResult(rows) {
  return {
    then: (resolve, reject) => Promise.resolve(rows).then(resolve, reject),
    limit: () => rowsResult(rows),
  };
}

function createFakeDatabase(verifications, status = "approved") {
  const profile = {
    id: PROFILE_ID,
    userId: USER_ID,
    status,
    isAvailable: false,
  };
  const state = { updates: [] };
  const database = {
    select: () => ({
      from: (table) => {
        if (table === providerProfiles) return { where: () => rowsResult([profile]) };
        if (table === providerVerifications) return { where: () => rowsResult(verifications) };
        return { where: () => rowsResult([]) };
      },
    }),
    update: () => ({
      set: (values) => ({
        where: () => ({
          returning: async () => {
            state.updates.push(values);
            return [{ ...profile, ...values }];
          },
        }),
      }),
    }),
  };

  return { database, state };
}

describe("verification expiry policy", () => {
  it("treats past expiry and expired status as expired", () => {
    expect(verificationIsExpired({ status: "approved", expiresAt: PAST }, NOW)).toBe(true);
    expect(verificationIsExpired({ status: "expired", expiresAt: null }, NOW)).toBe(true);
    expect(effectiveVerificationStatus({ status: "approved", expiresAt: PAST }, NOW)).toBe(
      "expired",
    );
  });

  it("keeps future expiry, null expiry, and revoked status distinct", () => {
    expect(verificationIsExpired({ status: "approved", expiresAt: FUTURE }, NOW)).toBe(false);
    expect(verificationIsExpired({ status: "approved", expiresAt: null }, NOW)).toBe(false);
    expect(effectiveVerificationStatus({ status: "revoked", expiresAt: null }, NOW)).toBe(
      "revoked",
    );
  });

  it("throws a sanitizable error when any verification is expired", () => {
    const error = new QualificationExpiredError();

    expect([error.code, error.status]).toEqual(["QUALIFICATION_EXPIRED", 403]);
    expect(() =>
      assertNoExpiredQualifications(
        [
          { status: "approved", expiresAt: FUTURE },
          { status: "approved", expiresAt: PAST },
        ],
        NOW,
      ),
    ).toThrow(QualificationExpiredError);
    expect(() =>
      assertNoExpiredQualifications([{ status: "approved", expiresAt: FUTURE }], NOW),
    ).not.toThrow();
  });
});

describe("availability qualification gate", () => {
  it("blocks enabling availability when a verification is expired", async () => {
    const { database, state } = createFakeDatabase([
      { status: "approved", expiresAt: PAST },
    ]);

    await expect(
      setOwnAvailability(
        { id: USER_ID },
        { isAvailable: true },
        { database, now: NOW },
      ),
    ).rejects.toBeInstanceOf(QualificationExpiredError);
    expect(state.updates).toHaveLength(0);
  });

  it("allows enabling availability when verifications are current", async () => {
    const { database, state } = createFakeDatabase([
      { status: "approved", expiresAt: FUTURE },
    ]);

    await expect(
      setOwnAvailability(
        { id: USER_ID },
        { isAvailable: true },
        { database, now: NOW },
      ),
    ).resolves.toEqual({ isAvailable: true });
    expect(state.updates).toEqual([{ isAvailable: true }]);
  });
});
