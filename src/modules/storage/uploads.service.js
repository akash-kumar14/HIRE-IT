import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { consumeRateLimit, RateLimitError } from "@/lib/api/rate-limit.js";
import { getDb } from "@/lib/db/client.js";
import { providerVerifications } from "@/lib/db/schema/providers.js";
import { uploads } from "@/lib/db/schema/uploads.js";
import { requireMfaAdminProfile } from "@/modules/admin/admin-authorization.js";
import { ForbiddenError } from "@/modules/auth/authorization.js";
import {
  findProviderProfileByUserId,
  ProviderProfileNotFoundError,
} from "@/modules/providers/provider-applications.service.js";
import { getStorageAdapter } from "@/infrastructure/storage/index.js";
import { extensionForMimeType } from "./uploads.validation.js";

const PRESIGN_TTL_SECONDS = 15 * 60;
const DOWNLOAD_TTL_SECONDS = 10 * 60;
const PRESIGN_RATE_LIMIT = { max: 20, windowMs: 15 * 60 * 1000 };

export class UploadNotFoundError extends Error {
  constructor(message = "Upload not found.") {
    super(message);
    this.name = "UploadNotFoundError";
    this.code = "UPLOAD_NOT_FOUND";
    this.status = 404;
  }
}

export class UploadTargetNotFoundError extends Error {
  constructor(message = "Upload target not found.") {
    super(message);
    this.name = "UploadTargetNotFoundError";
    this.code = "UPLOAD_TARGET_NOT_FOUND";
    this.status = 404;
  }
}

export class UploadConflictError extends Error {
  constructor(message = "Upload cannot be changed in its current state.") {
    super(message);
    this.name = "UploadConflictError";
    this.code = "UPLOAD_CONFLICT";
    this.status = 409;
  }
}

export function toPublicUpload(upload) {
  return {
    id: upload.id,
    purpose: upload.purpose,
    fileName: upload.fileName,
    mimeType: upload.mimeType,
    sizeBytes: upload.sizeBytes,
    status: upload.status,
    relatedEntityType: upload.relatedEntityType,
    relatedEntityId: upload.relatedEntityId,
    createdAt: upload.createdAt,
    completedAt: upload.completedAt,
  };
}

export async function createVerificationUpload(
  user,
  input,
  options = {},
) {
  const {
    database = getDb(),
    storage = getStorageAdapter({ env: options.env }),
    rateLimiter = consumeRateLimit,
    now = new Date(),
  } = options;

  const limit = await rateLimiter({
    scope: "upload_presign",
    subject: user.id,
    ...PRESIGN_RATE_LIMIT,
    database,
    now,
  });

  if (!limit.allowed) {
    throw new RateLimitError(limit.retryAfterSeconds);
  }

  const profile = await findProviderProfileByUserId(user.id, { database });

  if (!profile) {
    throw new ProviderProfileNotFoundError();
  }

  const [verification] = await database
    .select()
    .from(providerVerifications)
    .where(
      and(
        eq(providerVerifications.id, input.relatedEntityId),
        eq(providerVerifications.providerProfileId, profile.id),
      ),
    )
    .limit(1);

  if (!verification) {
    throw new UploadTargetNotFoundError();
  }

  const objectKey =
    `verification-documents/${profile.id}/${verification.id}/` +
    `${randomUUID()}.${extensionForMimeType(input.mimeType)}`;
  const signed = await storage.presignUpload({
    objectKey,
    contentType: input.mimeType,
    expiresInSeconds: PRESIGN_TTL_SECONDS,
    now,
  });
  const [upload] = await database
    .insert(uploads)
    .values({
      userId: user.id,
      purpose: input.purpose,
      objectKey,
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      status: "pending",
      relatedEntityType: "verification_document",
      relatedEntityId: verification.id,
      createdAt: now,
    })
    .returning();

  return { ...toPublicUpload(upload), ...signed };
}

export async function completeUpload(user, uploadId, options = {}) {
  const { database = getDb(), storage = getStorageAdapter({ env: options.env }), now = new Date() } = options;
  const [upload] = await database
    .select()
    .from(uploads)
    .where(and(eq(uploads.id, uploadId), eq(uploads.userId, user.id)))
    .limit(1);

  if (!upload) {
    throw new UploadNotFoundError();
  }

  if (upload.status !== "pending") {
    throw new UploadConflictError("Upload is already complete.");
  }

  const exists = await storage.objectExists({ objectKey: upload.objectKey, now });

  if (!exists) {
    throw new UploadConflictError("Uploaded object was not found.");
  }

  return database.transaction(async (tx) => {
    const [completed] = await tx
      .update(uploads)
      .set({ status: "completed", completedAt: now })
      .where(and(eq(uploads.id, upload.id), eq(uploads.status, "pending")))
      .returning();

    if (!completed) {
      throw new UploadConflictError("Upload is already complete.");
    }

    if (upload.purpose === "verification_document") {
      const profile = await findProviderProfileByUserId(user.id, { database: tx });

      if (!profile) {
        throw new ProviderProfileNotFoundError();
      }

      await tx
        .update(providerVerifications)
        .set({ documentObjectKey: upload.objectKey, updatedAt: now })
        .where(
          and(
            eq(providerVerifications.id, upload.relatedEntityId),
            eq(providerVerifications.providerProfileId, profile.id),
          ),
        );
    }

    return toPublicUpload(completed);
  });
}

export async function getUploadDownloadUrl(
  request,
  user,
  uploadId,
  options = {},
) {
  const { database = getDb(), storage = getStorageAdapter({ env: options.env }), now = new Date() } = options;
  const [upload] = await database
    .select()
    .from(uploads)
    .where(eq(uploads.id, uploadId))
    .limit(1);

  if (!upload) {
    throw new UploadNotFoundError();
  }

  if (upload.userId !== user.id) {
    await requireMfaAdminProfile(request);

    if (upload.purpose !== "verification_document") {
      throw new ForbiddenError();
    }
  }

  if (upload.status !== "completed") {
    throw new UploadConflictError("Upload is not complete.");
  }

  const signed = await storage.createDownloadUrl({
    objectKey: upload.objectKey,
    expiresInSeconds: DOWNLOAD_TTL_SECONDS,
    now,
  });

  return { uploadId: upload.id, ...signed };
}
