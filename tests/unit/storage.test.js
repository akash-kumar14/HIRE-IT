import { describe, expect, it } from "vitest";
import {
  StorageUnavailableError,
  getStorageAdapter,
  resetMockStorage,
} from "@/infrastructure/storage/index.js";
import {
  validateCompleteRequest,
  validatePresignRequest,
} from "@/modules/storage/uploads.validation.js";

const R2_ENV = {
  R2_ACCOUNT_ID: "account-id",
  R2_ACCESS_KEY_ID: "access-key",
  R2_SECRET_ACCESS_KEY: "secret-key",
  R2_BUCKET_NAME: "private-bucket",
};
const NOW = new Date("2026-01-01T00:00:00.000Z");
const OBJECT_KEY = "verification-documents/profile/verification/doc.pdf";

describe("storage adapter", () => {
  it("creates a signed PUT URL with the required R2 query parameters", async () => {
    const adapter = getStorageAdapter({ env: R2_ENV });
    const signed = await adapter.presignUpload({
      objectKey: OBJECT_KEY,
      contentType: "application/pdf",
      expiresInSeconds: 900,
      now: NOW,
    });
    const url = new URL(signed.url);

    expect(adapter.provider).toBe("r2");
    expect(signed.method).toBe("PUT");
    expect(signed.headers).toEqual({ "content-type": "application/pdf" });
    expect(`${url.origin}${url.pathname}`).toBe(
      "https://account-id.r2.cloudflarestorage.com/private-bucket/" +
        OBJECT_KEY,
    );
    expect(url.searchParams.get("X-Amz-Algorithm")).toBe(
      "AWS4-HMAC-SHA256",
    );
    expect(url.searchParams.get("X-Amz-Expires")).toBe("900");
    expect(url.searchParams.get("X-Amz-SignedHeaders")).toBe(
      "content-type;host",
    );
    expect(url.searchParams.get("X-Amz-Signature")).toMatch(/^[0-9a-f]{64}$/);
    expect(signed.expiresAt.toISOString()).toBe(
      "2026-01-01T00:15:00.000Z",
    );
  });

  it("changes the signature when credentials change", async () => {
    const first = getStorageAdapter({ env: R2_ENV });
    const second = getStorageAdapter({
      env: { ...R2_ENV, R2_SECRET_ACCESS_KEY: "different-secret" },
    });
    const input = {
      objectKey: OBJECT_KEY,
      contentType: "application/pdf",
      expiresInSeconds: 900,
      now: NOW,
    };

    const firstUrl = await first.presignUpload(input);
    const secondUrl = await second.presignUpload(input);

    expect(
      new URL(firstUrl.url).searchParams.get("X-Amz-Signature"),
    ).not.toBe(new URL(secondUrl.url).searchParams.get("X-Amz-Signature"));
  });

  it("signs HEAD object checks and treats 404 as missing", async () => {
    const calls = [];
    const adapter = getStorageAdapter({
      env: R2_ENV,
      fetchImpl: async (url, init) => {
        calls.push({ url, init });
        return { status: 404 };
      },
    });

    const exists = await adapter.objectExists({ objectKey: OBJECT_KEY, now: NOW });

    expect(exists).toBe(false);
    expect(calls).toHaveLength(1);
    expect(calls[0].init.method).toBe("HEAD");
    expect(calls[0].init.headers.authorization).toContain(
      "SignedHeaders=host;x-amz-content-sha256;x-amz-date",
    );
  });

  it("fails closed when R2 is not configured", () => {
    expect(() => getStorageAdapter({ env: {} })).toThrow(
      StorageUnavailableError,
    );
  });

  it("refuses the mock driver in production", () => {
    expect(() =>
      getStorageAdapter({
        env: { STORAGE_DRIVER: "mock", NODE_ENV: "production" },
      }),
    ).toThrow(StorageUnavailableError);
  });

  it("keeps mock URLs and object state in memory only", async () => {
    resetMockStorage();
    const adapter = getStorageAdapter({
      env: { STORAGE_DRIVER: "mock", NODE_ENV: "test" },
    });

    expect(await adapter.objectExists({ objectKey: OBJECT_KEY })).toBe(false);
    await adapter.presignUpload({
      objectKey: OBJECT_KEY,
      contentType: "application/pdf",
      now: NOW,
    });
    expect(await adapter.objectExists({ objectKey: OBJECT_KEY })).toBe(true);
    expect(adapter.createDownloadUrl({ objectKey: OBJECT_KEY, now: NOW }).url).toContain(
      "https://storage.mock/",
    );
  });
});

describe("upload validation", () => {
  const valid = {
    purpose: "verification_document",
    relatedEntityId: "5e9c4b17-5a2d-4f68-8b10-7c6d9e2a4f33",
    fileName: "identity.pdf",
    mimeType: "application/pdf",
    sizeBytes: 1024,
  };

  it("accepts supported document types", () => {
    expect(validatePresignRequest(valid)).toEqual(valid);
  });

  it("rejects unsupported file types", () => {
    expect(() =>
      validatePresignRequest({ ...valid, mimeType: "text/html" }),
    ).toThrow("Unsupported file type.");
  });

  it("rejects oversized files with a 413 code", () => {
    try {
      validatePresignRequest({ ...valid, sizeBytes: 11 * 1024 * 1024 });
      throw new Error("Expected validation to fail");
    } catch (error) {
      expect(error.code).toBe("FILE_TOO_LARGE");
      expect(error.status).toBe(413);
    }
  });

  it("requires a valid upload ID when completing", () => {
    expect(() => validateCompleteRequest({ uploadId: "not-a-uuid" })).toThrow(
      "A valid upload ID is required.",
    );
  });
});
