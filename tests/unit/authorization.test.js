import { describe, expect, it } from "vitest";
import {
  AccountStatusError,
  AdminPermissionError,
  assertAdmin,
  assertCustomerOwnsTask,
  assertOwnedBy,
  assertProviderOwnsOffer,
  assertSuperAdmin,
  AuthenticationError,
  AuthorizationError,
  ForbiddenError,
} from "@/modules/auth/authorization.js";

describe("authorization errors", () => {
  it("carries stable codes and HTTP statuses", () => {
    expect(new AuthenticationError()).toMatchObject({
      name: "AuthorizationError",
      code: "AUTHENTICATION_REQUIRED",
      status: 401,
    });
    expect(new AccountStatusError()).toMatchObject({
      code: "ACCOUNT_SUSPENDED",
      status: 403,
    });
    expect(new ForbiddenError()).toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });
    expect(new AdminPermissionError()).toMatchObject({
      code: "ADMIN_ACCESS_REQUIRED",
      status: 403,
    });
    expect(new AuthenticationError()).toBeInstanceOf(AuthorizationError);
  });
});

describe("ownership helpers", () => {
  it("allows the owner of a generic resource", () => {
    const resource = { id: "task-1", userId: "user-1" };
    expect(assertOwnedBy(resource, "user-1")).toBe(resource);
  });

  it("rejects another user and missing resources", () => {
    expect(() => assertOwnedBy({ userId: "user-1" }, "user-2")).toThrow(
      ForbiddenError,
    );
    expect(() => assertOwnedBy(null, "user-1")).toThrow(ForbiddenError);
  });

  it("requires an authenticated subject", () => {
    expect(() => assertOwnedBy({ userId: null }, null)).toThrow(
      AuthenticationError,
    );
  });

  it("checks task customer and offer provider ownership", () => {
    const task = { id: "task-1", customerId: "user-1" };
    const offer = { id: "offer-1", providerProfileId: "provider-1" };

    expect(assertCustomerOwnsTask(task, "user-1")).toBe(task);
    expect(() => assertCustomerOwnsTask(task, "user-2")).toThrow(ForbiddenError);

    expect(assertProviderOwnsOffer(offer, "provider-1")).toBe(offer);
    expect(() => assertProviderOwnsOffer(offer, "provider-2")).toThrow(
      ForbiddenError,
    );
  });
});

describe("admin assertions", () => {
  it("requires an admin profile", () => {
    const profile = { id: "admin-1", role: "admin" };
    expect(assertAdmin(profile)).toBe(profile);
    expect(() => assertAdmin(null)).toThrow(AdminPermissionError);
  });

  it("requires super-admin role for privileged actions", () => {
    const superAdmin = { id: "admin-1", role: "super_admin" };
    expect(assertSuperAdmin(superAdmin)).toBe(superAdmin);
    expect(() => assertSuperAdmin({ id: "admin-2", role: "admin" })).toThrow(
      AdminPermissionError,
    );
  });
});
