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
} from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { providerProfiles } from "./providers.js";
import { tasks } from "./tasks.js";

export const conversationStatus = pgEnum("conversation_status", [
  "open",
  "closed",
]);

export const messageStatus = pgEnum("message_status", [
  "sent",
  "delivered",
  "read",
]);

export const notificationType = pgEnum("notification_type", [
  "offer_received",
  "offer_accepted",
  "booking_confirmed",
  "message_received",
  "completion_required",
  "task_completed",
  "dispute_opened",
  "admin_action_required",
  "verification_update",
  "system",
]);

export const emailDeliveryStatus = pgEnum("email_delivery_status", [
  "queued",
  "sent",
  "failed",
  "bounced",
]);

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "restrict" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    providerProfileId: uuid("provider_profile_id")
      .notNull()
      .references(() => providerProfiles.id, { onDelete: "restrict" }),
    status: conversationStatus("status").notNull().default("open"),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
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
    uniqueIndex("conversations_task_provider_unique").on(
      table.taskId,
      table.providerProfileId,
    ),
    index("conversations_customer_idx").on(table.customerId),
    index("conversations_provider_idx").on(table.providerProfileId),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderUserId: uuid("sender_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    body: text("body").notNull(),
    status: messageStatus("status").notNull().default("sent"),
    readAt: timestamp("read_at", { withTimezone: true }),
    editedAt: timestamp("edited_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("messages_conversation_created_idx").on(
      table.conversationId,
      table.createdAt,
    ),
    index("messages_sender_idx").on(table.senderUserId),
    check("messages_body_not_empty", sql`length(trim(${table.body})) > 0`),
  ],
);

export const messageAttachments = pgTable(
  "message_attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    messageId: uuid("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
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
    index("message_attachments_message_idx").on(table.messageId),
    index("message_attachments_conversation_idx").on(table.conversationId),
    check("message_attachments_size_positive", sql`${table.sizeBytes} > 0`),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: "set null" }),
    type: notificationType("type").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    data: jsonb("data").notNull().default({}),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("notifications_user_unread_idx").on(table.userId, table.readAt),
    index("notifications_type_idx").on(table.type),
    index("notifications_created_idx").on(table.createdAt),
  ],
);

export const emailDeliveries = pgTable(
  "email_deliveries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    notificationId: uuid("notification_id").references(() => notifications.id, {
      onDelete: "set null",
    }),
    recipientEmail: text("recipient_email").notNull(),
    subject: text("subject").notNull(),
    template: text("template").notNull(),
    status: emailDeliveryStatus("status").notNull().default("queued"),
    providerMessageId: text("provider_message_id"),
    attempts: integer("attempts").notNull().default(0),
    lastError: text("last_error"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    failedAt: timestamp("failed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("email_deliveries_status_idx").on(table.status),
    index("email_deliveries_user_idx").on(table.userId),
    index("email_deliveries_notification_idx").on(table.notificationId),
    index("email_deliveries_recipient_idx").on(table.recipientEmail),
    check("email_deliveries_attempts_non_negative", sql`${table.attempts} >= 0`),
  ],
);
