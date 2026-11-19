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
import { taskAssignments, tasks } from "./tasks.js";

export const disputeStatus = pgEnum("dispute_status", [
  "open",
  "under_review",
  "resolved",
  "closed",
]);

export const disputeOutcome = pgEnum("dispute_outcome", [
  "customer_favor",
  "provider_favor",
  "compromise",
  "no_action",
]);

export const disputeEvidenceType = pgEnum("dispute_evidence_type", [
  "document",
  "photo",
  "message_snapshot",
  "other",
]);

export const supportTicketStatus = pgEnum("support_ticket_status", [
  "open",
  "pending",
  "resolved",
  "closed",
]);

export const supportTicketPriority = pgEnum("support_ticket_priority", [
  "low",
  "normal",
  "high",
  "urgent",
]);

export const supportMessageSenderRole = pgEnum("support_message_sender_role", [
  "customer",
  "provider",
  "admin",
  "system",
]);

export const disputes = pgTable(
  "disputes",
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
    openedByUserId: uuid("opened_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    reason: text("reason").notNull(),
    status: disputeStatus("status").notNull().default("open"),
    outcome: disputeOutcome("outcome"),
    resolutionNotes: text("resolution_notes"),
    resolvedByAdminId: uuid("resolved_by_admin_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("disputes_one_active_per_task_unique")
      .on(table.taskId)
      .where(sql`${table.status} in ('open', 'under_review')`),
    index("disputes_provider_idx").on(table.providerProfileId),
    index("disputes_status_idx").on(table.status),
  ],
);

export const disputeEvidence = pgTable(
  "dispute_evidence",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    disputeId: uuid("dispute_id")
      .notNull()
      .references(() => disputes.id, { onDelete: "cascade" }),
    uploaderUserId: uuid("uploader_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    type: disputeEvidenceType("type").notNull(),
    objectKey: text("object_key").notNull(),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("dispute_evidence_dispute_idx").on(table.disputeId),
    check("dispute_evidence_size_positive", sql`${table.sizeBytes} > 0`),
  ],
);

export const disputeAdminNotes = pgTable(
  "dispute_admin_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    disputeId: uuid("dispute_id")
      .notNull()
      .references(() => disputes.id, { onDelete: "cascade" }),
    adminUserId: uuid("admin_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("dispute_admin_notes_dispute_idx").on(table.disputeId),
    check("dispute_admin_notes_body_not_empty", sql`length(trim(${table.body})) > 0`),
  ],
);

export const supportTickets = pgTable(
  "support_tickets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: "set null" }),
    subject: text("subject").notNull(),
    status: supportTicketStatus("status").notNull().default("open"),
    priority: supportTicketPriority("priority").notNull().default("normal"),
    assignedAdminId: uuid("assigned_admin_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("support_tickets_user_idx").on(table.userId),
    index("support_tickets_status_idx").on(table.status),
    index("support_tickets_assigned_admin_idx").on(table.assignedAdminId),
  ],
);

export const supportTicketMessages = pgTable(
  "support_ticket_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ticketId: uuid("ticket_id")
      .notNull()
      .references(() => supportTickets.id, { onDelete: "cascade" }),
    senderUserId: uuid("sender_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    senderRole: supportMessageSenderRole("sender_role").notNull(),
    body: text("body").notNull(),
    isInternal: boolean("is_internal").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("support_ticket_messages_ticket_idx").on(table.ticketId),
    check(
      "support_ticket_messages_body_not_empty",
      sql`length(trim(${table.body})) > 0`,
    ),
  ],
);
