import { handleRequest } from "@/lib/api/handler.js";
import { successResponse } from "@/lib/api/response.js";
import { requireMfaAdminProfile } from "@/modules/admin/admin-authorization.js";
import {
  createCategory,
} from "@/modules/categories/catalog.service.js";
import {
  readJsonBody,
  validateCategoryCreate,
} from "@/modules/categories/catalog.validation.js";

export async function POST(request) {
  return handleRequest(request, async ({ requestId }) => {
    const { adminProfile } = await requireMfaAdminProfile(request);
    const input = validateCategoryCreate(await readJsonBody(request));
    const category = await createCategory(input, {
      actorAdminProfileId: adminProfile.id,
      requestId,
    });

    return successResponse(category, { status: 201, requestId });
  });
}
