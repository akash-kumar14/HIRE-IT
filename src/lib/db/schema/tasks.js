import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  boolean,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";
import {
  providerProfiles,
  serviceCategories,
  skills,
  verificationRequirements,
} from "./providers.js";

export const taskStatus = pgEnum("task_status", [
  "draft",
  "published",
  "matching",
  "offers_received",
  "assigned",
  "in_progress",
  "completed",
  "disputed",
  "cancelled",
]);

export const taskMode = pgEnum("task_mode", ["on_site", "remote"]);

export const requirementType = pgEnum("requirement_type", [
  "skill",
  "qualification",
  "equipment",
  "access",
  "other",
]);

export const locationType = pgEnum("location_type", [
  "service",
  "pickup",
  "dropoff",
]);

export const matchRunStatus = pgEnum("match_run_status", [
  "pending",
  "running",
  "completed",
  "failed",
]);

export const matchCandidateStatus = pgEnum("match_candidate_status", [
  "candidate",
  "notified",
  "offered",
  "skipped",
]);

export const offerStatus = pgEnum("offer_status", [
  "submitted",
  "accepted",
  "declined",
  "withdrawn",
  "expired",
]);

export const assignmentStatus = pgEnum("assignment_status", [
  "active",
  "completed",
  "cancelled",
]);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    title: text("title"),
    originalDescription: text("original_description").notNull(),
    interpretedDescription: text("interpreted_description"),
    categoryId: uuid("category_id").references(() => serviceCategories.id, {
      onDelete: "set null",
    }),
    primarySkillId: uuid("primary_skill_id").references(() => skills.id, {
      onDelete: "set null",
    }),
    status: taskStatus("status").notNull().default("draft"),
    mode: taskMode("mode").notNull().default("on_site"),
    budgetMinorUnits: integer("budget_minor_units").notNull(),
    currency: text("currency").notNull().default("INR"),
    budgetNegotiable: boolean("budget_negotiable").notNull().default(false),
    scheduledStart: timestamp("scheduled_start", { withTimezone: true }),
    scheduledEnd: timestamp("scheduled_end", { withTimezone: true }),
    timezone: text("timezone"),
    metadata: jsonb("metadata").notNull().default({}),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("tasks_customer_idx").on(table.customerId),
    index("tasks_status_idx").on(table.status),
    index("tasks_category_idx").on(table.categoryId),
    index("tasks_primary_skill_idx").on(table.primarySkillId),
    index("tasks_created_at_idx").on(table.createdAt),
    check("tasks_budget_non_negative", sql`${table.budgetMinorUnits} >= 0`),
    check(
      "tasks_schedule_order",
      sql`${table.scheduledStart} is null or ${table.scheduledEnd} is null or ${table.scheduledEnd} > ${table.scheduledStart}`,
    ),
  ],
);

export const taskRequirements = pgTable(
  "task_requirements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    type: requirementType("type").notNull().default("other"),
    skillId: uuid("skill_id").references(() => skills.id, {
      onDelete: "set null",
    }),
    verificationRequirementId: uuid("verification_requirement_id").references(
      () => verificationRequirements.id,
      { onDelete: "set null" },
    ),
    description: text("description").notNull(),
    isRequired: boolean("is_required").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("task_requirements_task_idx").on(table.taskId)],
);

export const taskLocations = pgTable(
  "task_locations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    type: locationType("type").notNull().default("service"),
    label: text("label"),
    addressLine1: text("address_line_1").notNull(),
    addressLine2: text("address_line_2"),
    city: text("city"),
    state: text("state"),
    postalCode: text("postal_code"),
    latitude: numeric("latitude", { precision: 10, scale: 7 }).notNull(),
    longitude: numeric("longitude", { precision: 10, scale: 7 }).notNull(),
    isPrimary: boolean("is_primary").notNull().default(false),
    revealedAt: timestamp("revealed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("task_locations_task_idx").on(table.taskId),
    index("task_locations_geo_idx").on(table.latitude, table.longitude),
    check(
      "task_locations_latitude_range",
      sql`${table.latitude} between -90 and 90`,
    ),
    check(
      "task_locations_longitude_range",
      sql`${table.longitude} between -180 and 180`,
    ),
  ],
);

export const taskAttachments = pgTable(
  "task_attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    uploaderUserId: uuid("uploader_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    objectKey: text("object_key").notNull(),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("task_attachments_task_idx").on(table.taskId),
    check("task_attachments_size_positive", sql`${table.sizeBytes} > 0`),
  ],
);

export const matchRuns = pgTable(
  "match_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    status: matchRunStatus("status").notNull().default("pending"),
    algorithmVersion: text("algorithm_version").notNull().default("v1"),
    weights: jsonb("weights").notNull().default({}),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("match_runs_task_idx").on(table.taskId),
    index("match_runs_status_idx").on(table.status),
  ],
);

export const matchCandidates = pgTable(
  "match_candidates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    matchRunId: uuid("match_run_id")
      .notNull()
      .references(() => matchRuns.id, { onDelete: "cascade" }),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    providerProfileId: uuid("provider_profile_id")
      .notNull()
      .references(() => providerProfiles.id, { onDelete: "restrict" }),
    status: matchCandidateStatus("status").notNull().default("candidate"),
    rank: integer("rank").notNull(),
    score: numeric("score", { precision: 5, scale: 2 }).notNull(),
    scoreBreakdown: jsonb("score_breakdown").notNull().default({}),
    eligibilityDetails: jsonb("eligibility_details").notNull().default({}),
    distanceMeters: integer("distance_meters"),
    notifiedAt: timestamp("notified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("match_candidates_run_provider_unique").on(
      table.matchRunId,
      table.providerProfileId,
    ),
    index("match_candidates_task_rank_idx").on(table.taskId, table.rank),
    index("match_candidates_profile_idx").on(table.providerProfileId),
    check("match_candidates_rank_positive", sql`${table.rank} > 0`),
  ],
);

export const offers = pgTable(
  "offers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "restrict" }),
    providerProfileId: uuid("provider_profile_id")
      .notNull()
      .references(() => providerProfiles.id, { onDelete: "restrict" }),
    status: offerStatus("status").notNull().default("submitted"),
    amountMinorUnits: integer("amount_minor_units").notNull(),
    currency: text("currency").notNull().default("INR"),
    message: text("message"),
    validUntil: timestamp("valid_until", { withTimezone: true }),
    terms: jsonb("terms").notNull().default({}),
    agreedAmountMinorUnits: integer("agreed_amount_minor_units"),
    agreedCurrency: text("agreed_currency"),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    declinedAt: timestamp("declined_at", { withTimezone: true }),
    withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("offers_task_provider_submitted_unique")
      .on(table.taskId, table.providerProfileId)
      .where(sql`${table.status} = 'submitted'`),
    index("offers_task_idx").on(table.taskId),
    index("offers_provider_idx").on(table.providerProfileId),
    index("offers_status_idx").on(table.status),
    check("offers_amount_positive", sql`${table.amountMinorUnits} > 0`),
  ],
);

export const taskAssignments = pgTable(
  "task_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "restrict" }),
    offerId: uuid("offer_id")
      .notNull()
      .references(() => offers.id, { onDelete: "restrict" }),
    providerProfileId: uuid("provider_profile_id")
      .notNull()
      .references(() => providerProfiles.id, { onDelete: "restrict" }),
    status: assignmentStatus("status").notNull().default("active"),
    agreedAmountMinorUnits: integer("agreed_amount_minor_units").notNull(),
    currency: text("currency").notNull().default("INR"),
    agreedTerms: jsonb("agreed_terms").notNull().default({}),
    assignedAt: timestamp("assigned_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    releasedAt: timestamp("released_at", { withTimezone: true }),
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
    uniqueIndex("task_assignments_one_active_unique")
      .on(table.taskId)
      .where(sql`${table.status} = 'active'`),
    index("task_assignments_provider_idx").on(table.providerProfileId),
    index("task_assignments_offer_idx").on(table.offerId),
    check(
      "task_assignments_agreed_amount_positive",
      sql`${table.agreedAmountMinorUnits} > 0`,
    ),
  ],
);
