import { handleRequest } from "@/lib/api/handler.js";
import { errorResponse, successResponse } from "@/lib/api/response.js";
import { getCurrentSession } from "@/modules/auth/auth.service.js";
import { readSessionToken } from "@/modules/auth/session-cookie.js";

export async function GET(request) {
  return handleRequest(request, async ({ requestId }) => {
    const token = readSessionToken(request);
    const current = await getCurrentSession(token);

    if (!current) {
      return errorResponse("AUTHENTICATION_REQUIRED", "Authentication is required.", {
        status: 401,
        requestId,
      });
    }

    return successResponse(current.user, { requestId });
  });
}
