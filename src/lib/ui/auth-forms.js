export const DEFAULT_AUTH_REDIRECT = "/dashboard";

export function resolveNextPath(value, fallback = DEFAULT_AUTH_REDIRECT) {
  if (typeof value !== "string") return fallback;

  const trimmed = value.trim();

  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("\\")) {
    return fallback;
  }

  return trimmed;
}

export function getApiErrorMessage(payload, fallback = "Something went wrong.") {
  return payload?.error?.message ?? fallback;
}

export function readSearchParam(value) {
  if (Array.isArray(value)) return value[0] ?? "";
  return typeof value === "string" ? value : "";
}

export async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(payload));
  }

  return payload;
}
