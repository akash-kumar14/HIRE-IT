export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
    this.code = "VALIDATION_ERROR";
    this.status = 422;
  }
}

export { readJsonBody } from "@/modules/auth/auth.validation.js";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function requiredText(value, field, maxLength = 120) {
  if (typeof value !== "string") {
    throw new ValidationError(`${field} is required.`);
  }

  const normalized = value.trim();

  if (normalized.length === 0 || normalized.length > maxLength) {
    throw new ValidationError(`${field} must be between 1 and ${maxLength} characters.`);
  }

  return normalized;
}

function optionalText(value, field, maxLength = 500) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string" || value.trim().length > maxLength) {
    throw new ValidationError(`${field} must be at most ${maxLength} characters.`);
  }

  return value.trim() || null;
}

function requiredSlug(value) {
  const slug = requiredText(value, "Slug").toLowerCase();

  if (slug.length > 120 || !SLUG_PATTERN.test(slug)) {
    throw new ValidationError("Slug must contain lowercase letters, numbers, and hyphens.");
  }

  return slug;
}

function optionalBoolean(value, field) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "boolean") {
    throw new ValidationError(`${field} must be a boolean.`);
  }

  return value;
}

function optionalSortOrder(value) {
  if (value === undefined) {
    return undefined;
  }

  if (!Number.isInteger(value) || value < 0 || value > 10000) {
    throw new ValidationError("Sort order must be an integer between 0 and 10000.");
  }

  return value;
}

function requireObject(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ValidationError("Request body must be a JSON object.");
  }

  return body;
}

function requireAtLeastOne(input) {
  if (Object.keys(input).length === 0) {
    throw new ValidationError("At least one field is required.");
  }

  return input;
}

export function validateUuidParam(value) {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    throw new ValidationError("A valid UUID is required.");
  }

  return value;
}

export function validateCategoryCreate(body) {
  const input = requireObject(body);

  return {
    name: requiredText(input.name, "Name"),
    slug: requiredSlug(input.slug),
    description: optionalText(input.description, "Description"),
    sortOrder: optionalSortOrder(input.sortOrder) ?? 0,
    isActive: optionalBoolean(input.isActive, "Is active") ?? true,
  };
}

export function validateCategoryUpdate(body) {
  const input = requireObject(body);
  const update = {};

  if (input.name !== undefined) update.name = requiredText(input.name, "Name");
  if (input.slug !== undefined) update.slug = requiredSlug(input.slug);
  if (input.description !== undefined) {
    update.description = optionalText(input.description, "Description");
  }
  if (input.sortOrder !== undefined) update.sortOrder = optionalSortOrder(input.sortOrder);
  if (input.isActive !== undefined) {
    update.isActive = optionalBoolean(input.isActive, "Is active");
  }

  return requireAtLeastOne(update);
}

export function validateSkillCreate(body) {
  const input = requireObject(body);

  return {
    categoryId: validateUuidParam(input.categoryId),
    name: requiredText(input.name, "Name"),
    slug: requiredSlug(input.slug),
    description: optionalText(input.description, "Description"),
    isActive: optionalBoolean(input.isActive, "Is active") ?? true,
  };
}

export function validateSkillUpdate(body) {
  const input = requireObject(body);
  const update = {};

  if (input.name !== undefined) update.name = requiredText(input.name, "Name");
  if (input.slug !== undefined) update.slug = requiredSlug(input.slug);
  if (input.description !== undefined) {
    update.description = optionalText(input.description, "Description");
  }
  if (input.isActive !== undefined) {
    update.isActive = optionalBoolean(input.isActive, "Is active");
  }

  return requireAtLeastOne(update);
}

function parseInteger(value, field, fallback, max, min = 0) {
  if (value === undefined || value === null || value === "") return fallback;

  const raw = typeof value === "string" ? value.trim() : value;

  if (typeof raw !== "string" || !/^\d+$/.test(raw)) {
    throw new ValidationError(`${field} must be a non-negative integer.`);
  }

  const parsed = Number(raw);

  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
    throw new ValidationError(`${field} must be between ${min} and ${max}.`);
  }

  return parsed;
}

export function parsePagination(params = {}) {
  const get = (key) =>
    typeof params.get === "function" ? params.get(key) : params[key];
  const limit = parseInteger(get("limit"), "Limit", 20, 100, 1);

  return { limit, offset: parseInteger(get("offset"), "Offset", 0, 1_000_000) };
}
