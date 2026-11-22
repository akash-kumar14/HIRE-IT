import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client.js";
import { adminProfiles, auditLogs } from "@/lib/db/schema/users.js";

export const AUDIT_ACTIONS = Object.freeze({
  ADMIN_BOOTSTRAP: "admin.bootstrap",
  ADMIN_INVITE: "admin.invite",
  MFA_ENROLL: "admin.mfa.enroll",
  MFA_CONFIRM: "admin.mfa.confirm",
  MFA_VERIFY: "admin.mfa.verify",
  MFA_RECOVERY: "admin.mfa.recovery",
  DELETION_REQUEST_CREATED: "account.deletion_request.created",
});

export async function recordAuditEvent(input, options = {}) {
  const { database = getDb() } = options;
  const [event] = await database
    .insert(auditLogs)
    .values({
      actorUserId: input.actorUserId ?? null,
      actorAdminProfileId: input.actorAdminProfileId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      requestId: input.requestId ?? null,
      metadata: input.metadata ?? {},
      createdAt: input.createdAt ?? new Date(),
    })
    .returning();

  return event;
}

export async function recordAdminAction(input, options = {}) {
  const { database = getDb() } = options;
  let actorUserId = input.actorUserId ?? null;

  if (!actorUserId && input.adminProfileId) {
    const [profile] = await database
      .select({ userId: adminProfiles.userId })
      .from(adminProfiles)
      .where(eq(adminProfiles.id, input.adminProfileId))
      .limit(1);
    actorUserId = profile?.userId ?? null;
  }

  return recordAuditEvent(
    {
      ...input,
      actorUserId,
      actorAdminProfileId: input.adminProfileId ?? null,
    },
    { database },
  );
}
