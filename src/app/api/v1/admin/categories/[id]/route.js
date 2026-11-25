import { handleRequest } from "@/lib/api/handler.js";
import { successResponse } from "@/lib/api/response.js";
import { requireMfaAdminProfile } from "@/modules/admin/admin-authorization.js";
import {
  updateCategory,
} from "@/modules/categories/catalog.service.js";
import {
  readJsonBody,
  validateCategoryUpdate,
  validateUuidParam,
} from "@/modules/categories/catalog.validation.js";

export async function PATCH(request, { params }) {
  return handleRequest(request, async ({ requestId }) => {
    const { adminProfile } = await requireMfaAdminProfile(request);
    const { id } = await params;
    const categoryId = validateUuidParam(id);
    const input = validateCategoryUpdate(await readJsonBody(request));
    const category = await updateCategory(categoryId, input, {
      actorAdminProfileId: adminProfile.id,
      requestId,
    });

    return successResponse(category, { requestId });
  });
}
