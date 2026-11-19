import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { tasks } from "./tasks.js";

export const jobStatus = pgEnum("job_status", [
  "pending",
  "claimed",
  "running",
  "succeeded",
  "failed",
  "dead",
]);

export const aiOutcome = pgEnum("ai_outcome", [
  "success",
  "fallback",
  "validation_failed",
  "rate_limited",
  "error",
]);

export const platformSettingValueType = pgEnum("platform_setting_value_type", [
  "string",
  "number",
  "boolean",
  "json",
]);

export const backgroundJobs = pgTable(
  "background_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: text("type").notNull(),
    payload: jsonb("payload").notNull().default({}),
    status: jobStatus("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(5),
    priority: integer("priority").notNull().default(0),
    idempotencyKey: text("idempotency_key"),
    availableAt: timestamp("available_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true }),
    claimedBy: text("claimed_by"),
    lastError: text("last_error"),
    result: jsonb("result"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("background_jobs_type_idempotency_unique")
      .on(table.type, table.idempotencyKey)
      .where(sql`${table.idempotencyKey} is not null`),
    index("background_jobs_ready_idx").on(table.status, table.availableAt),
    index("background_jobs_lease_idx").on(table.leaseExpiresAt),
    index("background_jobs_type_idx").on(table.type),
    check("background_jobs_attempts_non_negative", sql`${table.attempts} >= 0`),
    check("background_jobs_max_attempts_positive", sql`${table.maxAttempts} > 0`),
  ],
);

export const aiUsageRecords = pgTable(
  "ai_usage_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: "set null" }),
    operation: text("operation").notNull(),
    model: text("model").notNull(),
    promptTokens: integer("prompt_tokens").notNull().default(0),
    completionTokens: integer("completion_tokens").notNull().default(0),
    totalTokens: integer("total_tokens").notNull().default(0),
    outcome: aiOutcome("outcome").notNull(),
    latencyMs: integer("latency_ms"),
    error: text("error"),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("ai_usage_records_user_idx").on(table.userId),
    index("ai_usage_records_task_idx").on(table.taskId),
    index("ai_usage_records_operation_idx").on(table.operation),
    index("ai_usage_records_outcome_idx").on(table.outcome),
    index("ai_usage_records_created_idx").on(table.createdAt),
    check("ai_usage_records_prompt_tokens_non_negative", sql`${table.promptTokens} >= 0`),
    check(
      "ai_usage_records_completion_tokens_non_negative",
      sql`${table.completionTokens} >= 0`,
    ),
    check("ai_usage_records_total_tokens_non_negative", sql`${table.totalTokens} >= 0`),
    check("ai_usage_records_latency_non_negative", sql`${table.latencyMs} is null or ${table.latencyMs} >= 0`),
  ],
);

export const platformSettings = pgTable(
  "platform_settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: text("key").notNull(),
    valueType: platformSettingValueType("value_type").notNull(),
    value: jsonb("value").notNull(),
    description: text("description"),
    isPublic: boolean("is_public").notNull().default(false),
    updatedByAdminId: uuid("updated_by_admin_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex("platform_settings_key_unique").on(table.key)],
);
