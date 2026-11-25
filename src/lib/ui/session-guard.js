import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  AuthenticationError,
  AuthorizationError,
  MfaRequiredError,
  requireAuthenticatedUser,
} from "@/modules/auth/authorization.js";
import {
  requireAdminProfile,
  requireMfaAdminProfile,
} from "@/modules/admin/admin-authorization.js";
import { findMfaCredential } from "@/modules/auth/mfa.service.js";

export const SIGN_IN_PATH = "/login";
export const FORBIDDEN_PATH = "/";
export const MFA_VERIFY_PATH = "/mfa/verify";

export function sessionRedirectPath(error) {
  if (error instanceof AuthenticationError) return SIGN_IN_PATH;
  if (error instanceof MfaRequiredError) return MFA_VERIFY_PATH;
  if (error instanceof AuthorizationError) return FORBIDDEN_PATH;
  return null;
}

async function uiRequest() {
  return { cookies: await cookies() };
}

function guardFailure(error) {
  const path = sessionRedirectPath(error);

  if (!path) {
    throw error;
  }

  redirect(path);
}

export async function requireCustomerSession() {
  try {
    return await requireAuthenticatedUser(await uiRequest());
  } catch (error) {
    guardFailure(error);
  }
}

export async function requireAdminSetupSession() {
  try {
    const current = await requireAdminProfile(await uiRequest());
    const credential = await findMfaCredential(current.adminProfile.id);

    return { ...current, credential };
  } catch (error) {
    guardFailure(error);
  }
}

export async function requireProviderSession() {
  return requireCustomerSession();
}

export async function requireAdminSession() {
  try {
    return await requireMfaAdminProfile(await uiRequest());
  } catch (error) {
    guardFailure(error);
  }
}
