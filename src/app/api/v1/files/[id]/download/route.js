import { handleRequest } from "@/lib/api/handler.js";
import { successResponse } from "@/lib/api/response.js";
import { requireAuthenticatedUser } from "@/modules/auth/authorization.js";
import { getUploadDownloadUrl } from "@/modules/storage/uploads.service.js";
import { validateUuidParam } from "@/modules/storage/uploads.validation.js";

export async function GET(request, context) {
  return handleRequest(request, async ({ requestId }) => {
    const { user } = await requireAuthenticatedUser(request);
    const uploadId = validateUuidParam(context.params.id);
    const download = await getUploadDownloadUrl(request, user, uploadId);

    return successResponse(download, { requestId });
  });
}
