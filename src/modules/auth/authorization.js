import { inspectSession } from "./auth.service.js";
import { readSessionToken } from "./session-cookie.js";

export class AuthorizationError extends Error {
  constructor(code, message, status) {
    super(message);
    this.name = "AuthorizationError";
    this.code = code;
    this.status = status;
  }
}

export class AuthenticationError extends AuthorizationError {
  constructor() {
    super("AUTHENTICATION_REQUIRED", "Authentication is required.", 401);
  }
}

export class AccountStatusError extends AuthorizationError {
  constructor(
    code = "ACCOUNT_SUSPENDED",
    message = "This account cannot access the resource.",
  ) {
    super(code, message, 403);
  }
}

export class ForbiddenError extends AuthorizationError {
  constructor() {
    super("FORBIDDEN", "You do not have access to this resource.", 403);
  }
}

export async function requireAuthenticatedUser(request) {
  const current = await inspectSession(readSessionToken(request));

  if (!current.session || !current.user) {
    throw new AuthenticationError();
  }

  if (current.accountStatus === "suspended") {
    throw new AccountStatusError();
  }

  if (current.accountStatus === "deleted") {
    throw new AccountStatusError(
      "ACCOUNT_UNAVAILABLE",
      "This account is no longer available.",
    );
  }

  return { session: current.session, user: current.user };
}

export function assertOwnedBy(resource, userId, ownerField = "userId") {
  if (!userId) {
    throw new AuthenticationError();
  }

  if (!resource || resource[ownerField] !== userId) {
    throw new ForbiddenError();
  }

  return resource;
}

export function assertCustomerOwnsTask(task, userId) {
  return assertOwnedBy(task, userId, "customerId");
}

export function assertProviderOwnsOffer(offer, providerProfileId) {
  return assertOwnedBy(offer, providerProfileId, "providerProfileId");
}
