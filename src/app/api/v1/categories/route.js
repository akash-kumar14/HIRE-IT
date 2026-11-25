import { handleRequest } from "@/lib/api/handler.js";
import { successResponse } from "@/lib/api/response.js";
import {
  listCategories,
} from "@/modules/categories/catalog.service.js";
import {
  parsePagination,
} from "@/modules/categories/catalog.validation.js";

export async function GET(request) {
  return handleRequest(request, async ({ requestId }) => {
    const pagination = parsePagination(request.nextUrl.searchParams);
    const { items, total } = await listCategories(pagination);

    return successResponse(items, {
      requestId,
      meta: { pagination: { ...pagination, total } },
    });
  });
}
