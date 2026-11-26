import { handleRequest } from "@/lib/api/handler.js";
import { successResponse } from "@/lib/api/response.js";
import { requireMfaAdminProfile } from "@/modules/admin/admin-authorization.js";
import { approveApplication } from "@/modules/providers/application-review.service.js";
import {
  readOptionalJsonBody,
  validateApproveBody,
  validateUuidParam,
} from "@/modules/providers/application-review.validation.js";

export async function POST(request, context) {
  return handleRequest(request, async ({ requestId }) => {
    const { adminProfile } = await requireMfaAdminProfile(request);
    const applicationId = validateUuidParam(context.params.id);
    const input = validateApproveBody(await readOptionalJsonBody(request));
    const application = await approveApplication(
      applicationId,
      input,
      { actorAdminProfileId: adminProfile.id, requestId },
    );

    return successResponse(application, { requestId });
  });
}
