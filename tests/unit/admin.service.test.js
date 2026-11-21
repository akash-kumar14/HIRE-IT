import { describe, expect, it } from "vitest";
import {
  AdminBootstrapError,
  AdminTargetError,
  DuplicateAdminProfileError,
  toPublicAdminProfile,
} from "@/modules/admin/admin.service.js";

describe("admin service values", () => {
  it("keeps bootstrap and invite failures typed", () => {
    expect(new AdminBootstrapError()).toMatchObject({
      code: "ADMIN_BOOTSTRAP_NOT_ALLOWED",
      status: 409,
    });
    expect(new DuplicateAdminProfileError()).toMatchObject({
      code: "ADMIN_PROFILE_EXISTS",
      status: 409,
    });
    expect(new AdminTargetError()).toMatchObject({
      code: "ADMIN_TARGET_UNAVAILABLE",
      status: 422,
    });
  });

  it("returns only public profile fields", () => {
    const profile = {
      id: "admin-1",
      userId: "user-1",
      role: "admin",
      mfaEnrolledAt: null,
      createdAt: new Date("2026-11-21T00:00:00.000Z"),
      createdByUserId: "user-2",
      secret: "should-not-leak",
    };

    expect(toPublicAdminProfile(profile)).toEqual({
      id: "admin-1",
      userId: "user-1",
      role: "admin",
      mfaEnrolledAt: null,
      createdAt: new Date("2026-11-21T00:00:00.000Z"),
    });
  });
});
