import { handleRequest } from "@/lib/api/handler.js";
import { successResponse } from "@/lib/api/response.js";
import { requireMfaAdminProfile } from "@/modules/admin/admin-authorization.js";
import { getApplication } from "@/modules/providers/application-review.service.js";
import {
  validateUuidParam,
} from "@/modules/providers/application-review.validation.js";

export async function GET(request, context) {
  return handleRequest(request, async ({ requestId }) => {
    await requireMfaAdminProfile(request);
    const applicationId = validateUuidParam(context.params.id);
    const application = await getApplication(applicationId);

    return successResponse(application, { requestId });
  });
}
