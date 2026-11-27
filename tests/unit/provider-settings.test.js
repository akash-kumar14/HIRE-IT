import { describe, expect, it } from "vitest";
import { providerAvailability } from "@/lib/db/schema/bookings.js";
import {
  providerProfiles,
  providerServiceAreas,
} from "@/lib/db/schema/providers.js";
import { ProviderProfileNotFoundError } from "@/modules/providers/provider-applications.service.js";
import {
  ProviderNotApprovedError,
  ServiceAreaNotFoundError,
  createOwnServiceArea,
  deleteOwnServiceArea,
  getOwnAvailability,
  replaceWeeklyAvailability,
  setOwnAvailability,
} from "@/modules/providers/provider-settings.service.js";
import {
  validateAvailabilityToggle,
  validateServiceAreaCreate,
  validateWeeklyAvailability,
} from "@/modules/providers/provider-settings.validation.js";

const USER_ID = "6e9c4b17-5a2d-4f68-8b10-7c6d9e2a4f31";
const PROFILE_ID = "7e9c4b17-5a2d-4f68-8b10-7c6d9e2a4f32";
const AREA_ID = "8e9c4b17-5a2d-4f68-8b10-7c6d9e2a4f33";
const user = { id: USER_ID };

function rowsResult(rows) {
  return {
    then: (resolve, reject) => Promise.resolve(rows).then(resolve, reject),
    orderBy: () => rowsResult(rows),
    limit: () => rowsResult(rows),
    offset: () => rowsResult(rows),
  };
}

function mutationResult(rows) {
  return {
    then: (resolve, reject) => Promise.resolve(rows).then(resolve, reject),
    returning: async () => rows,
  };
}

function createFakeDatabase({
  status = "approved",
  hasProfile = true,
  areas = [],
  slots = [],
  areaExists = true,
} = {}) {
  const now = new Date();
  const profile = {
    id: PROFILE_ID,
    userId: USER_ID,
    displayName: "Provider",
    status,
    isAvailable: false,
    createdAt: now,
    updatedAt: now,
  };
  const state = {
    operations: [],
    profileUpdates: [],
    areaUpdates: [],
    insertedAreas: [],
    insertedSlots: [],
  };
  const database = {
    select: (fields) => ({
      from: (table) => {
        let rows = [];

        if (table === providerProfiles) rows = hasProfile ? [profile] : [];
        if (table === providerServiceAreas) {
          rows = fields?.total ? [{ total: areas.length }] : areas;
        }
        if (table === providerAvailability) {
          rows = fields?.total ? [{ total: slots.length }] : slots;
        }

        return { where: () => rowsResult(rows) };
      },
    }),
    update: (table) => ({
      set: (values) => ({
        where: () => {
          if (table === providerProfiles) {
            state.profileUpdates.push(values);
            return mutationResult([{ ...profile, ...values }]);
          }

          state.areaUpdates.push(values);
          return mutationResult([]);
        },
      }),
    }),
    delete: () => ({
      where: () => {
        state.operations.push("delete");
        return mutationResult([]);
      },
    }),
    insert: (table) => ({
      values: (values) => ({
        returning: async () => {
          state.operations.push("insert");
          const rows = Array.isArray(values) ? values : [values];

          if (table === providerServiceAreas) state.insertedAreas.push(...rows);
          if (table === providerAvailability) state.insertedSlots.push(...rows);

          return rows.map((row, index) => ({
            id: `${AREA_ID.slice(0, -1)}${index}`,
            ...row,
          }));
        },
      }),
    }),
    transaction: async (callback) => callback(database),
  };

  return { database, profile, state };
}

const serviceAreaInput = {
  label: "Agra Cantt",
  latitude: "27.17667",
  longitude: "78.00807",
  radiusMeters: 5000,
  isPrimary: true,
};

const weeklyInput = {
  slots: [
    {
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "18:00",
      timezone: "Asia/Kolkata",
      isAvailable: true,
    },
  ],
};

describe("provider settings validation", () => {
  it("normalizes service area coordinates and booleans", () => {
    expect(validateServiceAreaCreate(serviceAreaInput)).toEqual(serviceAreaInput);
    expect(
      validateServiceAreaCreate({ ...serviceAreaInput, latitude: 27.17667, isPrimary: undefined }),
    ).toMatchObject({ latitude: "27.17667", isPrimary: false });
  });

  it("rejects invalid service areas", () => {
    expect(() =>
      validateServiceAreaCreate({ ...serviceAreaInput, radiusMeters: 0 }),
    ).toThrow("Radius must be an integer between 1 and 100000 meters.");
    expect(() =>
      validateServiceAreaCreate({ ...serviceAreaInput, latitude: 91 }),
    ).toThrow("Latitude is out of range.");
  });

  it("requires a boolean availability toggle", () => {
    expect(validateAvailabilityToggle({ isAvailable: false })).toEqual({
      isAvailable: false,
    });
    expect(() => validateAvailabilityToggle({ isAvailable: "yes" })).toThrow(
      "Is available must be a boolean.",
    );
  });

  it("validates weekly slots and rejects duplicate times", () => {
    expect(validateWeeklyAvailability(weeklyInput)).toEqual(weeklyInput);

    const slot = weeklyInput.slots[0];

    expect(() =>
      validateWeeklyAvailability({ slots: [slot, slot] }),
    ).toThrow("Duplicate weekly slots are not allowed.");
    expect(() =>
      validateWeeklyAvailability({
        slots: [{ ...slot, startTime: "18:00", endTime: "09:00" }],
      }),
    ).toThrow("End time must be after start time.");
    expect(() =>
      validateWeeklyAvailability({ slots: [{ ...slot, timezone: "Mars/Base" }] }),
    ).toThrow("Timezone must be a valid IANA timezone.");
  });
});

describe("provider settings services", () => {
  it("clears an existing primary area before inserting a new one", async () => {
    const { database, state } = createFakeDatabase();

    const created = await createOwnServiceArea(user, serviceAreaInput, { database });

    expect(created).toMatchObject({
      label: "Agra Cantt",
      latitude: "27.17667",
      isPrimary: true,
    });
    expect(state.areaUpdates).toEqual([
      { isPrimary: false, updatedAt: expect.any(Date) },
    ]);
    expect(state.insertedAreas[0]).toMatchObject({
      providerProfileId: PROFILE_ID,
      isPrimary: true,
    });
  });

  it("only deletes service areas owned by the provider", async () => {
    const { database } = createFakeDatabase({ areaExists: false });

    await expect(deleteOwnServiceArea(user, AREA_ID, { database })).rejects.toBeInstanceOf(
      ServiceAreaNotFoundError,
    );
  });

  it("refuses to enable availability before approval but allows disabling", async () => {
    const pending = createFakeDatabase({ status: "pending" });

    await expect(
      setOwnAvailability(user, { isAvailable: true }, { database: pending.database }),
    ).rejects.toBeInstanceOf(ProviderNotApprovedError);
    expect(pending.state.profileUpdates).toHaveLength(0);

    const approved = createFakeDatabase();
    await expect(
      setOwnAvailability(user, { isAvailable: false }, { database: approved.database }),
    ).resolves.toEqual({ isAvailable: false });
    expect(approved.state.profileUpdates).toEqual([{ isAvailable: false }]);
  });

  it("replaces weekly slots in one transaction and can clear them", async () => {
    const { database, state } = createFakeDatabase();

    const result = await replaceWeeklyAvailability(user, weeklyInput, { database });

    expect(state.operations).toEqual(["delete", "insert"]);
    expect(result.weeklySlots[0]).toMatchObject({
      dayOfWeek: 1,
      startTime: "09:00",
      timezone: "Asia/Kolkata",
    });

    const cleared = createFakeDatabase();
    await expect(
      replaceWeeklyAvailability(user, { slots: [] }, { database: cleared.database }),
    ).resolves.toEqual({ weeklySlots: [] });
    expect(cleared.state.operations).toEqual(["delete"]);
  });

  it("maps own availability and reports missing profiles", async () => {
    const slots = [
      {
        id: AREA_ID,
        dayOfWeek: 2,
        startTime: "10:00",
        endTime: "14:00",
        timezone: "Asia/Kolkata",
        isAvailable: true,
      },
    ];
    const { database } = createFakeDatabase({ slots });

    await expect(getOwnAvailability(user, { database })).resolves.toEqual({
      isAvailable: false,
      weeklySlots: slots,
    });

    const missing = createFakeDatabase({ hasProfile: false });
    await expect(getOwnAvailability(user, { database: missing.database })).rejects.toBeInstanceOf(
      ProviderProfileNotFoundError,
    );
  });
});
