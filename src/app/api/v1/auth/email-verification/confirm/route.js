import { handleRequest } from "@/lib/api/handler.js";
import { successResponse } from "@/lib/api/response.js";
import {
  readJsonBody,
  validateVerificationConfirm,
} from "@/modules/auth/auth.validation.js";
import { confirmEmailVerification } from "@/modules/auth/verification.service.js";

export async function POST(request) {
  return handleRequest(request, async ({ requestId }) => {
    const input = validateVerificationConfirm(await readJsonBody(request));
    const user = await confirmEmailVerification(input);

    return successResponse(user, { requestId });
  });
}
