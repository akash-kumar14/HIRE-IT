import { handleRequest } from "@/lib/api/handler.js";
import { successResponse } from "@/lib/api/response.js";
import { registerCustomer } from "@/modules/auth/auth.service.js";
import {
  readJsonBody,
  validateRegistration,
} from "@/modules/auth/auth.validation.js";
import { attachSessionCookie } from "@/modules/auth/session-cookie.js";

export async function POST(request) {
  return handleRequest(request, async ({ requestId }) => {
    const input = validateRegistration(await readJsonBody(request));
    const { token, user } = await registerCustomer(input);
    const response = successResponse(user, { status: 201, requestId });

    return attachSessionCookie(response, token);
  });
}
