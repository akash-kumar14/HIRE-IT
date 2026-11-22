import { handleRequest } from "@/lib/api/handler.js";
import { successResponse } from "@/lib/api/response.js";
import { requireAuthenticatedUser } from "@/modules/auth/authorization.js";
import { getCurrentDeletionRequest } from "@/modules/users/deletion.service.js";

export async function GET(request) {
  return handleRequest(request, async ({ requestId }) => {
    const { user } = await requireAuthenticatedUser(request);
    const result = await getCurrentDeletionRequest(user.id);

    return successResponse(result, { requestId });
  });
}
