import { handleRequest } from "@/lib/api/handler.js";
import { successResponse } from "@/lib/api/response.js";
import { requireMfaAdminProfile } from "@/modules/admin/admin-authorization.js";
import {
  updateSkill,
} from "@/modules/categories/catalog.service.js";
import {
  readJsonBody,
  validateSkillUpdate,
  validateUuidParam,
} from "@/modules/categories/catalog.validation.js";

export async function PATCH(request, { params }) {
  return handleRequest(request, async ({ requestId }) => {
    const { adminProfile } = await requireMfaAdminProfile(request);
    const { id } = await params;
    const skillId = validateUuidParam(id);
    const input = validateSkillUpdate(await readJsonBody(request));
    const skill = await updateSkill(skillId, input, {
      actorAdminProfileId: adminProfile.id,
      requestId,
    });

    return successResponse(skill, { requestId });
  });
}
