import { handleRequest } from "@/lib/api/handler.js";
import { successResponse } from "@/lib/api/response.js";
import { requireAuthenticatedUser } from "@/modules/auth/authorization.js";
import {
  readOptionalJsonBody,
  validateDeletionRequest,
} from "@/modules/auth/auth.validation.js";
import { createDeletionRequest } from "@/modules/users/deletion.service.js";

export async function POST(request) {
  return handleRequest(request, async ({ requestId }) => {
    const { user } = await requireAuthenticatedUser(request);
    const input = validateDeletionRequest(await readOptionalJsonBody(request));
    const result = await createDeletionRequest({
      userId: user.id,
      reason: input.reason,
      requestId,
    });

    return successResponse(result, { status: 201, requestId });
  });
}
