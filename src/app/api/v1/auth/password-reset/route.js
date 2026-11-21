import { handleRequest } from "@/lib/api/handler.js";
import { enforceAuthRateLimit, getClientIp } from "@/lib/api/rate-limit.js";
import { successResponse } from "@/lib/api/response.js";
import {
  readJsonBody,
  validatePasswordResetRequest,
} from "@/modules/auth/auth.validation.js";
import { requestPasswordReset } from "@/modules/auth/password-reset.service.js";

export async function POST(request) {
  return handleRequest(request, async ({ requestId }) => {
    const input = validatePasswordResetRequest(await readJsonBody(request));
    await enforceAuthRateLimit({
      scope: "password_reset",
      subject: input.email,
      ip: getClientIp(request),
    });
    await requestPasswordReset(input);

    return successResponse({ accepted: true }, { status: 202, requestId });
  });
}
