import { handleRequest } from "@/lib/api/handler.js";
import { successResponse } from "@/lib/api/response.js";
import { requireMfaAdminProfile } from "@/modules/admin/admin-authorization.js";
import { listApplications } from "@/modules/providers/application-review.service.js";
import {
  parseApplicationListQuery,
} from "@/modules/providers/application-review.validation.js";

export async function GET(request) {
  return handleRequest(request, async ({ requestId }) => {
    await requireMfaAdminProfile(request);
    const filters = parseApplicationListQuery(request.nextUrl.searchParams);
    const { items, total } = await listApplications(filters);

    return successResponse(items, {
      requestId,
      meta: { pagination: { ...filters, total } },
    });
  });
}
