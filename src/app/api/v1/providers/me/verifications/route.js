import { handleRequest } from "@/lib/api/handler.js";
import { successResponse } from "@/lib/api/response.js";
import { requireAuthenticatedUser } from "@/modules/auth/authorization.js";
import {
  listOwnVerifications,
} from "@/modules/providers/verification.service.js";

export async function GET(request) {
  return handleRequest(request, async ({ requestId }) => {
    const { user } = await requireAuthenticatedUser(request);
    const verifications = await listOwnVerifications(user);

    return successResponse(verifications, { requestId });
  });
}
