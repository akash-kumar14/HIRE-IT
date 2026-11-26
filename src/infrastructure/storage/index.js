import { createHash, createHmac } from "node:crypto";
import { validateEnv } from "@/lib/config/env.js";

const REGION = "auto";
const SERVICE = "s3";
const R2_KEYS = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
];

export class StorageUnavailableError extends Error {
  constructor(message = "Object storage is unavailable.") {
    super(message);
    this.name = "StorageUnavailableError";
    this.code = "STORAGE_UNAVAILABLE";
    this.status = 503;
  }
}

export class StorageObjectNotFoundError extends Error {
  constructor(message = "Uploaded object was not found.") {
    super(message);
    this.name = "StorageObjectNotFoundError";
    this.code = "UPLOAD_OBJECT_MISSING";
    this.status = 409;
  }
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(key, value) {
  return createHmac("sha256", key).update(value).digest();
}

function amzDate(now) {
  return now.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function dateStamp(now) {
  return amzDate(now).slice(0, 8);
}

function encode(value) {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function objectPath(bucket, objectKey) {
  return `/${bucket}/${objectKey.split("/").map(encode).join("/")}`;
}

function queryString(query) {
  return Object.entries(query)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${encode(key)}=${encode(value)}`)
    .join("&");
}

function signature({ config, now, method, path, query, signedHeaders, headers, payloadHash }) {
  const scope = `${dateStamp(now)}/${REGION}/${SERVICE}/aws4_request`;
  const canonicalHeaders = signedHeaders
    .map((key) => `${key}:${headers[key]}\n`)
    .join("");
  const canonicalRequest = [
    method,
    path,
    query,
    canonicalHeaders,
    signedHeaders.join(";"),
    payloadHash,
  ].join("\n");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate(now),
    scope,
    sha256(canonicalRequest),
  ].join("\n");
  const signingKey = hmac(
    hmac(
      hmac(hmac(`AWS4${config.secretAccessKey}`, dateStamp(now)), REGION),
      SERVICE,
    ),
    "aws4_request",
  );

  return hmac(signingKey, stringToSign).toString("hex");
}

function presign({ config, method, objectKey, contentType, expiresInSeconds, now }) {
  const host = `${config.accountId}.r2.cloudflarestorage.com`;
  const path = objectPath(config.bucketName, objectKey);
  const signedHeaders = method === "PUT" ? ["content-type", "host"] : ["host"];
  const headers =
    method === "PUT"
      ? { "content-type": contentType, host }
      : { host };
  const query = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Content-Sha256": "UNSIGNED-PAYLOAD",
    "X-Amz-Credential": `${config.accessKeyId}/${dateStamp(now)}/${REGION}/${SERVICE}/aws4_request`,
    "X-Amz-Date": amzDate(now),
    "X-Amz-Expires": String(expiresInSeconds),
    "X-Amz-SignedHeaders": signedHeaders.join(";"),
  };
  const canonicalQuery = queryString(query);
  const signed = signature({
    config,
    now,
    method,
    path,
    query: canonicalQuery,
    signedHeaders,
    headers,
    payloadHash: "UNSIGNED-PAYLOAD",
  });

  return {
    url: `https://${host}${path}?${canonicalQuery}&X-Amz-Signature=${signed}`,
    method,
    headers: method === "PUT" ? { "content-type": contentType } : {},
    expiresAt: new Date(now.getTime() + expiresInSeconds * 1000),
  };
}

function createR2Adapter({ env = process.env, fetchImpl = fetch } = {}) {
  const { valid, values } = validateEnv(env);
  const missing = R2_KEYS.some((key) => !values[key]);

  if (!valid || missing) {
    throw new StorageUnavailableError();
  }

  const config = {
    accountId: values.R2_ACCOUNT_ID,
    accessKeyId: values.R2_ACCESS_KEY_ID,
    secretAccessKey: values.R2_SECRET_ACCESS_KEY,
    bucketName: values.R2_BUCKET_NAME,
  };

  async function headObject({ objectKey, now = new Date() }) {
    const host = `${config.accountId}.r2.cloudflarestorage.com`;
    const path = objectPath(config.bucketName, objectKey);
    const payloadHash = sha256("");
    const headers = {
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate(now),
    };
    const signedHeaders = ["host", "x-amz-content-sha256", "x-amz-date"];
    const signed = signature({
      config,
      now,
      method: "HEAD",
      path,
      query: "",
      signedHeaders,
      headers: { ...headers, host },
      payloadHash,
    });
    const authorization =
      `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${dateStamp(now)}/${REGION}/${SERVICE}/aws4_request, ` +
      `SignedHeaders=${signedHeaders.join(";")}, Signature=${signed}`;
    const response = await fetchImpl(`https://${host}${path}`, {
      method: "HEAD",
      headers: { ...headers, authorization },
    });

    return response.status >= 200 && response.status < 300;
  }

  return {
    provider: "r2",
    async presignUpload(input) {
      return presign({ config, method: "PUT", ...input });
    },
    createDownloadUrl(input) {
      return presign({ config, method: "GET", ...input });
    },
    objectExists: headObject,
  };
}

const mockObjects = new Set();

export function resetMockStorage() {
  mockObjects.clear();
}

function createMockAdapter() {
  function mockUrl(objectKey) {
    return `https://storage.mock/${encodeURIComponent(objectKey)}`;
  }

  return {
    provider: "mock",
    async presignUpload({ objectKey, contentType, expiresInSeconds = 900, now = new Date() }) {
      mockObjects.add(objectKey);

      return {
        url: mockUrl(objectKey),
        method: "PUT",
        headers: { "content-type": contentType },
        expiresAt: new Date(now.getTime() + expiresInSeconds * 1000),
      };
    },
    createDownloadUrl({ objectKey, expiresInSeconds = 900, now = new Date() }) {
      if (!mockObjects.has(objectKey)) {
        throw new StorageObjectNotFoundError();
      }

      return {
        url: mockUrl(objectKey),
        method: "GET",
        headers: {},
        expiresAt: new Date(now.getTime() + expiresInSeconds * 1000),
      };
    },
    async objectExists({ objectKey }) {
      return mockObjects.has(objectKey);
    },
  };
}

export function getStorageAdapter({
  env = process.env,
  fetchImpl = fetch,
} = {}) {
  const driver = env.STORAGE_DRIVER ?? "r2";

  if (driver === "mock") {
    if (env.NODE_ENV === "production") {
      throw new StorageUnavailableError();
    }

    return createMockAdapter();
  }

  if (driver !== "r2") {
    throw new StorageUnavailableError();
  }

  return createR2Adapter({ env, fetchImpl });
}
