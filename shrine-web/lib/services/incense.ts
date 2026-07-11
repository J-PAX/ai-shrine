import { createRitualEvent, getRitualEventBySessionAndType } from "../db/queries";

export type IncenseOption = {
  name: string;
  note: string;
};

type OpenAIResponse = {
  output?: Array<{
    content?: Array<{ type?: string; text?: string }>;
  }>;
};

const nameFirst = ["月栖", "星渡", "云岫", "春灯", "青鸟", "薄暮", "雨庭", "雾海", "霜羽", "萤川"];
const nameLast = ["沉光", "晚烟", "花影", "风信", "雪梦", "灯舟", "苔歌", "晨露", "夜羽", "星痕"];
const noteFirst = ["像月色落在旧木上", "像微风穿过安静回廊", "像远山收起最后一层雾", "像一粒没有熄灭的星"];
const noteLast = ["替今日留住一点余温。", "让尚未说完的感谢轻轻落地。", "也把疲惫安放在殿外。", "陪你慢慢松开紧绷的肩。"];

function getTokyoDayKey(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function hash(value: string) {
  return Array.from(value).reduce((total, char) => (total * 31 + char.charCodeAt(0)) >>> 0, 2166136261);
}

function createFallbackIncense(seedText: string): IncenseOption[] {
  const seed = hash(seedText);

  return [0, 1, 2].map((index) => ({
    name: `${nameFirst[(seed + index * 3) % nameFirst.length]}${nameLast[(seed + index * 7) % nameLast.length]}`,
    note: `${noteFirst[(seed + index) % noteFirst.length]}，${noteLast[(seed + index * 3) % noteLast.length]}`,
  }));
}

function extractResponseText(response: OpenAIResponse) {
  return response.output
    ?.flatMap((item) => item.content ?? [])
    .find((content) => content.type === "output_text" && content.text)?.text;
}

function parseIncenseOptions(text: string): IncenseOption[] | null {
  try {
    const jsonText = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    const value = JSON.parse(jsonText) as { incense?: unknown };

    if (!Array.isArray(value.incense) || value.incense.length !== 3) {
      return null;
    }

    const incense = value.incense.filter(
      (item): item is IncenseOption =>
        Boolean(item) &&
        typeof item === "object" &&
        typeof (item as IncenseOption).name === "string" &&
        typeof (item as IncenseOption).note === "string" &&
        (item as IncenseOption).name.length <= 12 &&
        (item as IncenseOption).note.length <= 48,
    );

    return incense.length === 3 ? incense : null;
  } catch {
    return null;
  }
}

async function generateWithOpenAI(seedText: string): Promise<IncenseOption[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-5.4-nano",
      input: [
        {
          role: "system",
          content:
            "你是AI神庙的谕文撰录官。生成温柔、轻盈、有二次元幻想感的虚构香名，不模仿现实宗教，不算命，不恐吓，不使用功效或命运承诺。",
        },
        {
          role: "user",
          content: `依据随机印记 ${seedText} 创作三款彼此不同的今日香。每个香名4到8个汉字，不能使用常见现实香型名称；每条描述16到32个汉字，只写气味意境。仅返回JSON：{"incense":[{"name":"...","note":"..."}]}`,
        },
      ],
      max_output_tokens: 300,
    }),
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) {
    throw new Error(`OpenAI incense generation failed: ${response.status}`);
  }

  const data = (await response.json()) as OpenAIResponse;
  const text = extractResponseText(data);
  return text ? parseIncenseOptions(text) : null;
}

export async function getDailyIncense(sessionId: string) {
  const dayKey = getTokyoDayKey();
  const eventType = `incense_menu:${dayKey}`;
  const cached = await getRitualEventBySessionAndType(sessionId, eventType);

  if (cached?.resultText) {
    const cachedOptions = parseIncenseOptions(cached.resultText);
    if (cachedOptions) return { incense: cachedOptions, source: "cache" as const };
  }

  const seedText = `${sessionId}:${dayKey}`;
  let incense: IncenseOption[] | null = null;
  let source: "openai" | "fallback" = "fallback";

  try {
    incense = await generateWithOpenAI(seedText);
    if (incense) source = "openai";
  } catch (error) {
    console.warn("AI incense generation failed; using composed fallback.", error);
  }

  incense ??= createFallbackIncense(seedText);
  await createRitualEvent({
    sessionId,
    eventType,
    resultText: JSON.stringify({ incense }),
  });

  return { incense, source };
}
