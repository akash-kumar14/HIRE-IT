import { sql } from "drizzle-orm";
import {
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
  boolean,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { providerProfiles } from "./providers.js";
import { offers, taskAssignments, tasks } from "./tasks.js";

export const paymentStatus = pgEnum("payment_status", [
  "pending",
  "authorized",
  "captured",
  "failed",
  "cancelled",
  "refunded",
  "partially_refunded",
]);

export const refundStatus = pgEnum("refund_status", [
  "pending",
  "completed",
  "failed",
  "cancelled",
]);

export const payoutStatus = pgEnum("payout_status", [
  "pending",
  "processing",
  "completed",
  "failed",
  "cancelled",
]);

export const ledgerTransactionType = pgEnum("ledger_transaction_type", [
  "payment",
  "refund",
  "commission",
  "payout",
  "adjustment",
]);

export const ledgerEntryDirection = pgEnum("ledger_entry_direction", [
  "debit",
  "credit",
]);

export const idempotencyStatus = pgEnum("idempotency_status", [
  "in_progress",
  "completed",
  "failed",
]);

export const reconciliationRunStatus = pgEnum("reconciliation_run_status", [
  "pending",
  "running",
  "completed",
  "failed",
]);

export const reconciliationExceptionStatus = pgEnum(
  "reconciliation_exception_status",
  ["open", "resolved", "ignored"],
);

export const reconciliationExceptionType = pgEnum(
  "reconciliation_exception_type",
  [
    "missing_ledger_entry",
    "amount_mismatch",
    "currency_mismatch",
    "orphan_record",
    "duplicate_record",
    "other",
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "restrict" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    offerId: uuid("offer_id")
      .notNull()
      .references(() => offers.id, { onDelete: "restrict" }),
    assignmentId: uuid("assignment_id")
      .notNull()
      .references(() => taskAssignments.id, { onDelete: "restrict" }),
    amountMinorUnits: integer("amount_minor_units").notNull(),
    currency: text("currency").notNull().default("INR"),
    status: paymentStatus("status").notNull().default("pending"),
    isSimulated: boolean("is_simulated").notNull().default(true),
    providerAdapter: text("provider_adapter").notNull().default("simulator"),
    providerPaymentId: text("provider_payment_id"),
    failureReason: text("failure_reason"),
    metadata: jsonb("metadata").notNull().default({}),
    authorizedAt: timestamp("authorized_at", { withTimezone: true }),
    capturedAt: timestamp("captured_at", { withTimezone: true }),
    failedAt: timestamp("failed_at", { withTimezone: true }),
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
    uniqueIndex("payments_one_successful_per_assignment_unique")
      .on(table.assignmentId)
      .where(
        sql`${table.status} in ('authorized', 'captured', 'refunded', 'partially_refunded')`,
      ),
    index("payments_task_idx").on(table.taskId),
    index("payments_customer_idx").on(table.customerId),
    index("payments_status_idx").on(table.status),
    check("payments_amount_positive", sql`${table.amountMinorUnits} > 0`),
  ],
);

export const refunds = pgTable(
  "refunds",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    paymentId: uuid("payment_id")
      .notNull()
      .references(() => payments.id, { onDelete: "restrict" }),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "restrict" }),
    amountMinorUnits: integer("amount_minor_units").notNull(),
    currency: text("currency").notNull().default("INR"),
    status: refundStatus("status").notNull().default("pending"),
    reason: text("reason"),
    isSimulated: boolean("is_simulated").notNull().default(true),
    providerRefundId: text("provider_refund_id"),
    metadata: jsonb("metadata").notNull().default({}),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    failedAt: timestamp("failed_at", { withTimezone: true }),
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
    index("refunds_payment_idx").on(table.paymentId),
    index("refunds_task_idx").on(table.taskId),
    index("refunds_status_idx").on(table.status),
    check("refunds_amount_positive", sql`${table.amountMinorUnits} > 0`),
  ],
);

export const payouts = pgTable(
  "payouts",
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
    amountMinorUnits: integer("amount_minor_units").notNull(),
    currency: text("currency").notNull().default("INR"),
    status: payoutStatus("status").notNull().default("pending"),
    isSimulated: boolean("is_simulated").notNull().default(true),
    providerAdapter: text("provider_adapter").notNull().default("simulator"),
    providerPayoutId: text("provider_payout_id"),
    metadata: jsonb("metadata").notNull().default({}),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    failedAt: timestamp("failed_at", { withTimezone: true }),
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
    uniqueIndex("payouts_one_active_per_assignment_unique")
      .on(table.assignmentId)
      .where(sql`${table.status} in ('pending', 'processing', 'completed')`),
    index("payouts_task_idx").on(table.taskId),
    index("payouts_provider_idx").on(table.providerProfileId),
    index("payouts_status_idx").on(table.status),
    check("payouts_amount_positive", sql`${table.amountMinorUnits} > 0`),
  ],
);

export const commissionCalculations = pgTable(
  "commission_calculations",
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
    paymentId: uuid("payment_id").references(() => payments.id, {
      onDelete: "restrict",
    }),
    grossAmountMinorUnits: integer("gross_amount_minor_units").notNull(),
    commissionRateBasisPoints: integer("commission_rate_basis_points").notNull(),
    commissionAmountMinorUnits: integer("commission_amount_minor_units").notNull(),
    currency: text("currency").notNull().default("INR"),
    policyVersion: text("policy_version").notNull(),
    metadata: jsonb("metadata").notNull().default({}),
    calculatedAt: timestamp("calculated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("commission_calculations_assignment_unique").on(
      table.assignmentId,
    ),
    index("commission_calculations_task_idx").on(table.taskId),
    index("commission_calculations_provider_idx").on(table.providerProfileId),
    check(
      "commission_calculations_gross_positive",
      sql`${table.grossAmountMinorUnits} > 0`,
    ),
    check(
      "commission_calculations_rate_range",
      sql`${table.commissionRateBasisPoints} between 0 and 10000`,
    ),
    check(
      "commission_calculations_amount_non_negative",
      sql`${table.commissionAmountMinorUnits} >= 0`,
    ),
  ],
);

export const ledgerTransactions = pgTable(
  "ledger_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: ledgerTransactionType("type").notNull(),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: "restrict" }),
    paymentId: uuid("payment_id").references(() => payments.id, {
      onDelete: "restrict",
    }),
    refundId: uuid("refund_id").references(() => refunds.id, {
      onDelete: "restrict",
    }),
    payoutId: uuid("payout_id").references(() => payouts.id, {
      onDelete: "restrict",
    }),
    commissionCalculationId: uuid("commission_calculation_id").references(
      () => commissionCalculations.id,
      { onDelete: "restrict" },
    ),
    amountMinorUnits: integer("amount_minor_units").notNull(),
    currency: text("currency").notNull(),
    description: text("description").notNull(),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("ledger_transactions_task_idx").on(table.taskId),
    index("ledger_transactions_payment_idx").on(table.paymentId),
    index("ledger_transactions_refund_idx").on(table.refundId),
    index("ledger_transactions_payout_idx").on(table.payoutId),
    check(
      "ledger_transactions_amount_positive",
      sql`${table.amountMinorUnits} > 0`,
    ),
  ],
);

export const ledgerEntries = pgTable(
  "ledger_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    transactionId: uuid("transaction_id")
      .notNull()
      .references(() => ledgerTransactions.id, { onDelete: "restrict" }),
    accountCode: text("account_code").notNull(),
    direction: ledgerEntryDirection("direction").notNull(),
    amountMinorUnits: integer("amount_minor_units").notNull(),
    currency: text("currency").notNull(),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("ledger_entries_transaction_idx").on(table.transactionId),
    index("ledger_entries_account_idx").on(table.accountCode),
    check("ledger_entries_amount_positive", sql`${table.amountMinorUnits} > 0`),
  ],
);

export const idempotencyRecords = pgTable(
  "idempotency_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    scope: text("scope").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    requestFingerprint: text("request_fingerprint").notNull(),
    status: idempotencyStatus("status").notNull().default("in_progress"),
    resourceId: uuid("resource_id"),
    responseCode: integer("response_code"),
    result: jsonb("result"),
    errorCode: text("error_code"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("idempotency_scope_key_unique").on(
      table.scope,
      table.idempotencyKey,
    ),
    index("idempotency_status_idx").on(table.status),
    check(
      "idempotency_response_code_range",
      sql`${table.responseCode} is null or ${table.responseCode} between 100 and 599`,
    ),
  ],
);

export const reconciliationRuns = pgTable(
  "reconciliation_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    status: reconciliationRunStatus("status").notNull().default("pending"),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
    currency: text("currency"),
    summary: jsonb("summary").notNull().default({}),
    error: text("error"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("reconciliation_runs_status_idx").on(table.status),
    index("reconciliation_runs_period_idx").on(table.periodStart, table.periodEnd),
    check(
      "reconciliation_runs_period_order",
      sql`${table.periodEnd} > ${table.periodStart}`,
    ),
  ],
);

export const reconciliationExceptions = pgTable(
  "reconciliation_exceptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    runId: uuid("run_id")
      .notNull()
      .references(() => reconciliationRuns.id, { onDelete: "cascade" }),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: "set null" }),
    paymentId: uuid("payment_id").references(() => payments.id, {
      onDelete: "set null",
    }),
    refundId: uuid("refund_id").references(() => refunds.id, {
      onDelete: "set null",
    }),
    payoutId: uuid("payout_id").references(() => payouts.id, {
      onDelete: "set null",
    }),
    ledgerTransactionId: uuid("ledger_transaction_id").references(
      () => ledgerTransactions.id,
      { onDelete: "set null" },
    ),
    type: reconciliationExceptionType("type").notNull(),
    status: reconciliationExceptionStatus("status").notNull().default("open"),
    currency: text("currency"),
    expectedAmountMinorUnits: integer("expected_amount_minor_units"),
    actualAmountMinorUnits: integer("actual_amount_minor_units"),
    details: jsonb("details").notNull().default({}),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    resolutionNotes: text("resolution_notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("reconciliation_exceptions_run_idx").on(table.runId),
    index("reconciliation_exceptions_status_idx").on(table.status),
    index("reconciliation_exceptions_type_idx").on(table.type),
    check(
      "reconciliation_exceptions_expected_non_negative",
      sql`${table.expectedAmountMinorUnits} is null or ${table.expectedAmountMinorUnits} >= 0`,
    ),
    check(
      "reconciliation_exceptions_actual_non_negative",
      sql`${table.actualAmountMinorUnits} is null or ${table.actualAmountMinorUnits} >= 0`,
    ),
  ],
);
