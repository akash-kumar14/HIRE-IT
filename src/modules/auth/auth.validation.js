export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
    this.code = "VALIDATION_ERROR";
  }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requireEmail(value) {
  if (typeof value !== "string") {
    throw new ValidationError("Email is required.");
  }

  const normalized = value.trim().toLowerCase();

  if (normalized.length > 254 || !EMAIL_PATTERN.test(normalized)) {
    throw new ValidationError("Enter a valid email address.");
  }

  return normalized;
}

function requirePassword(value) {
  if (typeof value !== "string") {
    throw new ValidationError("Password is required.");
  }

  if (value.length < 8 || value.length > 128) {
    throw new ValidationError("Password must be between 8 and 128 characters.");
  }

  return value;
}

function requireFullName(value) {
  if (typeof value !== "string") {
    throw new ValidationError("Full name is required.");
  }

  const normalized = value.trim();

  if (normalized.length === 0 || normalized.length > 120) {
    throw new ValidationError("Full name must be between 1 and 120 characters.");
  }

  return normalized;
}

function optionalPhone(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string" || value.trim().length > 32) {
    throw new ValidationError("Phone number must be at most 32 characters.");
  }

  return value.trim() || null;
}

export function validateRegistration(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ValidationError("Request body must be a JSON object.");
  }

  return {
    email: requireEmail(body.email),
    password: requirePassword(body.password),
    fullName: requireFullName(body.fullName),
    phone: optionalPhone(body.phone),
  };
}

export function validateLogin(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ValidationError("Request body must be a JSON object.");
  }

  return {
    email: requireEmail(body.email),
    password: requirePassword(body.password),
  };
}

export function validateVerificationConfirm(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ValidationError("Request body must be a JSON object.");
  }

  if (
    typeof body.token !== "string" ||
    body.token.trim().length === 0 ||
    body.token.length > 256
  ) {
    throw new ValidationError("Verification token is required.");
  }

  return { token: body.token.trim() };
}

export async function readJsonBody(request) {
  try {
    return await request.json();
  } catch {
    throw new ValidationError("Request body must be valid JSON.");
  }
}
