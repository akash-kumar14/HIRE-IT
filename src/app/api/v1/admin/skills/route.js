import { handleRequest } from "@/lib/api/handler.js";
import { successResponse } from "@/lib/api/response.js";
import { requireMfaAdminProfile } from "@/modules/admin/admin-authorization.js";
import {
  createSkill,
} from "@/modules/categories/catalog.service.js";
import {
  readJsonBody,
  validateSkillCreate,
} from "@/modules/categories/catalog.validation.js";

export async function POST(request) {
  return handleRequest(request, async ({ requestId }) => {
    const { adminProfile } = await requireMfaAdminProfile(request);
    const input = validateSkillCreate(await readJsonBody(request));
    const skill = await createSkill(input, {
      actorAdminProfileId: adminProfile.id,
      requestId,
    });

    return successResponse(skill, { status: 201, requestId });
  });
}
