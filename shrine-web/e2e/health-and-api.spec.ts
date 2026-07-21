import { expect, test } from "@playwright/test";

test("health check probes the database and disables caching", async ({ request }) => {
  const response = await request.get("/api/health");
  const payload = await response.json();

  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(payload).toMatchObject({
    ok: true,
    status: "ready",
    service: "ai-shrine",
    database: { status: "up" },
    openai: { configured: true },
  });
  expect(payload.database.latencyMs).toBeGreaterThanOrEqual(0);
  expect(Number.isNaN(Date.parse(payload.checkedAt))).toBe(false);
});

test("health check rejects a database with missing migrations", async ({ request }) => {
  const response = await request.get("http://127.0.0.1:3102/api/health");
  const payload = await response.json();

  expect(response.status()).toBe(503);
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(payload).toMatchObject({
    ok: false,
    status: "not_ready",
    database: { status: "not_ready", reason: "migration_required" },
  });
});

test("invalid ritual requests return stable JSON errors", async ({ request }) => {
  const malformed = await request.fetch("/api/ritual", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    data: "{",
  });
  const malformedPayload = await malformed.json();

  expect(malformed.status()).toBe(400);
  expect(malformedPayload).toMatchObject({ code: "INVALID_REQUEST" });
  expect(malformedPayload.requestId).toEqual(expect.any(String));

  const invalidType = await request.post("/api/ritual", {
    data: { ritualType: "unknown", sessionId: "e2e-invalid-type" },
  });
  const invalidPayload = await invalidType.json();

  expect(invalidType.status()).toBe(400);
  expect(invalidPayload.code).toBe("INVALID_REQUEST");
  expect(JSON.stringify(invalidPayload)).not.toMatch(/Prisma|postgres|OpenAI|stack/i);
});

test("daily duplicate returns 409 and the existing result id", async ({ request }) => {
  const sessionId = `e2e-api-thanks-${Date.now()}`;
  const menuResponse = await request.get(
    `/api/incense?sessionId=${encodeURIComponent(sessionId)}`,
  );
  const menu = await menuResponse.json();
  const ritual = {
    ritualType: "thanks",
    sessionId,
    incenseName: menu.incense[0].name,
    userMessage: "谢谢今日被稳稳接住的这一小段路。",
  };

  const first = await request.post("/api/ritual", { data: ritual });
  const firstPayload = await first.json();
  const duplicate = await request.post("/api/ritual", { data: ritual });
  const duplicatePayload = await duplicate.json();

  expect(first.status()).toBe(201);
  expect(duplicate.status()).toBe(409);
  expect(duplicatePayload).toMatchObject({
    code: "DAILY_RITUAL_COMPLETED",
    resultId: firstPayload.id,
  });
});

test("missing result uses the shrine 404 page", async ({ page }) => {
  const response = await page.goto("/result/e2e-result-does-not-exist");

  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "殿中回音尚未落座" })).toBeVisible();
  await expect(page.getByRole("link", { name: "回到神庙入口" })).toBeVisible();
});
