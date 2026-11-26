import { handleRequest } from "@/lib/api/handler.js";
import { successResponse } from "@/lib/api/response.js";
import { requireMfaAdminProfile } from "@/modules/admin/admin-authorization.js";
import { rejectApplication } from "@/modules/providers/application-review.service.js";
import {
  readJsonBody,
  validateRejectBody,
  validateUuidParam,
} from "@/modules/providers/application-review.validation.js";

export async function POST(request, context) {
  return handleRequest(request, async ({ requestId }) => {
    const { adminProfile } = await requireMfaAdminProfile(request);
    const applicationId = validateUuidParam(context.params.id);
    const input = validateRejectBody(await readJsonBody(request));
    const application = await rejectApplication(
      applicationId,
      input,
      { actorAdminProfileId: adminProfile.id, requestId },
    );

    return successResponse(application, { requestId });
  });
}
