import http from "node:http";

const port = 4101;
const requests = [];
let failNextDivination = false;
let delayNextDivination = false;

function sendJson(response, status, value) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(value));
}

function outputText(text) {
  return {
    output: [
      {
        content: [{ type: "output_text", text }],
      },
    ],
  };
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

const server = http.createServer(async (request, response) => {
  if (request.method === "GET" && request.url === "/health") {
    return sendJson(response, 200, { ok: true });
  }

  if (request.method === "GET" && request.url === "/__requests") {
    return sendJson(response, 200, { requests });
  }

  if (request.method === "POST" && request.url === "/__control/reset") {
    requests.length = 0;
    failNextDivination = false;
    delayNextDivination = false;
    return sendJson(response, 200, { ok: true });
  }

  if (request.method === "POST" && request.url === "/__control/fail-next-divination") {
    failNextDivination = true;
    return sendJson(response, 200, { ok: true });
  }

  if (request.method === "POST" && request.url === "/__control/delay-next-divination") {
    delayNextDivination = true;
    return sendJson(response, 200, { ok: true });
  }

  if (request.method !== "POST" || request.url !== "/v1/responses") {
    return sendJson(response, 404, { error: "not_found" });
  }

  const rawBody = await readBody(request);
  const body = JSON.parse(rawBody);
  const systemPrompt = body.input?.find((item) => item.role === "system")?.content ?? "";
  requests.push({ systemPrompt, body });

  if (systemPrompt.includes("星签守") && delayNextDivination) {
    delayNextDivination = false;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  if (systemPrompt.includes("星签守") && failNextDivination) {
    failNextDivination = false;
    return sendJson(response, 429, { error: { message: "e2e_rate_limit" } });
  }

  if (systemPrompt.includes("谕文撰录官")) {
    return sendJson(
      response,
      200,
      outputText(
        JSON.stringify({
          incense: [
            { name: "星灯微澜", note: "像晚风绕过回廊，把今日余温轻轻收好。" },
            { name: "月羽静泊", note: "像月色停在木檐，让未说完的谢谢慢慢落下。" },
            { name: "云栖薄梦", note: "像薄雾经过灯前，陪你松开一点疲惫。" },
          ],
        }),
      ),
    );
  }

  if (systemPrompt.includes("回音小神")) {
    return sendJson(
      response,
      200,
      outputText("这句感谢已经被殿前微光收好。你认真走过的今日，也在回音里轻轻亮着。"),
    );
  }

  if (systemPrompt.includes("星签守")) {
    return sendJson(
      response,
      200,
      outputText(
        JSON.stringify({
          大吉: {
            fortuneName: "星河签·拾壹",
            resultText:
              "星光落在檐前，今日不必急着追赶远处。先把眼前一步走稳，回音自然会靠近。",
          },
          中吉: {
            fortuneName: "灯影签·柒",
            resultText:
              "檐下灯火正暖，手边的小事也在悄悄成形。循着这份从容往前，今日自有温柔回响。",
          },
          小吉: {
            fortuneName: "月羽签·叁",
            resultText:
              "一枚星屑停在签角，轻轻的欢喜也值得收好。不必追得太远，眼前这一程已有微光相伴。",
          },
          守: {
            fortuneName: "云栖签·伍",
            resultText:
              "云在殿外慢慢散开，停一停也算今日的好兴致。把心放松些，下一阵风来时再悠然起身。",
          },
        }),
      ),
    );
  }

  return sendJson(response, 400, { error: { message: "unknown_prompt" } });
});

server.listen(port, "127.0.0.1");

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
