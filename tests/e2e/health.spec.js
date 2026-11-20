import { expect, test } from "@playwright/test";

test("health endpoint returns success envelope", async ({ request }) => {
  const response = await request.get("/api/v1/health");

  expect(response.ok()).toBeTruthy();

  const body = await response.json();

  expect(body.success).toBe(true);
  expect(body.data.status).toBe("ok");
  expect(body.meta.requestId).toBeTruthy();
});
