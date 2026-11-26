import { handleRequest } from "@/lib/api/handler.js";
import { successResponse } from "@/lib/api/response.js";
import { requireMfaAdminProfile } from "@/modules/admin/admin-authorization.js";
import {
  createVerificationRequirement,
} from "@/modules/providers/verification.service.js";
import {
  readJsonBody,
  validateVerificationRequirementCreate,
} from "@/modules/providers/verification.validation.js";

export async function POST(request) {
  return handleRequest(request, async ({ requestId }) => {
    const { adminProfile } = await requireMfaAdminProfile(request);
    const input = validateVerificationRequirementCreate(
      await readJsonBody(request),
    );
    const requirement = await createVerificationRequirement(input, {
      actorAdminProfileId: adminProfile.id,
      requestId,
    });

    return successResponse(requirement, { status: 201, requestId });
  });
}
