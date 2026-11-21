import { handleRequest } from "@/lib/api/handler.js";
import { enforceAuthRateLimit, getClientIp } from "@/lib/api/rate-limit.js";
import { successResponse } from "@/lib/api/response.js";
import { requireAdminProfile } from "@/modules/admin/admin-authorization.js";
import {
  readJsonBody,
  validateMfaRecoveryCode,
} from "@/modules/auth/auth.validation.js";
import { recoverMfa } from "@/modules/auth/mfa.service.js";

export async function POST(request) {
  return handleRequest(request, async ({ requestId }) => {
    const { user, session, adminProfile } = await requireAdminProfile(request);
    await enforceAuthRateLimit({
      scope: "mfa_recovery",
      subject: user.id,
      ip: getClientIp(request),
    });
    const input = validateMfaRecoveryCode(await readJsonBody(request));

    const result = await recoverMfa({
      adminProfileId: adminProfile.id,
      sessionId: session.id,
      code: input.code,
    });

    return successResponse(result, { requestId });
  });
}
