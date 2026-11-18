import { randomUUID } from "node:crypto";

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]{8,64}$/;

export function createRequestId(request) {
  const incoming = request?.headers?.get("x-request-id");

  if (incoming && REQUEST_ID_PATTERN.test(incoming)) {
    return incoming;
  }

  return randomUUID();
}
