import { describe, expect, it } from "vitest";
import {
  AUDIT_ACTIONS,
  recordAdminAction,
  recordAuditEvent,
} from "@/modules/audit/audit.service.js";
import {
  validateDeletionRequest,
} from "@/modules/auth/auth.validation.js";
import {
  DeletionRequestPendingError,
  toDeletionRequestView,
} from "@/modules/users/deletion.service.js";

function fakeInsertDatabase(inserts) {
  return {
    insert: () => ({
      values: (values) => ({
        returning: async () => {
          inserts.push(values);
          return [{ id: `event-${inserts.length}`, ...values }];
        },
      }),
    }),
  };
}

describe("deletion request validation", () => {
  it("accepts an empty body and trims an optional reason", () => {
    expect(validateDeletionRequest({})).toEqual({ reason: null });
    expect(validateDeletionRequest({ reason: "  Moving away  " })).toEqual({
      reason: "Moving away",
    });
  });

  it("rejects invalid reason values", () => {
    expect(() => validateDeletionRequest([])).toThrow(
      "Request body must be a JSON object.",
    );
    expect(() => validateDeletionRequest({ reason: "x".repeat(501) })).toThrow(
      "Reason must be at most 500 characters.",
    );
    expect(() => validateDeletionRequest({ reason: 42 })).toThrow(
      "Reason must be at most 500 characters.",
    );
    expect(validateDeletionRequest({ reason: "   " })).toEqual({ reason: null });
  });

  it("exposes only public request fields", () => {
    const request = {
      id: "request-1",
      userId: "user-1",
      status: "pending",
      reason: "Moving away",
      requestedAt: new Date("2026-11-22T00:00:00.000Z"),
      reviewedAt: null,
      completedAt: null,
      secret: "should-not-leak",
    };

    expect(toDeletionRequestView(request)).toEqual({
      id: "request-1",
      status: "pending",
      reason: "Moving away",
      requestedAt: new Date("2026-11-22T00:00:00.000Z"),
      reviewedAt: null,
      completedAt: null,
    });
  });

  it("keeps the pending request failure typed", () => {
    expect(new DeletionRequestPendingError()).toMatchObject({
      code: "DELETION_REQUEST_PENDING",
      status: 409,
    });
  });
});

describe("audit service", () => {
  it("writes audit events with null-safe optional fields", async () => {
    const inserts = [];
    const event = await recordAuditEvent(
      {
        action: AUDIT_ACTIONS.DELETION_REQUEST_CREATED,
        entityType: "account_deletion_request",
        entityId: "request-1",
      },
      { database: fakeInsertDatabase(inserts) },
    );

    expect(event.id).toBe("event-1");
    expect(inserts[0]).toMatchObject({
      actorUserId: null,
      actorAdminProfileId: null,
      action: "account.deletion_request.created",
      entityType: "account_deletion_request",
      entityId: "request-1",
      requestId: null,
      metadata: {},
    });
  });

  it("derives the actor user from the admin profile", async () => {
    const inserts = [];
    const database = {
      ...fakeInsertDatabase(inserts),
      select: () => ({
        from: () => ({
          where: () => ({
            limit: async () => [{ userId: "user-9" }],
          }),
        }),
      }),
    };

    await recordAdminAction(
      {
        adminProfileId: "admin-9",
        action: AUDIT_ACTIONS.MFA_ENROLL,
        entityType: "admin_mfa_credential",
        entityId: "credential-9",
      },
      { database },
    );

    expect(inserts[0]).toMatchObject({
      actorUserId: "user-9",
      actorAdminProfileId: "admin-9",
      action: "admin.mfa.enroll",
    });
  });
});
