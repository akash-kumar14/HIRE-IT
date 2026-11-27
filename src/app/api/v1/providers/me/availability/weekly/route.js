import { handleRequest } from "@/lib/api/handler.js";
import { successResponse } from "@/lib/api/response.js";
import { requireAuthenticatedUser } from "@/modules/auth/authorization.js";
import { replaceWeeklyAvailability } from "@/modules/providers/provider-settings.service.js";
import {
  readJsonBody,
  validateWeeklyAvailability,
} from "@/modules/providers/provider-settings.validation.js";

export async function PUT(request) {
  return handleRequest(request, async ({ requestId }) => {
    const { user } = await requireAuthenticatedUser(request);
    const input = validateWeeklyAvailability(await readJsonBody(request));
    const availability = await replaceWeeklyAvailability(user, input);

    return successResponse(availability, { requestId });
  });
}
