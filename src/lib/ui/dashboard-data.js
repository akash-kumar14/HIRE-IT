import { getDb } from "@/lib/db/client.js";
import { listCategories } from "@/modules/categories/catalog.service.js";
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

export function countExpiredVerifications(verifications) {
  return verifications.filter((verification) => verification.isExpired).length;
}

export async function getCustomerDashboardData(user, options = {}) {
  const { database = getDb() } = options;
  const { items, total } = await listCategories({ limit: 5 }, { database });

  return {
    account: {
      email: user.email,
      fullName: user.fullName,
      emailVerifiedAt: user.emailVerifiedAt,
    },
    categories: items,
    categoryCount: total,
  };
}

export async function getProviderDashboardData(user, options = {}) {
  const { database = getDb() } = options;
  let profile;

  try {
    profile = await getOwnProviderProfile(user, { database });
  } catch (error) {
    if (!(error instanceof ProviderProfileNotFoundError)) throw error;
    profile = null;
  }

  if (!profile) {
    return {
      hasProfile: false,
      profile: null,
      verifications: [],
      serviceAreas: [],
      serviceAreaCount: 0,
      weeklySlots: [],
      isAvailable: false,
      expiredVerificationCount: 0,
    };
  }

  const [verifications, areas, availability] = await Promise.all([
    listOwnVerifications(user, { database }),
    listOwnServiceAreas(user, { limit: 5 }, { database }),
    getOwnAvailability(user, { database }),
  ]);

  return {
    hasProfile: true,
    profile,
    verifications,
    serviceAreas: areas.items,
    serviceAreaCount: areas.total,
    weeklySlots: availability.weeklySlots,
    isAvailable: availability.isAvailable,
    expiredVerificationCount: countExpiredVerifications(verifications),
  };
}

export async function getAdminDashboardData(options = {}) {
  const { database = getDb() } = options;
  const [applications, categories] = await Promise.all([
    listApplications({ status: "pending", limit: 5, offset: 0 }, { database }),
    listCategories({ limit: 5 }, { database }),
  ]);

  return {
    pendingApplications: applications.items,
    pendingCount: applications.total,
    categories: categories.items,
    categoryCount: categories.total,
  };
}
