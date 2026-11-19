import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { adminProfiles, users } from "./users.js";

export const providerStatus = pgEnum("provider_status", [
  "pending",
  "approved",
  "suspended",
  "rejected",
]);

export const verificationStatus = pgEnum("verification_status", [
  "pending",
  "approved",
  "rejected",
  "expired",
  "revoked",
]);

export const serviceCategories = pgTable(
  "service_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("service_categories_name_unique").on(table.name),
    uniqueIndex("service_categories_slug_unique").on(table.slug),
  ],
);

export const providerProfiles = pgTable(
  "provider_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    displayName: text("display_name").notNull(),
    bio: text("bio"),
    status: providerStatus("status").notNull().default("pending"),
    isAvailable: boolean("is_available").notNull().default(false),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("provider_profiles_user_unique").on(table.userId),
    index("provider_profiles_status_idx").on(table.status),
  ],
);

export const skills = pgTable(
  "skills",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => serviceCategories.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("skills_category_name_unique").on(table.categoryId, table.name),
    uniqueIndex("skills_slug_unique").on(table.slug),
    index("skills_category_idx").on(table.categoryId),
  ],
);

export const providerSkills = pgTable(
  "provider_skills",
  {
    providerProfileId: uuid("provider_profile_id")
      .notNull()
      .references(() => providerProfiles.id, { onDelete: "cascade" }),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "restrict" }),
    yearsOfExperience: integer("years_of_experience").notNull().default(0),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.providerProfileId, table.skillId] }),
    check(
      "provider_skills_experience_non_negative",
      sql`${table.yearsOfExperience} >= 0`,
    ),
    index("provider_skills_skill_idx").on(table.skillId),
  ],
);

export const providerServiceAreas = pgTable(
  "provider_service_areas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    providerProfileId: uuid("provider_profile_id")
      .notNull()
      .references(() => providerProfiles.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    latitude: numeric("latitude", { precision: 10, scale: 7 }).notNull(),
    longitude: numeric("longitude", { precision: 10, scale: 7 }).notNull(),
    radiusMeters: integer("radius_meters").notNull(),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("provider_service_areas_profile_idx").on(table.providerProfileId),
    index("provider_service_areas_geo_idx").on(table.latitude, table.longitude),
    check(
      "provider_service_areas_latitude_range",
      sql`${table.latitude} between -90 and 90`,
    ),
    check(
      "provider_service_areas_longitude_range",
      sql`${table.longitude} between -180 and 180`,
    ),
    check("provider_service_areas_radius_positive", sql`${table.radiusMeters} > 0`),
  ],
);

export const verificationRequirements = pgTable(
  "verification_requirements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => serviceCategories.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    description: text("description"),
    documentType: text("document_type"),
    isRequired: boolean("is_required").notNull().default(true),
    validityMonths: integer("validity_months"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("verification_requirements_category_name_unique").on(
      table.categoryId,
      table.name,
    ),
    check(
      "verification_requirements_validity_positive",
      sql`${table.validityMonths} is null or ${table.validityMonths} > 0`,
    ),
  ],
);

export const providerVerifications = pgTable(
  "provider_verifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    providerProfileId: uuid("provider_profile_id")
      .notNull()
      .references(() => providerProfiles.id, { onDelete: "cascade" }),
    requirementId: uuid("requirement_id")
      .notNull()
      .references(() => verificationRequirements.id, { onDelete: "restrict" }),
    status: verificationStatus("status").notNull().default("pending"),
    documentObjectKey: text("document_object_key"),
    reviewedByAdminProfileId: uuid("reviewed_by_admin_profile_id").references(
      () => adminProfiles.id,
      { onDelete: "set null" },
    ),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("provider_verifications_profile_idx").on(table.providerProfileId),
    index("provider_verifications_requirement_idx").on(table.requirementId),
    index("provider_verifications_status_idx").on(table.status),
  ],
);
