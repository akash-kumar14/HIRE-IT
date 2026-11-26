import { handleRequest } from "@/lib/api/handler.js";
import { successResponse } from "@/lib/api/response.js";
import { requireAuthenticatedUser } from "@/modules/auth/authorization.js";
import { createVerificationUpload } from "@/modules/storage/uploads.service.js";
import {
  readJsonBody,
  validatePresignRequest,
} from "@/modules/storage/uploads.validation.js";

export async function POST(request) {
  return handleRequest(request, async ({ requestId }) => {
    const { user } = await requireAuthenticatedUser(request);
    const input = validatePresignRequest(await readJsonBody(request));
    const upload = await createVerificationUpload(user, input);

    return successResponse(upload, { status: 201, requestId });
  });
}
