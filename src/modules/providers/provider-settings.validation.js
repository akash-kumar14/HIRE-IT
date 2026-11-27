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

const LATITUDE_PATTERN = /^-?\d{1,2}(?:\.\d{1,7})?$/;
const LONGITUDE_PATTERN = /^-?\d{1,3}(?:\.\d{1,7})?$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const MAX_WEEKLY_SLOTS = 21;

function requireObject(value, message = "Request body must be a JSON object.") {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ValidationError(message);
  }

  return value;
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

function optionalBoolean(value, field, fallback) {
  if (value === undefined) return fallback;

  if (typeof value !== "boolean") {
    throw new ValidationError(`${field} must be a boolean.`);
  }

  return value;
}

function requireCoordinate(value, field, pattern, min, max) {
  const raw = typeof value === "number" && Number.isFinite(value) ? String(value) : value;

  if (typeof raw !== "string" || !pattern.test(raw.trim())) {
    throw new ValidationError(`${field} must be a decimal coordinate with at most 7 places.`);
  }

  const normalized = raw.trim();
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new ValidationError(`${field} is out of range.`);
  }

  return normalized;
}

function requireRadius(value) {
  if (!Number.isInteger(value) || value < 1 || value > 100_000) {
    throw new ValidationError("Radius must be an integer between 1 and 100000 meters.");
  }

  return value;
}

export function validateServiceAreaCreate(body) {
  const input = requireObject(body);

  return {
    label: requiredText(input.label, "Label"),
    latitude: requireCoordinate(input.latitude, "Latitude", LATITUDE_PATTERN, -90, 90),
    longitude: requireCoordinate(input.longitude, "Longitude", LONGITUDE_PATTERN, -180, 180),
    radiusMeters: requireRadius(input.radiusMeters),
    isPrimary: optionalBoolean(input.isPrimary, "Is primary", false),
  };
}

export function validateAvailabilityToggle(body) {
  const input = requireObject(body);

  if (typeof input.isAvailable !== "boolean") {
    throw new ValidationError("Is available must be a boolean.");
  }

  return { isAvailable: input.isAvailable };
}

function requireDayOfWeek(value) {
  if (!Number.isInteger(value) || value < 0 || value > 6) {
    throw new ValidationError("Day of week must be an integer between 0 and 6.");
  }

  return value;
}

function requireTime(value, field) {
  if (typeof value !== "string" || !TIME_PATTERN.test(value)) {
    throw new ValidationError(`${field} must use HH:MM 24-hour format.`);
  }

  return value;
}

function requireTimezone(value) {
  const timezone = requiredText(value, "Timezone", 64);

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
  } catch {
    throw new ValidationError("Timezone must be a valid IANA timezone.");
  }

  return timezone;
}

export function validateWeeklyAvailability(body) {
  const input = requireObject(body);

  if (!Array.isArray(input.slots) || input.slots.length > MAX_WEEKLY_SLOTS) {
    throw new ValidationError(`Slots must be an array with at most ${MAX_WEEKLY_SLOTS} entries.`);
  }

  const seen = new Set();
  const slots = input.slots.map((raw) => {
    const slot = requireObject(raw, "Each weekly slot must be an object.");
    const dayOfWeek = requireDayOfWeek(slot.dayOfWeek);
    const startTime = requireTime(slot.startTime, "Start time");
    const endTime = requireTime(slot.endTime, "End time");

    if (startTime >= endTime) {
      throw new ValidationError("End time must be after start time.");
    }

    const key = `${dayOfWeek}:${startTime}:${endTime}`;

    if (seen.has(key)) {
      throw new ValidationError("Duplicate weekly slots are not allowed.");
    }

    seen.add(key);

    return {
      dayOfWeek,
      startTime,
      endTime,
      timezone: requireTimezone(slot.timezone),
      isAvailable: optionalBoolean(slot.isAvailable, "Is available", true),
    };
  });

  return { slots };
}
