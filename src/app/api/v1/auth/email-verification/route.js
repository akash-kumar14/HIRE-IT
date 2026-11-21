import { handleRequest } from "@/lib/api/handler.js";
import { enforceAuthRateLimit, getClientIp } from "@/lib/api/rate-limit.js";
import { successResponse } from "@/lib/api/response.js";
import { requireAuthenticatedUser } from "@/modules/auth/authorization.js";
import { requestEmailVerification } from "@/modules/auth/verification.service.js";

export async function POST(request) {
  return handleRequest(request, async ({ requestId }) => {
    const { user } = await requireAuthenticatedUser(request);
    await enforceAuthRateLimit({
      scope: "email_verification",
      subject: user.id,
      ip: getClientIp(request),
    });
    await requestEmailVerification(user.id);
    return successResponse({ accepted: true }, { status: 202, requestId });
  });
}
