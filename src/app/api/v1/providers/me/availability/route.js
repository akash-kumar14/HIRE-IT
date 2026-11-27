import { handleRequest } from "@/lib/api/handler.js";
import { successResponse } from "@/lib/api/response.js";
import { requireAuthenticatedUser } from "@/modules/auth/authorization.js";
import {
  getOwnAvailability,
  setOwnAvailability,
} from "@/modules/providers/provider-settings.service.js";
import {
  readJsonBody,
  validateAvailabilityToggle,
} from "@/modules/providers/provider-settings.validation.js";

export async function GET(request) {
  return handleRequest(request, async ({ requestId }) => {
    const { user } = await requireAuthenticatedUser(request);
    const availability = await getOwnAvailability(user);

    return successResponse(availability, { requestId });
  });
}

export async function PATCH(request) {
  return handleRequest(request, async ({ requestId }) => {
    const { user } = await requireAuthenticatedUser(request);
    const input = validateAvailabilityToggle(await readJsonBody(request));
    const availability = await setOwnAvailability(user, input);

    return successResponse(availability, { requestId });
  });
}
