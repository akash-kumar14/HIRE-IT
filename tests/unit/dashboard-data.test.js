import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  countExpiredVerifications,
  getAdminDashboardData,
  getCustomerDashboardData,
  getProviderDashboardData,
} from "@/lib/ui/dashboard-data.js";
import { listApplications } from "@/modules/providers/application-review.service.js";
import {
  ProviderProfileNotFoundError,
  getOwnProviderProfile,
} from "@/modules/providers/provider-applications.service.js";
import { listOwnVerifications } from "@/modules/providers/verification.service.js";
import {
  getOwnAvailability,
  listOwnServiceAreas,
} from "@/modules/providers/provider-settings.service.js";
import { listCategories } from "@/modules/categories/catalog.service.js";

vi.mock("@/modules/categories/catalog.service.js", () => ({
  listCategories: vi.fn(),
}));
vi.mock("@/modules/providers/application-review.service.js", () => ({
  listApplications: vi.fn(),
}));
vi.mock("@/modules/providers/provider-applications.service.js", () => ({
  ProviderProfileNotFoundError: class ProviderProfileNotFoundError extends Error {},
  getOwnProviderProfile: vi.fn(),
}));
vi.mock("@/modules/providers/verification.service.js", () => ({
  listOwnVerifications: vi.fn(),
}));
vi.mock("@/modules/providers/provider-settings.service.js", () => ({
  getOwnAvailability: vi.fn(),
  listOwnServiceAreas: vi.fn(),
}));

const user = {
  id: "user-1",
  email: "user@example.com",
  fullName: "Test User",
  emailVerifiedAt: new Date("2026-11-27T00:00:00.000Z"),
};
const database = { name: "fake-database" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("role dashboard data", () => {
  it("builds customer data from active categories", async () => {
    listCategories.mockResolvedValue({
      items: [{ id: "category-1", name: "Plumbing" }],
      total: 4,
    });

    const result = await getCustomerDashboardData(user, { database });

    expect(listCategories).toHaveBeenCalledWith({ limit: 5 }, { database });
    expect(result).toMatchObject({
      account: { email: user.email, fullName: user.fullName },
      categoryCount: 4,
    });
    expect(result.categories).toHaveLength(1);
  });

  it("returns an empty provider dashboard when no application exists", async () => {
    getOwnProviderProfile.mockRejectedValue(new ProviderProfileNotFoundError());

    const result = await getProviderDashboardData(user, { database });

    expect(result).toMatchObject({
      hasProfile: false,
      profile: null,
      verifications: [],
      serviceAreas: [],
      expiredVerificationCount: 0,
    });
    expect(listOwnVerifications).not.toHaveBeenCalled();
    expect(listOwnServiceAreas).not.toHaveBeenCalled();
    expect(getOwnAvailability).not.toHaveBeenCalled();
  });

  it("aggregates provider verification, area, and availability data", async () => {
    getOwnProviderProfile.mockResolvedValue({
      id: "profile-1",
      status: "approved",
      displayName: "Trusted Home Care",
      isAvailable: true,
    });
    listOwnVerifications.mockResolvedValue([
      { id: "verification-1", isExpired: false },
      { id: "verification-2", isExpired: true },
    ]);
    listOwnServiceAreas.mockResolvedValue({
      items: [{ id: "area-1", label: "Agra", isPrimary: true }],
      total: 2,
    });
    getOwnAvailability.mockResolvedValue({
      isAvailable: true,
      weeklySlots: [{ id: "slot-1" }],
    });

    const result = await getProviderDashboardData(user, { database });

    expect(result).toMatchObject({
      hasProfile: true,
      serviceAreaCount: 2,
      isAvailable: true,
      expiredVerificationCount: 1,
    });
    expect(result.verifications).toHaveLength(2);
    expect(result.weeklySlots).toHaveLength(1);
  });

  it("builds admin data from pending reviews and active categories", async () => {
    listApplications.mockResolvedValue({
      items: [{ id: "application-1", status: "pending" }],
      total: 7,
    });
    listCategories.mockResolvedValue({
      items: [{ id: "category-1", name: "Plumbing" }],
      total: 4,
    });

    const result = await getAdminDashboardData({ database });

    expect(listApplications).toHaveBeenCalledWith(
      { status: "pending", limit: 5, offset: 0 },
      { database },
    );
    expect(result).toMatchObject({
      pendingCount: 7,
      categoryCount: 4,
    });
    expect(result.pendingApplications).toHaveLength(1);
  });

  it("counts expired verifications without mutating input", () => {
    const verifications = [
      { id: "v1", isExpired: false },
      { id: "v2", isExpired: true },
      { id: "v3", isExpired: true },
    ];

    expect(countExpiredVerifications(verifications)).toBe(2);
    expect(verifications).toHaveLength(3);
  });
});
