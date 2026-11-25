import { and, asc, count, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client.js";
import { serviceCategories, skills } from "@/lib/db/schema/providers.js";
import {
  AUDIT_ACTIONS,
  recordAdminAction,
} from "@/modules/audit/audit.service.js";

export class CatalogConflictError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "CatalogConflictError";
    this.code = code;
    this.status = 409;
  }
}

export class CatalogNotFoundError extends Error {
  constructor(message = "Catalog resource not found.") {
    super(message);
    this.name = "CatalogNotFoundError";
    this.code = "NOT_FOUND";
    this.status = 404;
  }
}

function isUniqueViolation(error) {
  let current = error;

  while (current) {
    if (current.code === "23505") return true;
    current = current.cause;
  }

  return false;
}

export function toPublicCategory(category) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    sortOrder: category.sortOrder,
  };
}

export function toAdminCategory(category) {
  return {
    ...toPublicCategory(category),
    isActive: category.isActive,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

export function toPublicSkill(skill) {
  return {
    id: skill.id,
    categoryId: skill.categoryId,
    name: skill.name,
    slug: skill.slug,
    description: skill.description,
  };
}

export function toAdminSkill(skill) {
  return {
    ...toPublicSkill(skill),
    isActive: skill.isActive,
    createdAt: skill.createdAt,
    updatedAt: skill.updatedAt,
  };
}

export async function listCategories({ limit = 20, offset = 0 } = {}, options = {}) {
  const { database = getDb() } = options;
  const filter = eq(serviceCategories.isActive, true);
  const rows = await database
    .select()
    .from(serviceCategories)
    .where(filter)
    .orderBy(asc(serviceCategories.sortOrder), asc(serviceCategories.name))
    .limit(limit)
    .offset(offset);
  const [{ total }] = await database
    .select({ total: count() })
    .from(serviceCategories)
    .where(filter);

  return { items: rows.map(toPublicCategory), total };
}

async function findActiveCategory(categoryId, database) {
  const [category] = await database
    .select()
    .from(serviceCategories)
    .where(
      and(
        eq(serviceCategories.id, categoryId),
        eq(serviceCategories.isActive, true),
      ),
    )
    .limit(1);

  if (!category) {
    throw new CatalogNotFoundError("Category not found.");
  }

  return category;
}

export async function listSkillsByCategory(
  categoryId,
  { limit = 20, offset = 0 } = {},
  options = {},
) {
  const { database = getDb() } = options;

  await findActiveCategory(categoryId, database);

  const filter = and(
    eq(skills.categoryId, categoryId),
    eq(skills.isActive, true),
  );
  const rows = await database
    .select()
    .from(skills)
    .where(filter)
    .orderBy(asc(skills.name))
    .limit(limit)
    .offset(offset);
  const [{ total }] = await database
    .select({ total: count() })
    .from(skills)
    .where(filter);

  return { items: rows.map(toPublicSkill), total };
}

export async function createCategory(input, options = {}) {
  const {
    database = getDb(),
    actorAdminProfileId,
    requestId = null,
  } = options;

  try {
    return await database.transaction(async (tx) => {
      const [category] = await tx
        .insert(serviceCategories)
        .values(input)
        .returning();

      await recordAdminAction(
        {
          adminProfileId: actorAdminProfileId,
          action: AUDIT_ACTIONS.CATEGORY_CREATE,
          entityType: "service_category",
          entityId: category.id,
          requestId,
          metadata: {},
        },
        { database: tx },
      );

      return toAdminCategory(category);
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new CatalogConflictError(
        "CATEGORY_EXISTS",
        "A category with that name or slug already exists.",
      );
    }

    throw error;
  }
}

export async function updateCategory(id, input, options = {}) {
  const {
    database = getDb(),
    actorAdminProfileId,
    requestId = null,
  } = options;

  try {
    return await database.transaction(async (tx) => {
      const [category] = await tx
        .update(serviceCategories)
        .set(input)
        .where(eq(serviceCategories.id, id))
        .returning();

      if (!category) {
        throw new CatalogNotFoundError("Category not found.");
      }

      await recordAdminAction(
        {
          adminProfileId: actorAdminProfileId,
          action: AUDIT_ACTIONS.CATEGORY_UPDATE,
          entityType: "service_category",
          entityId: category.id,
          requestId,
          metadata: { fields: Object.keys(input) },
        },
        { database: tx },
      );

      return toAdminCategory(category);
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new CatalogConflictError(
        "CATEGORY_EXISTS",
        "A category with that name or slug already exists.",
      );
    }

    throw error;
  }
}

export async function createSkill(input, options = {}) {
  const {
    database = getDb(),
    actorAdminProfileId,
    requestId = null,
  } = options;

  await findActiveCategory(input.categoryId, database);

  try {
    return await database.transaction(async (tx) => {
      const [skill] = await tx.insert(skills).values(input).returning();

      await recordAdminAction(
        {
          adminProfileId: actorAdminProfileId,
          action: AUDIT_ACTIONS.SKILL_CREATE,
          entityType: "skill",
          entityId: skill.id,
          requestId,
          metadata: {},
        },
        { database: tx },
      );

      return toAdminSkill(skill);
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new CatalogConflictError(
        "SKILL_EXISTS",
        "A skill with that name or slug already exists in this category.",
      );
    }

    throw error;
  }
}

export async function updateSkill(id, input, options = {}) {
  const {
    database = getDb(),
    actorAdminProfileId,
    requestId = null,
  } = options;

  try {
    return await database.transaction(async (tx) => {
      const [skill] = await tx
        .update(skills)
        .set(input)
        .where(eq(skills.id, id))
        .returning();

      if (!skill) {
        throw new CatalogNotFoundError("Skill not found.");
      }

      await recordAdminAction(
        {
          adminProfileId: actorAdminProfileId,
          action: AUDIT_ACTIONS.SKILL_UPDATE,
          entityType: "skill",
          entityId: skill.id,
          requestId,
          metadata: { fields: Object.keys(input) },
        },
        { database: tx },
      );

      return toAdminSkill(skill);
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new CatalogConflictError(
        "SKILL_EXISTS",
        "A skill with that name or slug already exists in this category.",
      );
    }

    throw error;
  }
}
