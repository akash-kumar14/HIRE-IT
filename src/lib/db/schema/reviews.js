import { sql } from "drizzle-orm";
import {
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
import { tasks } from "./tasks.js";

export const reviewStatus = pgEnum("review_status", [
  "published",
  "hidden",
  "removed",
]);

export const reviewReportStatus = pgEnum("review_report_status", [
  "open",
  "investigating",
  "resolved",
  "dismissed",
]);

export const moderationCaseStatus = pgEnum("moderation_case_status", [
  "open",
  "investigating",
  "resolved",
  "dismissed",
]);

export const moderationSeverity = pgEnum("moderation_severity", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "restrict" }),
    authorUserId: uuid("author_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    providerProfileId: uuid("provider_profile_id")
      .notNull()
      .references(() => providerProfiles.id, { onDelete: "restrict" }),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    status: reviewStatus("status").notNull().default("published"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("reviews_task_author_unique").on(table.taskId, table.authorUserId),
    index("reviews_provider_idx").on(table.providerProfileId),
    index("reviews_status_idx").on(table.status),
    check("reviews_rating_range", sql`${table.rating} between 1 and 5`),
  ],
);

export const reviewReports = pgTable(
  "review_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reviewId: uuid("review_id")
      .notNull()
      .references(() => reviews.id, { onDelete: "cascade" }),
    reporterUserId: uuid("reporter_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    reason: text("reason").notNull(),
    details: text("details"),
    status: reviewReportStatus("status").notNull().default("open"),
    resolvedByAdminId: uuid("resolved_by_admin_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("review_reports_review_reporter_unique").on(
      table.reviewId,
      table.reporterUserId,
    ),
    index("review_reports_status_idx").on(table.status),
  ],
);

export const moderationCases = pgTable(
  "moderation_cases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reviewReportId: uuid("review_report_id").references(() => reviewReports.id, {
      onDelete: "set null",
    }),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: "set null" }),
    subjectUserId: uuid("subject_user_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    providerProfileId: uuid("provider_profile_id").references(
      () => providerProfiles.id,
      { onDelete: "restrict" },
    ),
    severity: moderationSeverity("severity").notNull().default("low"),
    status: moderationCaseStatus("status").notNull().default("open"),
    assignedAdminId: uuid("assigned_admin_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    summary: text("summary").notNull(),
    resolution: text("resolution"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("moderation_cases_status_idx").on(table.status),
    index("moderation_cases_severity_idx").on(table.severity),
    index("moderation_cases_assigned_admin_idx").on(table.assignedAdminId),
  ],
);
