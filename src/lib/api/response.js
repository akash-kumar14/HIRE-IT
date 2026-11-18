import { NextResponse } from "next/server";

export function successResponse(
  data,
  { status = 200, requestId, meta = {}, headers = {} } = {},
) {
  return NextResponse.json(
    { success: true, data, meta: { ...meta, requestId } },
    {
      status,
      headers: {
        "x-request-id": requestId,
        "cache-control": "no-store",
        ...headers,
      },
    },
  );
}

export function errorResponse(
  code,
  message,
  { status = 500, requestId, meta = {}, headers = {} } = {},
) {
  return NextResponse.json(
    { success: false, error: { code, message }, meta: { ...meta, requestId } },
    {
      status,
      headers: {
        "x-request-id": requestId,
        "cache-control": "no-store",
        ...headers,
      },
    },
  );
}
