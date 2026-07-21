import { expect, test } from "@playwright/test";
import {
  clearDailyDivinationCache,
  expireDailyDivinationRetry,
  getDailyDivinationCacheSnapshot,
} from "./support/database";

test.beforeEach(async ({ request }) => {
  await clearDailyDivinationCache();
  await request.post("http://127.0.0.1:4101/__control/reset");
});

test("thanks ritual persists its result and exposes the daily result again", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "入殿谢神" }).click();

  await expect(page.getByRole("heading", { name: "感谢之殿" })).toBeVisible();
  const incense = page.getByRole("button", { name: /星灯微澜/ });
  await expect(incense).toBeVisible();
  await incense.click();
  await page.getByLabel("写一句你想说的话").fill("谢谢你陪我完成今天最难的一段工作。");
  await page.getByRole("button", { name: "敬上今日一炷香" }).click();

  await expect(page).toHaveURL(/\/result\/[a-z0-9]+$/);
  await expect(page.getByRole("heading", { name: "神前回音已落下" })).toBeVisible();
  await expect(
    page.getByText("这句感谢已经被殿前微光收好。你认真走过的今日，也在回音里轻轻亮着。"),
  ).toBeVisible();
  await expect(page.getByText("谢谢你陪我完成今天最难的一段工作。")).toBeVisible();
  await expect(page.getByText("今日所敬：星灯微澜")).toBeVisible();

  const resultUrl = page.url();
  await page.reload();
  await expect(
    page.getByText("这句感谢已经被殿前微光收好。你认真走过的今日，也在回音里轻轻亮着。"),
  ).toBeVisible();

  await page.getByRole("link", { name: "生成分享页" }).click();
  await expect(page).toHaveURL(/\/share\/[a-z0-9]+$/);
  await expect(
    page.getByText("这句感谢已经被殿前微光收好。你认真走过的今日，也在回音里轻轻亮着。"),
  ).toBeVisible();
  await expect(page.getByText("谢谢你陪我完成今天最难的一段工作。")).toHaveCount(0);
  await expect(page.locator('a[href^="/result/"]')).toHaveCount(0);

  await page.goto("/thanks");
  await expect(page.getByRole("button", { name: "今日一炷香已安放" })).toBeDisabled();
  await expect(page.getByRole("link", { name: "查看今日回音" })).toHaveAttribute(
    "href",
    new URL(resultUrl).pathname,
  );
});

test("divination generates and reuses one four-slip daily AI set without sending visitor questions", async ({ page, request }) => {
  const privateQuestion = "这句心问只应保存在神庙，不应发送给模型。";

  await page.goto("/divination");
  await expect(page.getByText("今日一签：可求")).toBeVisible();
  await page.getByLabel("心中所问，可写可不写").fill(privateQuestion);
  const drawButton = page.getByRole("button", { name: "抽一支签" });
  const fortuneCylinder = page.getByTestId("fortune-cylinder");
  await drawButton.click();

  await expect(fortuneCylinder).toHaveAttribute("data-state", "shaking");
  await expect(page.getByRole("button", { name: "签筒正在轻响……" })).toBeDisabled();

  await expect(page).toHaveURL(/\/result\/[a-z0-9]+$/);
  await expect(page.getByRole("heading", { name: "今日之签已落下" })).toBeVisible();
  await expect(
    page.getByText(/星河签·拾壹|灯影签·柒|月羽签·叁|云栖签·伍/),
  ).toBeVisible();
  await expect(page.getByText(privateQuestion)).toBeVisible();

  const secondPrivateQuestion = "第二位访客的心问也不应发送给模型。";
  const cachedDraw = await request.post("/api/ritual", {
    data: {
      ritualType: "divination",
      sessionId: `e2e-cached-divination-${Date.now()}`,
      userMessage: secondPrivateQuestion,
    },
  });
  expect(cachedDraw.status()).toBe(201);

  const mockLog = await request.get("http://127.0.0.1:4101/__requests");
  const logPayload = await mockLog.json();
  const divinationRequests = logPayload.requests.filter((entry: { systemPrompt: string }) =>
    entry.systemPrompt.includes("星签守"),
  );

  expect(divinationRequests).toHaveLength(1);
  expect(JSON.stringify(divinationRequests[0].body)).not.toContain(privateQuestion);
  expect(JSON.stringify(divinationRequests[0].body)).not.toContain(secondPrivateQuestion);

  const cacheRows = await getDailyDivinationCacheSnapshot();
  expect(cacheRows).toHaveLength(1);
  expect(cacheRows[0]).toMatchObject({ status: "READY", attemptCount: 1 });
  expect(Object.keys(cacheRows[0].slips ?? {}).sort()).toEqual(
    ["大吉", "中吉", "小吉", "守"].sort(),
  );

  await page.goto("/divination");
  await expect(page.getByRole("button", { name: "今日之签已收好" })).toBeDisabled();
  await expect(page.getByRole("link", { name: "查看今日之签" })).toBeVisible();
});

test("AI failure keeps the divination opportunity available for retry", async ({ page, request }) => {
  await request.post("http://127.0.0.1:4101/__control/fail-next-divination");
  await page.goto("/divination");
  await expect(page.getByText("今日一签：可求")).toBeVisible();

  const drawButton = page.getByRole("button", { name: "抽一支签" });
  const fortuneCylinder = page.getByTestId("fortune-cylinder");
  await drawButton.click();

  await expect(page.locator('p[role="alert"]')).toContainText("星轨刚刚被云遮住");
  await expect(fortuneCylinder).toHaveAttribute("data-state", "idle");
  await expect(drawButton).toBeEnabled();

  const sessionId = await page.evaluate(() => window.localStorage.getItem("ai-shrine-session"));
  const status = await request.get(
    `/api/ritual?sessionId=${encodeURIComponent(sessionId ?? "")}&ritualType=divination`,
  );
  const statusPayload = await status.json();
  expect(statusPayload).toMatchObject({ available: true });

  const failedCacheRows = await getDailyDivinationCacheSnapshot();
  expect(failedCacheRows).toHaveLength(1);
  expect(failedCacheRows[0]).toMatchObject({
    status: "FAILED",
    attemptCount: 1,
    lastErrorCode: "RATE_LIMIT",
  });

  await drawButton.click();
  await expect(page.locator('p[role="alert"]')).toContainText("星轨仍在云后歇息");

  const backedOffLog = await request.get("http://127.0.0.1:4101/__requests");
  const backedOffPayload = await backedOffLog.json();
  expect(
    backedOffPayload.requests.filter((entry: { systemPrompt: string }) =>
      entry.systemPrompt.includes("星签守"),
    ),
  ).toHaveLength(1);

  await expireDailyDivinationRetry();
  await drawButton.click();
  await expect(page).toHaveURL(/\/result\/[a-z0-9]+$/);

  const readyCacheRows = await getDailyDivinationCacheSnapshot();
  expect(readyCacheRows).toHaveLength(1);
  expect(readyCacheRows[0]).toMatchObject({ status: "READY", attemptCount: 2 });
});

test("concurrent first draws share one daily AI generation", async ({ request }) => {
  await request.post("http://127.0.0.1:4101/__control/delay-next-divination");

  const [first, second] = await Promise.all([
    request.post("/api/ritual", {
      data: {
        ritualType: "divination",
        sessionId: `e2e-concurrent-a-${Date.now()}`,
      },
    }),
    request.post("/api/ritual", {
      data: {
        ritualType: "divination",
        sessionId: `e2e-concurrent-b-${Date.now()}`,
      },
    }),
  ]);

  expect(first.status()).toBe(201);
  expect(second.status()).toBe(201);

  const mockLog = await request.get("http://127.0.0.1:4101/__requests");
  const logPayload = await mockLog.json();
  expect(
    logPayload.requests.filter((entry: { systemPrompt: string }) =>
      entry.systemPrompt.includes("星签守"),
    ),
  ).toHaveLength(1);

  const cacheRows = await getDailyDivinationCacheSnapshot();
  expect(cacheRows).toHaveLength(1);
  expect(cacheRows[0]).toMatchObject({ status: "READY", attemptCount: 1 });
});

test("non-JSON submit failure restores the thanks button", async ({ page }) => {
  await page.goto("/thanks");
  await expect(page.getByRole("button", { name: /星灯微澜/ })).toBeVisible();

  await page.route("**/api/ritual", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({ status: 503, contentType: "text/plain", body: "not-json" });
      return;
    }
    await route.continue();
  });

  const submitButton = page.getByRole("button", { name: "敬上今日一炷香" });
  await submitButton.click();

  await expect(page.locator('p[role="alert"]')).toContainText("香烟绕了一圈");
  await expect(submitButton).toBeEnabled();
});
