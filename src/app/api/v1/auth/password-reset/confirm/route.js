import { handleRequest } from "@/lib/api/handler.js";
import { enforceAuthRateLimit, getClientIp } from "@/lib/api/rate-limit.js";
import { successResponse } from "@/lib/api/response.js";
import {
  readJsonBody,
  validatePasswordResetConfirm,
} from "@/modules/auth/auth.validation.js";
import { confirmPasswordReset } from "@/modules/auth/password-reset.service.js";

export async function POST(request) {
  return handleRequest(request, async ({ requestId }) => {
    const input = validatePasswordResetConfirm(await readJsonBody(request));
    await enforceAuthRateLimit({
      scope: "password_reset_confirm",
      ip: getClientIp(request),
    });
    await confirmPasswordReset(input);

    return successResponse({ updated: true }, { requestId });
  });
}
