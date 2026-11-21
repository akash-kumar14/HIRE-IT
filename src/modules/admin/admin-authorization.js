import {
  assertAdmin,
  assertMfaEnrolled,
  assertMfaVerified,
  requireAuthenticatedUser,
} from "@/modules/auth/authorization.js";
import { findMfaCredential } from "@/modules/auth/mfa.service.js";
import { findAdminProfileByUserId } from "./admin.service.js";

export async function requireAdminProfile(request) {
  const current = await requireAuthenticatedUser(request);
  const adminProfile = await findAdminProfileByUserId(current.user.id);

  assertAdmin(adminProfile);

  return { ...current, adminProfile };
}

export async function requireMfaAdminProfile(request) {
  const current = await requireAdminProfile(request);
  const credential = await findMfaCredential(current.adminProfile.id);

  assertMfaEnrolled(credential);
  assertMfaVerified(current.session);

  return { ...current, credential };
}
