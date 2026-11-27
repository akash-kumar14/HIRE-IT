import { createRequestId } from "./request-id.js";
import { errorResponse } from "./response.js";

const CONNECTION_ERROR_CODES = new Set([
  "EAI_AGAIN",
  "ECONNREFUSED",
  "ECONNRESET",
  "ENETUNREACH",
  "ENOTFOUND",
  "EPIPE",
  "ETIMEDOUT",
  "EHOSTUNREACH",
]);

function isServiceUnavailableError(error) {
  const pending = [error];
  const seen = new Set();

  while (pending.length > 0) {
    const current = pending.pop();

    if (!current || typeof current !== "object" || seen.has(current)) {
      continue;
    }

    seen.add(current);

    if (
      current.name === "ConfigError" ||
      CONNECTION_ERROR_CODES.has(current.code) ||
      (current.type === "error" && "error" in current)
    ) {
      return true;
    }

    if (current.cause) pending.push(current.cause);
    if (current.error) pending.push(current.error);
    if (Array.isArray(current.errors)) pending.push(...current.errors);
  }

  return false;
}

export async function handleRequest(request, handler) {
  const requestId = createRequestId(request);

  try {
    return await handler({ request, requestId });
  } catch (error) {
    if (error?.code && Number.isInteger(error?.status)) {
      return errorResponse(error.code, error.message, {
        status: error.status,
        requestId,
      });
    }

    if (error?.name === "ValidationError") {
      return errorResponse("VALIDATION_ERROR", error.message, {
        status: 422,
        requestId,
      });
    }

    if (error?.code === "DUPLICATE_EMAIL") {
      return errorResponse(
        "EMAIL_ALREADY_EXISTS",
        "An account with that email already exists.",
        { status: 409, requestId },
      );
    }

    if (error?.code === "INVALID_CREDENTIALS") {
      return errorResponse("INVALID_CREDENTIALS", "Invalid email or password.", {
        status: 401,
        requestId,
      });
    }

    if (error?.code === "INVALID_VERIFICATION_TOKEN") {
      return errorResponse(
        "INVALID_VERIFICATION_TOKEN",
        "Invalid or expired token.",
        { status: 400, requestId },
      );
    }

    if (error?.code === "INVALID_PASSWORD_RESET_TOKEN") {
      return errorResponse(
        "INVALID_PASSWORD_RESET_TOKEN",
        "Invalid or expired token.",
        { status: 400, requestId },
      );
    }

    if (error?.code === "RATE_LIMIT_EXCEEDED") {
      return errorResponse(
        "RATE_LIMIT_EXCEEDED",
        "Too many requests. Try again later.",
        {
          status: 429,
          requestId,
          headers: { "retry-after": String(error.retryAfterSeconds) },
          meta: { retryAfterSeconds: error.retryAfterSeconds },
        },
      );
    }

    if (isServiceUnavailableError(error)) {
      return errorResponse(
        "SERVICE_UNAVAILABLE",
        "Service temporarily unavailable.",
        { status: 503, requestId },
      );
    }

    return errorResponse("INTERNAL_ERROR", "Unexpected error.", {
      status: 500,
      requestId,
    });
  }
}
