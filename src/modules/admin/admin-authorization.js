import {
  assertAdmin,
  requireAuthenticatedUser,
} from "@/modules/auth/authorization.js";
import { findAdminProfileByUserId } from "./admin.service.js";

export async function requireAdminProfile(request) {
  const current = await requireAuthenticatedUser(request);
  const adminProfile = await findAdminProfileByUserId(current.user.id);

  assertAdmin(adminProfile);

  return { ...current, adminProfile };
}
