import { createRequestId } from "@/lib/api/request-id";
import { successResponse } from "@/lib/api/response";
import { validateEnv } from "@/lib/config/env";

export const dynamic = "force-dynamic";

export function GET(request) {
  const requestId = createRequestId(request);
  const env = validateEnv();

  return successResponse(
    {
      status: "ok",
      configuration: env.valid ? "valid" : "incomplete",
      timestamp: new Date().toISOString(),
    },
    { requestId },
  );
}
