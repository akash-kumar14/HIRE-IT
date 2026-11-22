import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client.js";
import { accountDeletionRequests } from "@/lib/db/schema/users.js";
import {
  AUDIT_ACTIONS,
  recordAuditEvent,
} from "@/modules/audit/audit.service.js";

export class DeletionRequestPendingError extends Error {
  constructor() {
    super("A deletion request is already pending.");
    this.name = "DeletionRequestPendingError";
    this.code = "DELETION_REQUEST_PENDING";
    this.status = 409;
  }
}

function isUniqueViolation(error) {
  let current = error;

  while (current) {
    if (current.code === "23505") {
      return true;
    }

    current = current.cause;
  }

  return false;
}

export function toDeletionRequestView(request) {
  return {
    id: request.id,
    status: request.status,
    reason: request.reason,
    requestedAt: request.requestedAt,
    reviewedAt: request.reviewedAt,
    completedAt: request.completedAt,
  };
}

export async function getCurrentDeletionRequest(userId, options = {}) {
  const { database = getDb() } = options;
  const [request] = await database
    .select()
    .from(accountDeletionRequests)
    .where(eq(accountDeletionRequests.userId, userId))
    .orderBy(desc(accountDeletionRequests.requestedAt))
    .limit(1);

  return request ? toDeletionRequestView(request) : null;
}

export async function createDeletionRequest(input, options = {}) {
  const { database = getDb() } = options;

  try {
    return await database.transaction(async (tx) => {
      const [request] = await tx
        .insert(accountDeletionRequests)
        .values({
          userId: input.userId,
          status: "pending",
          reason: input.reason ?? null,
        })
        .returning();

      await recordAuditEvent(
        {
          actorUserId: input.userId,
          action: AUDIT_ACTIONS.DELETION_REQUEST_CREATED,
          entityType: "account_deletion_request",
          entityId: request.id,
          requestId: input.requestId ?? null,
          metadata: { status: request.status },
        },
        { database: tx },
      );

      return toDeletionRequestView(request);
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new DeletionRequestPendingError();
    }

    throw error;
  }
}
