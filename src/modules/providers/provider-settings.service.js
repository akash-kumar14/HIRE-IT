import { and, asc, count, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client.js";
import {
  providerServiceAreas,
  providerProfiles,
} from "@/lib/db/schema/providers.js";
import {
  ProviderProfileNotFoundError,
  findProviderProfileByUserId,
} from "@/modules/providers/provider-applications.service.js";
import { providerAvailability } from "@/lib/db/schema/bookings.js";

export class ServiceAreaNotFoundError extends Error {
  constructor(message = "Service area not found.") {
    super(message);
    this.name = "ServiceAreaNotFoundError";
    this.code = "SERVICE_AREA_NOT_FOUND";
    this.status = 404;
  }
}

export class ProviderNotApprovedError extends Error {
  constructor(message = "Provider is not approved.") {
    super(message);
    this.name = "ProviderNotApprovedError";
    this.code = "PROVIDER_NOT_APPROVED";
    this.status = 403;
  }
}

export function toServiceArea(area) {
  return {
    id: area.id,
    label: area.label,
    latitude: area.latitude,
    longitude: area.longitude,
    radiusMeters: area.radiusMeters,
    isPrimary: area.isPrimary,
    createdAt: area.createdAt,
    updatedAt: area.updatedAt,
  };
}

export function toWeeklySlot(slot) {
  return {
    id: slot.id,
    dayOfWeek: slot.dayOfWeek,
    startTime: slot.startTime,
    endTime: slot.endTime,
    timezone: slot.timezone,
    isAvailable: slot.isAvailable,
  };
}

export function toOwnAvailability(profile, slots) {
  return {
    isAvailable: profile.isAvailable,
    weeklySlots: slots.map(toWeeklySlot),
  };
}

async function requireOwnProfile(user, database) {
  const profile = await findProviderProfileByUserId(user.id, { database });

  if (!profile) {
    throw new ProviderProfileNotFoundError();
  }

  return profile;
}

function requireApproved(profile) {
  if (profile.status !== "approved") {
    throw new ProviderNotApprovedError();
  }
}

export async function listOwnServiceAreas(
  user,
  { limit = 20, offset = 0 } = {},
  options = {},
) {
  const { database = getDb() } = options;
  const profile = await requireOwnProfile(user, database);
  const filter = eq(providerServiceAreas.providerProfileId, profile.id);
  const rows = await database
    .select()
    .from(providerServiceAreas)
    .where(filter)
    .orderBy(desc(providerServiceAreas.isPrimary), asc(providerServiceAreas.label))
    .limit(limit)
    .offset(offset);
  const [{ total }] = await database
    .select({ total: count() })
    .from(providerServiceAreas)
    .where(filter);

  return { items: rows.map(toServiceArea), total };
}

export async function createOwnServiceArea(user, input, options = {}) {
  const { database = getDb(), now = new Date() } = options;
  const profile = await requireOwnProfile(user, database);

  return database.transaction(async (tx) => {
    if (input.isPrimary) {
      await tx
        .update(providerServiceAreas)
        .set({ isPrimary: false, updatedAt: now })
        .where(eq(providerServiceAreas.providerProfileId, profile.id));
    }

    const [created] = await tx
      .insert(providerServiceAreas)
      .values({
        providerProfileId: profile.id,
        ...input,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return toServiceArea(created);
  });
}

export async function deleteOwnServiceArea(user, areaId, options = {}) {
  const { database = getDb() } = options;
  const profile = await requireOwnProfile(user, database);
  const [deleted] = await database
    .delete(providerServiceAreas)
    .where(
      and(
        eq(providerServiceAreas.id, areaId),
        eq(providerServiceAreas.providerProfileId, profile.id),
      ),
    )
    .returning();

  if (!deleted) {
    throw new ServiceAreaNotFoundError();
  }

  return toServiceArea(deleted);
}

export async function getOwnAvailability(user, options = {}) {
  const { database = getDb() } = options;
  const profile = await requireOwnProfile(user, database);
  const slots = await database
    .select()
    .from(providerAvailability)
    .where(eq(providerAvailability.providerProfileId, profile.id))
    .orderBy(asc(providerAvailability.dayOfWeek), asc(providerAvailability.startTime));

  return toOwnAvailability(profile, slots);
}

export async function setOwnAvailability(user, input, options = {}) {
  const { database = getDb() } = options;
  const profile = await requireOwnProfile(user, database);

  if (input.isAvailable) {
    requireApproved(profile);
  }

  const [updated] = await database
    .update(providerProfiles)
    .set({ isAvailable: input.isAvailable })
    .where(eq(providerProfiles.id, profile.id))
    .returning();

  return { isAvailable: updated.isAvailable };
}

export async function replaceWeeklyAvailability(user, input, options = {}) {
  const { database = getDb(), now = new Date() } = options;
  const profile = await requireOwnProfile(user, database);

  requireApproved(profile);

  const slots = await database.transaction(async (tx) => {
    await tx
      .delete(providerAvailability)
      .where(eq(providerAvailability.providerProfileId, profile.id));

    if (input.slots.length === 0) return [];

    return tx
      .insert(providerAvailability)
      .values(
        input.slots.map((slot) => ({
          providerProfileId: profile.id,
          ...slot,
          createdAt: now,
          updatedAt: now,
        })),
      )
      .returning();
  });

  return { weeklySlots: slots.map(toWeeklySlot) };
}
