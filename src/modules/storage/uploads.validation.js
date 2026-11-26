export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
    this.code = "VALIDATION_ERROR";
    this.status = 422;
  }
}

export { readJsonBody } from "@/modules/auth/auth.validation.js";
export { validateUuidParam } from "@/modules/categories/catalog.validation.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MIME_EXTENSIONS = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};

function requiredText(value, field, maxLength = 255) {
  if (typeof value !== "string") {
    throw new ValidationError(`${field} is required.`);
  }

  const normalized = value.trim();

  if (normalized.length === 0 || normalized.length > maxLength) {
    throw new ValidationError(`${field} must be between 1 and ${maxLength} characters.`);
  }

  return normalized;
}

function requireObject(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ValidationError("Request body must be a JSON object.");
  }

  return body;
}

function requireUuid(value, field) {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    throw new ValidationError(`A valid ${field} is required.`);
  }

  return value;
}

export function extensionForMimeType(mimeType) {
  return MIME_EXTENSIONS[mimeType];
}

export function validatePresignRequest(body) {
  const input = requireObject(body);

  if (input.purpose !== "verification_document") {
    throw new ValidationError("Unsupported upload purpose.");
  }

  const mimeType = input.mimeType;

  if (typeof mimeType !== "string" || !MIME_EXTENSIONS[mimeType]) {
    throw new ValidationError("Unsupported file type.");
  }

  if (!Number.isInteger(input.sizeBytes) || input.sizeBytes < 1) {
    throw new ValidationError("File size must be a positive integer.");
  }

  if (input.sizeBytes > MAX_FILE_SIZE_BYTES) {
    const error = new ValidationError("File must be 10 MB or smaller.");
    error.code = "FILE_TOO_LARGE";
    error.status = 413;
    throw error;
  }

  return {
    purpose: input.purpose,
    relatedEntityId: requireUuid(input.relatedEntityId, "verification ID"),
    fileName: requiredText(input.fileName, "File name"),
    mimeType,
    sizeBytes: input.sizeBytes,
  };
}

export function validateCompleteRequest(body) {
  return { uploadId: requireUuid(requireObject(body).uploadId, "upload ID") };
}
