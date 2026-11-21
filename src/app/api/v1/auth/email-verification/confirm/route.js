import { handleRequest } from "@/lib/api/handler.js";
import { enforceAuthRateLimit, getClientIp } from "@/lib/api/rate-limit.js";
import { successResponse } from "@/lib/api/response.js";
import {
  readJsonBody,
  validateVerificationConfirm,
} from "@/modules/auth/auth.validation.js";
import { confirmEmailVerification } from "@/modules/auth/verification.service.js";

export async function POST(request) {
  return handleRequest(request, async ({ requestId }) => {
    const input = validateVerificationConfirm(await readJsonBody(request));
    await enforceAuthRateLimit({
      scope: "email_verification_confirm",
      ip: getClientIp(request),
    });
    const user = await confirmEmailVerification(input);

    return successResponse(user, { requestId });
  });
}
