import { handleRequest } from "@/lib/api/handler.js";
import { successResponse } from "@/lib/api/response.js";
import { requireAuthenticatedUser } from "@/modules/auth/authorization.js";
import { getOwnProviderProfile } from "@/modules/providers/provider-applications.service.js";

export async function GET(request) {
  return handleRequest(request, async ({ requestId }) => {
    const { user } = await requireAuthenticatedUser(request);
    const profile = await getOwnProviderProfile(user);

    return successResponse(profile, { requestId });
  });
}
