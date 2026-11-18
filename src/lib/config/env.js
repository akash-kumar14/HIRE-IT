const NODE_ENVIRONMENTS = new Set(["development", "test", "production"]);

const REQUIRED_IN_PRODUCTION = ["APP_URL", "DATABASE_URL", "SESSION_SECRET"];

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isPostgresUrl(value) {
  return /^postgres(ql)?:\/\//.test(value);
}

function isNonEmpty(value) {
  return value.length > 0;
}

const RULES = {
  NODE_ENV: (value) => NODE_ENVIRONMENTS.has(value),
  APP_URL: isHttpUrl,
  DATABASE_URL: isPostgresUrl,
  SESSION_SECRET: (value) => value.length >= 32,
  GEMINI_API_KEY: isNonEmpty,
  R2_ACCOUNT_ID: isNonEmpty,
  R2_ACCESS_KEY_ID: isNonEmpty,
  R2_SECRET_ACCESS_KEY: isNonEmpty,
  R2_BUCKET_NAME: isNonEmpty,
  RESEND_API_KEY: isNonEmpty,
  EMAIL_FROM: isNonEmpty,
  SENTRY_DSN: isHttpUrl,
};

export class ConfigError extends Error {
  constructor(errors) {
    super(
      `Invalid environment configuration: ${errors
        .map((error) => `${error.key} (${error.reason})`)
        .join(", ")}`,
    );
    this.name = "ConfigError";
    this.errors = errors;
  }
}

export function validateEnv(source = process.env) {
  const errors = [];
  const values = {};

  for (const [key, rule] of Object.entries(RULES)) {
    const raw = source[key];

    if (raw === undefined || raw === "") {
      if (
        source.NODE_ENV === "production" &&
        REQUIRED_IN_PRODUCTION.includes(key)
      ) {
        errors.push({ key, reason: "missing" });
      }
      continue;
    }

    const value = raw.trim();
    values[key] = value;

    if (!rule(value)) {
      errors.push({ key, reason: "invalid" });
    }
  }

  return { valid: errors.length === 0, errors, values };
}

export function getEnv(source = process.env) {
  const result = validateEnv(source);

  if (!result.valid) {
    throw new ConfigError(result.errors);
  }

  return result.values;
}
