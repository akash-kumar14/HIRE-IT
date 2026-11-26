import { handleRequest } from "@/lib/api/handler.js";
import { successResponse } from "@/lib/api/response.js";
import { requireVerifiedCustomer } from "@/modules/auth/authorization.js";
import {
  readJsonBody,
  validateApplicationCreate,
} from "@/modules/providers/provider-applications.validation.js";
import { submitApplication } from "@/modules/providers/provider-applications.service.js";

export async function POST(request) {
  return handleRequest(request, async ({ requestId }) => {
    const { user } = await requireVerifiedCustomer(request);
    const input = validateApplicationCreate(await readJsonBody(request));
    const application = await submitApplication(user, input);

    return successResponse(application, { status: 201, requestId });
  });
}
