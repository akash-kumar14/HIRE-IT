import { createSession, findActiveSessionByToken, revokeSession } from "./sessions.service.js";
import { hashPassword, verifyPassword } from "./password.js";
import {
  createUser,
  findUserById,
  findUserByEmail,
  toPublicUser,
} from "@/modules/users/users.service.js";

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid email or password");
    this.name = "InvalidCredentialsError";
    this.code = "INVALID_CREDENTIALS";
  }
}

function isUsableUser(user) {
  return user?.status === "active" && user.deletedAt === null;
}

export async function registerCustomer(input) {
  const passwordHash = await hashPassword(input.password);
  const user = await createUser({
    email: input.email,
    passwordHash,
    fullName: input.fullName,
    phone: input.phone,
  });
  const { token } = await createSession(user.id);

  return { token, user: toPublicUser(user) };
}

export async function login(input) {
  const user = await findUserByEmail(input.email);

  if (!isUsableUser(user)) {
    throw new InvalidCredentialsError();
  }

  if (!(await verifyPassword(input.password, user.passwordHash))) {
    throw new InvalidCredentialsError();
  }

  const { token } = await createSession(user.id);
  return { token, user: toPublicUser(user) };
}

export async function inspectSession(token) {
  const session = await findActiveSessionByToken(token);

  if (!session) {
    return { session: null, user: null, accountStatus: "anonymous" };
  }

  const user = await findUserById(session.userId);

  if (!user) {
    return { session, user: null, accountStatus: "missing" };
  }

  if (user.deletedAt !== null || user.status === "deleted") {
    return { session, user: toPublicUser(user), accountStatus: "deleted" };
  }

  if (!isUsableUser(user)) {
    return { session, user: toPublicUser(user), accountStatus: "suspended" };
  }

  return { session, user: toPublicUser(user), accountStatus: "active" };
}

export async function getCurrentSession(token) {
  const current = await inspectSession(token);

  if (!current.session || current.accountStatus !== "active") {
    return null;
  }

  return { session: current.session, user: current.user };
}

export async function logout(token) {
  const session = await findActiveSessionByToken(token);

  if (!session) {
    return false;
  }

  return revokeSession(session.id);
}
