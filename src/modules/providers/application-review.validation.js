export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
    this.code = "VALIDATION_ERROR";
    this.status = 422;
  }
}

import { parsePagination } from "@/modules/categories/catalog.validation.js";

export {
  readJsonBody,
  readOptionalJsonBody,
} from "@/modules/auth/auth.validation.js";
export {
  parsePagination,
  validateUuidParam,
} from "@/modules/categories/catalog.validation.js";

const APPLICATION_STATUSES = ["pending", "approved", "rejected", "suspended"];

function requireObject(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ValidationError("Request body must be a JSON object.");
  }

  return body;
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

function requiredText(value, field, maxLength = 500) {
  const normalized = optionalText(value, field, maxLength);

  if (!normalized) {
    throw new ValidationError(`${field} is required.`);
  }

  return normalized;
}

export function parseApplicationListQuery(params = {}) {
  const get = (key) =>
    typeof params.get === "function" ? params.get(key) : params[key];
  const status = get("status") ?? "pending";

  if (status !== "all" && !APPLICATION_STATUSES.includes(status)) {
    throw new ValidationError("Invalid status filter.");
  }

  return { ...parsePagination(params), status };
}

export function validateApproveBody(body) {
  return { note: optionalText(requireObject(body).note, "Note") };
}

export function validateRejectBody(body) {
  return { reason: requiredText(requireObject(body).reason, "Reason") };
}
