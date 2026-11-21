import { handleRequest } from "@/lib/api/handler.js";
import { enforceAuthRateLimit, getClientIp } from "@/lib/api/rate-limit.js";
import { errorResponse, successResponse } from "@/lib/api/response.js";
import { getCurrentSession } from "@/modules/auth/auth.service.js";
import { readSessionToken } from "@/modules/auth/session-cookie.js";
import { requestEmailVerification } from "@/modules/auth/verification.service.js";

export async function POST(request) {
  return handleRequest(request, async ({ requestId }) => {
    const token = readSessionToken(request);
    const current = await getCurrentSession(token);

    if (!current) {
      return errorResponse("AUTHENTICATION_REQUIRED", "Authentication is required.", {
        status: 401,
        requestId,
      });
    }

    await enforceAuthRateLimit({
      scope: "email_verification",
      subject: current.session.userId,
      ip: getClientIp(request),
    });
    await requestEmailVerification(current.session.userId);
    return successResponse({ accepted: true }, { status: 202, requestId });
  });
}
