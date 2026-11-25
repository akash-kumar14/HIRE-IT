import { handleRequest } from "@/lib/api/handler.js";
import { successResponse } from "@/lib/api/response.js";
import {
  listSkillsByCategory,
} from "@/modules/categories/catalog.service.js";
import {
  parsePagination,
  validateUuidParam,
} from "@/modules/categories/catalog.validation.js";

export async function GET(request, { params }) {
  return handleRequest(request, async ({ requestId }) => {
    const { id } = await params;
    const categoryId = validateUuidParam(id);
    const pagination = parsePagination(request.nextUrl.searchParams);
    const { items, total } = await listSkillsByCategory(categoryId, pagination);

    return successResponse(items, {
      requestId,
      meta: { pagination: { ...pagination, total } },
    });
  });
}
