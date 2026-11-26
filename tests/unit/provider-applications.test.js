import { describe, expect, it } from "vitest";
import { EmailVerificationRequiredError } from "@/modules/auth/authorization.js";
import {
  ApplicationConflictError,
  ProviderProfileNotFoundError,
  getOwnApplication,
  getOwnProviderProfile,
  submitApplication,
  toApplication,
  toOwnProviderProfile,
} from "@/modules/providers/provider-applications.service.js";
import { validateApplicationCreate } from "@/modules/providers/provider-applications.validation.js";

const USER_ID = "8b6d0f2a-6f7e-4b3c-9d21-0e5c4a7b9f10";
const PROFILE_ID = "3e9c4b17-5a2d-4f68-8b10-7c6d9e2a4f31";

function createFakeDatabase({ existing = null, inserted = {}, updated = {} } = {}) {
  const state = { inserts: [], updates: [] };
  const database = {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => (existing ? [existing] : []),
        }),
      }),
    }),
    insert: () => ({
      values: (values) => ({
        returning: async () => {
          state.inserts.push(values);
          return [inserted];
        },
      }),
    }),
    update: () => ({
      set: (values) => ({
        where: () => ({
          returning: async () => {
            state.updates.push(values);
            return [updated];
          },
        }),
      }),
    }),
  };

  return { database, state };
}

function profileRow(overrides = {}) {
  const now = new Date();

  return {
    id: PROFILE_ID,
    userId: USER_ID,
    displayName: "Akash",
    bio: null,
    status: "pending",
    isAvailable: false,
    submittedAt: now,
    approvedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("application validation", () => {
  it("normalizes display name and optional bio", () => {
    expect(
      validateApplicationCreate({
        displayName: "  Akash Kumar  ",
        bio: "  Home repair work  ",
      }),
    ).toEqual({ displayName: "Akash Kumar", bio: "Home repair work" });
    expect(validateApplicationCreate({ displayName: "Akash" })).toEqual({
      displayName: "Akash",
      bio: null,
    });
  });

  it("rejects missing names and oversized bios", () => {
    expect(() => validateApplicationCreate({ displayName: "  " })).toThrow(
      "Display name must be between 1 and 120 characters",
    );
    expect(() =>
      validateApplicationCreate({ displayName: "Akash", bio: "x".repeat(1001) }),
    ).toThrow("Bio must be at most 1000 characters");
  });
});

describe("application mapping", () => {
  it("returns only own-facing fields", () => {
    const row = profileRow({ passwordHash: "never-export" });

    expect(toApplication(row)).toEqual({
      id: PROFILE_ID,
      userId: USER_ID,
      displayName: "Akash",
      bio: null,
      status: "pending",
      submittedAt: row.submittedAt,
      approvedAt: null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
    expect(toApplication(row)).not.toHaveProperty("isAvailable");
    expect(toOwnProviderProfile(row)).not.toHaveProperty("passwordHash");
    expect(toOwnProviderProfile(row).isAvailable).toBe(false);
  });
});

describe("application errors", () => {
  it("exposes sanitizable status and code", () => {
    const conflict = new ApplicationConflictError();
    const missing = new ProviderProfileNotFoundError();

    expect([conflict.code, conflict.status]).toEqual([
      "APPLICATION_EXISTS",
      409,
    ]);
    expect([missing.code, missing.status]).toEqual([
      "PROVIDER_PROFILE_NOT_FOUND",
      404,
    ]);
  });
});

describe("submitApplication", () => {
  const verifiedUser = { id: USER_ID, emailVerifiedAt: new Date() };

  it("creates a pending application with a submission timestamp", async () => {
    const now = new Date();
    const { database, state } = createFakeDatabase({ inserted: profileRow() });

    const result = await submitApplication(
      verifiedUser,
      { displayName: "Akash", bio: null },
      { database, now },
    );

    expect(state.inserts[0]).toMatchObject({
      userId: USER_ID,
      displayName: "Akash",
      status: "pending",
      submittedAt: now,
    });
    expect(result.status).toBe("pending");
  });

  it("rejects users without verified email before writing", async () => {
    const { database, state } = createFakeDatabase();

    await expect(
      submitApplication(
        { id: USER_ID, emailVerifiedAt: null },
        { displayName: "Akash", bio: null },
        { database },
      ),
    ).rejects.toBeInstanceOf(EmailVerificationRequiredError);
    expect(state.inserts).toHaveLength(0);
  });

  it("blocks duplicate applications for active profiles", async () => {
    const { database, state } = createFakeDatabase({
      existing: profileRow({ status: "approved" }),
    });

    await expect(
      submitApplication(
        verifiedUser,
        { displayName: "Akash", bio: null },
        { database },
      ),
    ).rejects.toBeInstanceOf(ApplicationConflictError);
    expect(state.inserts).toHaveLength(0);
    expect(state.updates).toHaveLength(0);
  });

  it("resubmits a rejected application as pending", async () => {
    const now = new Date();
    const existing = profileRow({
      status: "rejected",
      approvedAt: null,
      isAvailable: true,
    });
    const { database, state } = createFakeDatabase({
      existing,
      updated: profileRow({
        displayName: "Akash Kumar",
        bio: "Revised",
        status: "pending",
        isAvailable: false,
        submittedAt: now,
      }),
    });

    const result = await submitApplication(
      verifiedUser,
      { displayName: "Akash Kumar", bio: "Revised" },
      { database, now },
    );

    expect(state.updates[0]).toMatchObject({
      status: "pending",
      isAvailable: false,
      submittedAt: now,
      approvedAt: null,
    });
    expect(state.inserts).toHaveLength(0);
    expect(result.status).toBe("pending");
  });
});

describe("own provider reads", () => {
  it("throws when no profile exists", async () => {
    const { database } = createFakeDatabase();

    await expect(
      getOwnApplication({ id: USER_ID }, { database }),
    ).rejects.toBeInstanceOf(ProviderProfileNotFoundError);
    await expect(
      getOwnProviderProfile({ id: USER_ID }, { database }),
    ).rejects.toBeInstanceOf(ProviderProfileNotFoundError);
  });

  it("returns the current profile without email verification", async () => {
    const { database } = createFakeDatabase({ existing: profileRow() });

    const application = await getOwnApplication(
      { id: USER_ID, emailVerifiedAt: null },
      { database },
    );
    const profile = await getOwnProviderProfile(
      { id: USER_ID, emailVerifiedAt: null },
      { database },
    );

    expect(application.status).toBe("pending");
    expect(profile.isAvailable).toBe(false);
  });
});
