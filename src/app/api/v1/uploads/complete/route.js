import { handleRequest } from "@/lib/api/handler.js";
import { successResponse } from "@/lib/api/response.js";
import { requireAuthenticatedUser } from "@/modules/auth/authorization.js";
import { completeUpload } from "@/modules/storage/uploads.service.js";
import {
  readJsonBody,
  validateCompleteRequest,
} from "@/modules/storage/uploads.validation.js";

export async function POST(request) {
  return handleRequest(request, async ({ requestId }) => {
    const { user } = await requireAuthenticatedUser(request);
    const input = validateCompleteRequest(await readJsonBody(request));
    const upload = await completeUpload(user, input.uploadId);

    return successResponse(upload, { requestId });
  });
}
