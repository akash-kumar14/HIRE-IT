export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
    this.code = "VALIDATION_ERROR";
    this.status = 422;
  }
}

export { readJsonBody } from "@/modules/auth/auth.validation.js";
export {
  parsePagination,
  validateUuidParam,
} from "@/modules/categories/catalog.validation.js";

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

function optionalBoolean(value, field) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "boolean") {
    throw new ValidationError(`${field} must be a boolean.`);
  }

  return value;
}

function optionalValidityMonths(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (!Number.isInteger(value) || value < 1 || value > 600) {
    throw new ValidationError("Validity months must be an integer between 1 and 600.");
  }

  return value;
}

function requireObject(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ValidationError("Request body must be a JSON object.");
  }

  return body;
}

export function validateVerificationRequirementCreate(body) {
  const input = requireObject(body);
  const categoryId = input.categoryId;

  if (typeof categoryId !== "string" || !UUID_PATTERN.test(categoryId)) {
    throw new ValidationError("A valid category ID is required.");
  }

  return {
    categoryId,
    name: requiredText(input.name, "Name"),
    description: optionalText(input.description, "Description"),
    documentType: optionalText(input.documentType, "Document type", 120),
    isRequired: optionalBoolean(input.isRequired, "Is required") ?? true,
    validityMonths: optionalValidityMonths(input.validityMonths),
  };
}
