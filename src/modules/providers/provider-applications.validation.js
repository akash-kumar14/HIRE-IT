export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
    this.code = "VALIDATION_ERROR";
    this.status = 422;
  }
}

export { readJsonBody } from "@/modules/auth/auth.validation.js";

function requireObject(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ValidationError("Request body must be a JSON object.");
  }

  return body;
}

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

function optionalText(value, field, maxLength = 1000) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string" || value.trim().length > maxLength) {
    throw new ValidationError(`${field} must be at most ${maxLength} characters.`);
  }

  return value.trim() || null;
}

export function validateApplicationCreate(body) {
  const input = requireObject(body);

  return {
    displayName: requiredText(input.displayName, "Display name"),
    bio: optionalText(input.bio, "Bio"),
  };
}
