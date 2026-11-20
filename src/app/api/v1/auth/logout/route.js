import { handleRequest } from "@/lib/api/handler.js";
import { errorResponse, successResponse } from "@/lib/api/response.js";
import { logout } from "@/modules/auth/auth.service.js";
import {
  clearSessionCookie,
  readSessionToken,
} from "@/modules/auth/session-cookie.js";

export async function POST(request) {
  return handleRequest(request, async ({ requestId }) => {
    const token = readSessionToken(request);
    const signedOut = await logout(token);
    const response = signedOut
      ? successResponse({ signedOut: true }, { requestId })
      : errorResponse("AUTHENTICATION_REQUIRED", "Authentication is required.", {
          status: 401,
          requestId,
        });

    return clearSessionCookie(response);
  });
}
