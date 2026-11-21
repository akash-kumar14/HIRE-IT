import { handleRequest } from "@/lib/api/handler.js";
import { enforceAuthRateLimit, getClientIp } from "@/lib/api/rate-limit.js";
import { successResponse } from "@/lib/api/response.js";
import { login } from "@/modules/auth/auth.service.js";
import { readJsonBody, validateLogin } from "@/modules/auth/auth.validation.js";
import { attachSessionCookie } from "@/modules/auth/session-cookie.js";

export async function POST(request) {
  return handleRequest(request, async ({ requestId }) => {
    const input = validateLogin(await readJsonBody(request));
    await enforceAuthRateLimit({
      scope: "login",
      subject: input.email,
      ip: getClientIp(request),
    });
    const { token, user } = await login(input);
    const response = successResponse(user, { requestId });

    return attachSessionCookie(response, token);
  });
}
