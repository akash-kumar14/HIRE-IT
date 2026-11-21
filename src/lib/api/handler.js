import { createRequestId } from "./request-id.js";
import { errorResponse } from "./response.js";

export async function handleRequest(request, handler) {
  const requestId = createRequestId(request);

  try {
    return await handler({ request, requestId });
  } catch (error) {
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

    return errorResponse("INTERNAL_ERROR", "Unexpected error.", {
      status: 500,
      requestId,
    });
  }
}
