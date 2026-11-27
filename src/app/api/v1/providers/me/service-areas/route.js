import { handleRequest } from "@/lib/api/handler.js";
import { successResponse } from "@/lib/api/response.js";
import { requireAuthenticatedUser } from "@/modules/auth/authorization.js";
import {
  createOwnServiceArea,
  listOwnServiceAreas,
} from "@/modules/providers/provider-settings.service.js";
import {
  parsePagination,
  readJsonBody,
  validateServiceAreaCreate,
} from "@/modules/providers/provider-settings.validation.js";

export async function GET(request) {
  return handleRequest(request, async ({ requestId }) => {
    const { user } = await requireAuthenticatedUser(request);
    const pagination = parsePagination(request.nextUrl.searchParams);
    const { items, total } = await listOwnServiceAreas(user, pagination);

    return successResponse(items, {
      requestId,
      meta: { pagination: { ...pagination, total } },
    });
  });
}

export async function POST(request) {
  return handleRequest(request, async ({ requestId }) => {
    const { user } = await requireAuthenticatedUser(request);
    const input = validateServiceAreaCreate(await readJsonBody(request));
    const area = await createOwnServiceArea(user, input);

    return successResponse(area, { status: 201, requestId });
  });
}
