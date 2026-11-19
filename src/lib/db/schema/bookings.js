import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { providerProfiles } from "./providers.js";
import { taskAssignments, taskLocations, tasks } from "./tasks.js";

export const bookingStatus = pgEnum("booking_status", [
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
]);

export const confirmationRole = pgEnum("confirmation_role", [
  "customer",
  "provider",
  "admin",
  "system",
]);

export const providerAvailability = pgTable(
  "provider_availability",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    providerProfileId: uuid("provider_profile_id")
      .notNull()
      .references(() => providerProfiles.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    timezone: text("timezone").notNull(),
    isAvailable: boolean("is_available").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("provider_availability_slot_unique").on(
      table.providerProfileId,
      table.dayOfWeek,
      table.startTime,
      table.endTime,
    ),
    index("provider_availability_provider_idx").on(table.providerProfileId),
    check(
      "provider_availability_day_of_week_range",
      sql`${table.dayOfWeek} between 0 and 6`,
    ),
    check(
      "provider_availability_time_order",
      sql`${table.startTime} < ${table.endTime}`,
    ),
  ],
);

export const availabilityExceptions = pgTable(
  "availability_exceptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    providerProfileId: uuid("provider_profile_id")
      .notNull()
      .references(() => providerProfiles.id, { onDelete: "cascade" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    isAvailable: boolean("is_available").notNull().default(false),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("availability_exceptions_provider_idx").on(table.providerProfileId),
    index("availability_exceptions_window_idx").on(
      table.providerProfileId,
      table.startsAt,
      table.endsAt,
    ),
    check(
      "availability_exceptions_time_order",
      sql`${table.endsAt} > ${table.startsAt}`,
    ),
  ],
);

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "restrict" }),
    assignmentId: uuid("assignment_id")
      .notNull()
      .references(() => taskAssignments.id, { onDelete: "restrict" }),
    providerProfileId: uuid("provider_profile_id")
      .notNull()
      .references(() => providerProfiles.id, { onDelete: "restrict" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    taskLocationId: uuid("task_location_id").references(() => taskLocations.id, {
      onDelete: "set null",
    }),
    status: bookingStatus("status").notNull().default("confirmed"),
    scheduledStart: timestamp("scheduled_start", { withTimezone: true })
      .notNull(),
    scheduledEnd: timestamp("scheduled_end", { withTimezone: true }).notNull(),
    timezone: text("timezone").notNull(),
    addressRevealedAt: timestamp("address_revealed_at", { withTimezone: true }),
    notes: text("notes"),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("bookings_one_active_per_task_unique")
      .on(table.taskId)
      .where(sql`${table.status} in ('confirmed', 'in_progress')`),
    index("bookings_provider_schedule_idx").on(
      table.providerProfileId,
      table.scheduledStart,
      table.scheduledEnd,
    ),
    index("bookings_customer_idx").on(table.customerId),
    index("bookings_assignment_idx").on(table.assignmentId),
    check("bookings_time_order", sql`${table.scheduledEnd} > ${table.scheduledStart}`),
  ],
);

export const completionConfirmations = pgTable(
  "completion_confirmations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "restrict" }),
    bookingId: uuid("booking_id").references(() => bookings.id, {
      onDelete: "restrict",
    }),
    confirmedByUserId: uuid("confirmed_by_user_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    confirmedByRole: confirmationRole("confirmed_by_role"),
    otpHash: text("otp_hash").notNull(),
    otpExpiresAt: timestamp("otp_expires_at", { withTimezone: true }).notNull(),
    otpConsumedAt: timestamp("otp_consumed_at", { withTimezone: true }),
    otpAttempts: integer("otp_attempts").notNull().default(0),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    escalatedAt: timestamp("escalated_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("completion_confirmations_task_unique").on(table.taskId),
    uniqueIndex("completion_confirmations_otp_hash_unique").on(table.otpHash),
    index("completion_confirmations_booking_idx").on(table.bookingId),
    check(
      "completion_confirmations_attempts_non_negative",
      sql`${table.otpAttempts} >= 0`,
    ),
    check(
      "completion_confirmations_confirmed_after_consumed",
      sql`${table.confirmedAt} is null or ${table.otpConsumedAt} is not null`,
    ),
  ],
);
