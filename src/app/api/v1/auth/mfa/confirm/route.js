import { handleRequest } from "@/lib/api/handler.js";
import { enforceAuthRateLimit, getClientIp } from "@/lib/api/rate-limit.js";
import { successResponse } from "@/lib/api/response.js";
import { requireAdminProfile } from "@/modules/admin/admin-authorization.js";
import { readJsonBody, validateMfaCode } from "@/modules/auth/auth.validation.js";
import { confirmMfa } from "@/modules/auth/mfa.service.js";

export async function POST(request) {
  return handleRequest(request, async ({ requestId }) => {
    const { user, adminProfile } = await requireAdminProfile(request);
    await enforceAuthRateLimit({
      scope: "mfa_confirm",
      subject: user.id,
      ip: getClientIp(request),
    });
    const input = validateMfaCode(await readJsonBody(request));

    const result = await confirmMfa({
      adminProfileId: adminProfile.id,
      code: input.code,
    });

    return successResponse(result, { requestId });
  });
}
