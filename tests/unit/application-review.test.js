import { describe, expect, it } from "vitest";
import { adminProfiles, auditLogs } from "@/lib/db/schema/users.js";
import { AUDIT_ACTIONS } from "@/modules/audit/audit.service.js";
import {
  ApplicationStateError,
  approveApplication,
  rejectApplication,
} from "@/modules/providers/application-review.service.js";
import {
  parseApplicationListQuery,
  validateApproveBody,
  validateRejectBody,
} from "@/modules/providers/application-review.validation.js";
import { ProviderProfileNotFoundError } from "@/modules/providers/provider-applications.service.js";

const APPLICATION_ID = "1e9c4b17-5a2d-4f68-8b10-7c6d9e2a4f31";
const ADMIN_PROFILE_ID = "7e9c4b17-5a2d-4f68-8b10-7c6d9e2a4f34";
const ADMIN_USER_ID = "8e9c4b17-5a2d-4f68-8b10-7c6d9e2a4f35";

function profileRow(status = "pending") {
  const now = new Date();

  return {
    id: APPLICATION_ID,
    userId: "9e9c4b17-5a2d-4f68-8b10-7c6d9e2a4f36",
    displayName: "Applicant",
    bio: "Cleaning services",
    status,
    isAvailable: true,
    submittedAt: now,
    approvedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

function createFakeDatabase({ status = "pending", exists = true, blocked = false } = {}) {
  const state = { updates: [], audits: [] };
  const current = profileRow(status);
  const database = {
    select: () => ({
      from: (table) => ({
        where: () => ({
          limit: async () =>
            table === adminProfiles
              ? [{ userId: ADMIN_USER_ID }]
              : exists
                ? [current]
                : [],
        }),
      }),
    }),
    update: () => ({
      set: (values) => ({
        where: () => ({
          returning: async () => {
            state.updates.push(values);
            return blocked ? [] : [{ ...current, ...values }];
          },
        }),
      }),
    }),
    insert: (table) => ({
      values: (values) => ({
        returning: async () => {
          if (table === auditLogs) {
            state.audits.push(values);
          }

          return [values];
        },
      }),
    }),
    transaction: async (callback) => callback(database),
  };

  return { database, state };
}

const context = {
  actorAdminProfileId: ADMIN_PROFILE_ID,
  requestId: "request-id",
};

describe("application review validation", () => {
  it("defaults to pending and accepts status filters", () => {
    expect(parseApplicationListQuery({})).toEqual({
      limit: 20,
      offset: 0,
      status: "pending",
    });
    expect(parseApplicationListQuery({ status: "all" }).status).toBe("all");
  });

  it("rejects invalid status filters and missing reasons", () => {
    expect(() => parseApplicationListQuery({ status: "unknown" })).toThrow(
      "Invalid status filter.",
    );
    expect(() => validateRejectBody({ reason: "   " })).toThrow(
      "Reason is required.",
    );
  });

  it("normalizes optional approve notes", () => {
    expect(validateApproveBody({ note: "  Verified by phone  " })).toEqual({
      note: "Verified by phone",
    });
  });
});

describe("application review decisions", () => {
  it("approves a pending application and records the decision", async () => {
    const { database, state } = createFakeDatabase();

    const result = await approveApplication(
      APPLICATION_ID,
      { note: "Meets requirements" },
      context,
      { database },
    );

    expect(result.status).toBe("approved");
    expect(result.approvedAt).toBeInstanceOf(Date);
    expect(state.updates[0]).toMatchObject({
      status: "approved",
      isAvailable: false,
    });
    expect(state.audits[0]).toMatchObject({
      actorAdminProfileId: ADMIN_PROFILE_ID,
      actorUserId: ADMIN_USER_ID,
      action: AUDIT_ACTIONS.PROVIDER_APPLICATION_APPROVE,
      entityType: "provider_application",
      entityId: APPLICATION_ID,
      metadata: { note: "Meets requirements" },
    });
  });

  it("rejects a pending application with an audited reason", async () => {
    const { database, state } = createFakeDatabase();

    const result = await rejectApplication(
      APPLICATION_ID,
      { reason: "Missing documents" },
      context,
      { database },
    );

    expect(result.status).toBe("rejected");
    expect(result.approvedAt).toBeNull();
    expect(state.audits[0].metadata).toEqual({ reason: "Missing documents" });
  });

  it("refuses to review an application that is no longer pending", async () => {
    const { database, state } = createFakeDatabase({ status: "approved" });

    await expect(
      rejectApplication(APPLICATION_ID, { reason: "Late" }, context, { database }),
    ).rejects.toBeInstanceOf(ApplicationStateError);
    expect(state.updates).toHaveLength(0);
    expect(state.audits).toHaveLength(0);
  });

  it("reports a missing application", async () => {
    const { database } = createFakeDatabase({ exists: false });

    await expect(
      approveApplication(APPLICATION_ID, {}, context, { database }),
    ).rejects.toBeInstanceOf(ProviderProfileNotFoundError);
  });
});
