import { handleRequest } from "@/lib/api/handler.js";
import { successResponse } from "@/lib/api/response.js";
import { requireAuthenticatedUser } from "@/modules/auth/authorization.js";
import { deleteOwnServiceArea } from "@/modules/providers/provider-settings.service.js";
import { validateUuidParam } from "@/modules/providers/provider-settings.validation.js";

export async function DELETE(request, { params }) {
  return handleRequest(request, async ({ requestId }) => {
    const { user } = await requireAuthenticatedUser(request);
    const { id } = await params;
    const area = await deleteOwnServiceArea(user, validateUuidParam(id));

    return successResponse(area, { requestId });
  });
}
