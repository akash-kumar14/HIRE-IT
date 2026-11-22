import { handleRequest } from "@/lib/api/handler.js";
import { enforceAuthRateLimit, getClientIp } from "@/lib/api/rate-limit.js";
import { successResponse } from "@/lib/api/response.js";
import { requireAdminProfile } from "@/modules/admin/admin-authorization.js";
import { enrollMfa } from "@/modules/auth/mfa.service.js";

export async function POST(request) {
  return handleRequest(request, async ({ requestId }) => {
    const { user, adminProfile } = await requireAdminProfile(request);
    await enforceAuthRateLimit({
      scope: "mfa_enroll",
      subject: user.id,
      ip: getClientIp(request),
    });

    const enrollment = await enrollMfa({
      adminProfileId: adminProfile.id,
      email: user.email,
    });

    return successResponse(enrollment, { requestId });
  });
}
