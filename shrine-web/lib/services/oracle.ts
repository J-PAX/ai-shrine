import { shrineGods } from "../content/gods";
import {
  divinationOracleSystemPrompt,
  thanksOracleSystemPrompt,
} from "../content/prompts";
import {
  claimDailyDivinationGeneration,
  completeDailyDivinationGeneration,
  failDailyDivinationGeneration,
  getDailyDivinationSet,
  type DailyDivinationSlipsInput,
} from "../db/daily-divination";
import { aiUnavailable, databaseUnavailable } from "../http/errors";

export type OracleResult = {
  godName: string;
  resultText: string;
  fortuneName?: string;
  mood?: string;
};

type FortuneMood = "大吉" | "中吉" | "小吉" | "守";

type DivinationGenerationErrorCode =
  | "NOT_CONFIGURED"
  | "RATE_LIMIT"
  | "AUTH_ERROR"
  | "TIMEOUT"
  | "UPSTREAM_ERROR"
  | "INVALID_OUTPUT";

type ThanksOracleInput = {
  userMessage: string;
  incenseName: string;
  variationMark: string;
  dayKey: string;
};

type DivinationOracleInput = {
  selectionSeed: string;
  dayKey: string;
};

type OpenAIResponse = {
  output?: Array<{
    content?: Array<{ type?: string; text?: string }>;
  }>;
};

const fortuneMoods: FortuneMood[] = ["大吉", "中吉", "小吉", "守"];
const divinationLeaseMs = 20_000;
const divinationWaitMs = 11_000;

const localDailyDivinationSets: DailyDivinationSlipsInput[] = [
  {
    大吉: {
      fortuneName: "星灯签·壹",
      resultText: "星灯已在檐前亮起，今日的好心情正轻轻靠近。带着从容往前走，沿途自有温柔回响。",
    },
    中吉: {
      fortuneName: "月羽签·柒",
      resultText: "月色落在签角，手边的小事正在慢慢成形。不必赶路，今日每一步都有自己的微光。",
    },
    小吉: {
      fortuneName: "云糖签·叁",
      resultText: "一小团云停在殿外，替今日藏好了一点欢喜。轻松走完眼前这程，便是很好的相遇。",
    },
    守: {
      fortuneName: "风眠签·伍",
      resultText: "风在回廊歇了一会儿，殿前也因此更安静。今日慢一点无妨，好兴致会在停留中醒来。",
    },
  },
  {
    大吉: {
      fortuneName: "晴岚签·玖",
      resultText: "晨光穿过薄雾，恰好照亮今日的门槛。放心收下这份明朗，让轻快陪你多走一程。",
    },
    中吉: {
      fortuneName: "灯花签·贰",
      resultText: "灯花轻轻一跳，像是为今日悄悄鼓掌。无需用力证明什么，从容本身就是好风景。",
    },
    小吉: {
      fortuneName: "星屑签·陆",
      resultText: "几粒星屑落进签筒，发出很轻的笑声。今日适合把小小期待收好，再悠然向前。",
    },
    守: {
      fortuneName: "云栖签·肆",
      resultText: "云朵暂住在屋檐，连时间也放慢了脚步。且在此刻松一松肩，下一阵风自会来访。",
    },
  },
];

class DivinationGenerationError extends Error {
  constructor(public readonly code: DivinationGenerationErrorCode, message: string) {
    super(message);
    this.name = "DivinationGenerationError";
  }
}

const thanksOracles = [
  "你的感谢，已被听见。今日所行，并非徒劳。请把这点微光，也留给努力过的自己。",
  "香烟很轻，谢意不轻。众神看见你今日认真走过的路。",
  "这句谢谢已经落在殿前。愿你今晚少想一点，多歇一会儿。",
  "代码、文字、灵感与疲惫，都已暂存神龛。你可以先把肩放松。",
];

const thanksTopicEchoes = [
  {
    pattern: /代码|程序|开发|bug|报错|项目|上线|数据库|前端|后端/i,
    lines: [
      "那些反复推敲的字符，已经替你把认真说得很清楚。",
      "今日与难题相持的耐心，回音小神已经看见。",
    ],
  },
  {
    pattern: /学习|考试|作业|论文|读书|课程/i,
    lines: [
      "那些慢慢读懂的时刻，并没有白白经过。",
      "今日落在纸页与思绪里的认真，已被殿前微光收好。",
    ],
  },
  {
    pattern: /画|写|创作|设计|音乐|灵感|作品/i,
    lines: [
      "尚未完全成形的灵感，也已经有了自己的微光。",
      "今日被你认真照料过的灵感，正在雾里轻轻发亮。",
    ],
  },
  {
    pattern: /工作|加班|会议|客户|同事|任务/i,
    lines: [
      "那些无人鼓掌的忙碌，也确实推动了今日向前。",
      "今日扛住的琐碎与疲惫，殿前都替你记下了。",
    ],
  },
];

const fallbackEndings = [
  "这缕香会替你把谢谢送到，也留一点余温给你自己。",
  "谢意已经落下，你今日认真走过的路也一并被看见。",
  "回音不长，却足够替今天轻轻点一盏灯。",
  "就让这句谢谢停在这里，安静地亮一会儿。",
];

const disallowedOraclePatterns = [
  /你必须/,
  /你应该立刻/,
  /唯一正确/,
  /你注定/,
  /灾祸|劫难|厄运/,
  /保证.{0,8}(发生|实现|成功)/,
  /医疗建议|法律建议|投资建议/,
  /作为(?:一个)?AI/,
  /根据你的情况.*建议/,
];

function stableHash(value: string) {
  return Array.from(value).reduce(
    (hash, char) => Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0,
    2166136261,
  );
}

function pickFortuneMood(seedText: string): FortuneMood {
  const bucket = stableHash(`mood:${seedText}`) % 100;

  if (bucket < 20) return "大吉";
  if (bucket < 55) return "中吉";
  if (bucket < 90) return "小吉";
  return "守";
}

function pickBySeed<T>(items: T[], seedText = "") {
  const seed = Array.from(seedText).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return items[(seed + new Date().getDate()) % items.length];
}

function extractResponseText(response: OpenAIResponse) {
  return response.output
    ?.flatMap((item) => item.content ?? [])
    .find((content) => content.type === "output_text" && content.text)?.text;
}

function normalizeOracleText(text: string) {
  return text
    .replace(/^```(?:text)?\s*/i, "")
    .replace(/\s*```$/, "")
    .replace(/^[「『“\"]|[」』”\"]$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isValidThanksOracle(text: string) {
  const length = Array.from(text).length;
  return (
    length >= 20 &&
    length <= 100 &&
    !/[<>]/.test(text) &&
    !disallowedOraclePatterns.some((pattern) => pattern.test(text))
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseDivinationSlip(value: unknown) {
  if (!isRecord(value)) return null;

  const fortuneName =
    typeof value.fortuneName === "string" ? value.fortuneName.trim() : "";
  const resultText =
    typeof value.resultText === "string" ? normalizeOracleText(value.resultText) : "";
  const fortuneNameLength = Array.from(fortuneName).length;
  const resultLength = Array.from(resultText).length;

  if (
    fortuneNameLength >= 2 &&
    fortuneNameLength <= 12 &&
    resultLength >= 20 &&
    resultLength <= 90 &&
    !/[<>]/.test(`${fortuneName}${resultText}`) &&
    !disallowedOraclePatterns.some((pattern) => pattern.test(resultText))
  ) {
    return { fortuneName, resultText };
  }

  return null;
}

function parseDailyDivinationSetValue(value: unknown): DailyDivinationSlipsInput | null {
  if (!isRecord(value)) return null;

  const keys = Object.keys(value);
  if (
    keys.length !== fortuneMoods.length ||
    !fortuneMoods.every((mood) => keys.includes(mood))
  ) {
    return null;
  }

  const slips = {} as DailyDivinationSlipsInput;

  for (const mood of fortuneMoods) {
    const slip = parseDivinationSlip(value[mood]);
    if (!slip) return null;
    slips[mood] = slip;
  }

  return slips;
}

function parseDailyDivinationSet(text: string) {
  const normalized = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  try {
    return parseDailyDivinationSetValue(JSON.parse(normalized) as unknown);
  } catch {
    return null;
  }
}

function createFallbackThanksOracle(input: ThanksOracleInput) {
  const topic = thanksTopicEchoes.find((item) => item.pattern.test(input.userMessage));
  const topicLine = topic
    ? pickBySeed(topic.lines, `${input.variationMark}:${input.userMessage}`)
    : pickBySeed(thanksOracles, `${input.variationMark}:${input.userMessage}`);
  const ending = pickBySeed(fallbackEndings, `${input.incenseName}:${input.variationMark}`);

  return `${topicLine}${ending}`;
}

export async function generatePersonalThanksOracle(
  input: ThanksOracleInput,
): Promise<OracleResult> {
  const god = shrineGods.thanks;
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
    try {
      const response = await fetch(
        process.env.OPENAI_RESPONSES_URL ?? "https://api.openai.com/v1/responses",
        {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL ?? "gpt-5.4-nano",
          store: false,
          input: [
            {
              role: "system",
              content: thanksOracleSystemPrompt,
            },
            {
              role: "user",
              content: JSON.stringify({
                今日香型: input.incenseName,
                访客短句: input.userMessage,
                日期: input.dayKey,
                变化印记: input.variationMark,
              }),
            },
          ],
          max_output_tokens: 180,
        }),
        signal: AbortSignal.timeout(10_000),
        },
      );

      if (!response.ok) {
        throw new Error(`OpenAI thanks oracle generation failed: ${response.status}`);
      }

      const data = (await response.json()) as OpenAIResponse;
      const rawText = extractResponseText(data);
      const resultText = rawText ? normalizeOracleText(rawText) : "";

      if (resultText && isValidThanksOracle(resultText)) {
        return { godName: god.name, resultText };
      }

      throw new Error("OpenAI thanks oracle did not satisfy shrine boundaries.");
    } catch (error) {
      console.warn("AI thanks oracle generation failed; using local fallback.", error);
    }
  }

  return {
    godName: god.name,
    resultText: createFallbackThanksOracle(input),
  };
}

function getRetryDelayMs(attemptCount: number) {
  const delays = [30_000, 120_000, 600_000];
  return delays[Math.min(Math.max(attemptCount - 1, 0), delays.length - 1)];
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function createLocalDailyDivinationSet(dayKey: string) {
  return localDailyDivinationSets[
    stableHash(`local-daily-divination:${dayKey}`) % localDailyDivinationSets.length
  ];
}

async function requestDailyDivinationSet(dayKey: string) {
  if (process.env.DIVINATION_AI_ENABLED !== "true") {
    return createLocalDailyDivinationSet(dayKey);
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new DivinationGenerationError(
      "NOT_CONFIGURED",
      "OpenAI is not configured for daily divination generation.",
    );
  }

  let response: Response;

  try {
    response = await fetch(
      process.env.OPENAI_RESPONSES_URL ?? "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL ?? "gpt-5.4-nano",
          store: false,
          input: [
            {
              role: "system",
              content: divinationOracleSystemPrompt,
            },
            {
              role: "user",
              content: JSON.stringify({
                签库日期: dayKey,
                每日印记: stableHash(`daily-divination:${dayKey}`).toString(36),
              }),
            },
          ],
          max_output_tokens: 700,
        }),
        signal: AbortSignal.timeout(10_000),
      },
    );
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "";
    throw new DivinationGenerationError(
      errorName === "TimeoutError" || errorName === "AbortError"
        ? "TIMEOUT"
        : "UPSTREAM_ERROR",
      "OpenAI daily divination request failed before a response was received.",
    );
  }

  if (!response.ok) {
    const code: DivinationGenerationErrorCode =
      response.status === 429
        ? "RATE_LIMIT"
        : response.status === 401 || response.status === 403
          ? "AUTH_ERROR"
          : "UPSTREAM_ERROR";

    throw new DivinationGenerationError(
      code,
      `OpenAI daily divination generation failed: ${response.status}`,
    );
  }

  let data: OpenAIResponse;

  try {
    data = (await response.json()) as OpenAIResponse;
  } catch {
    throw new DivinationGenerationError(
      "INVALID_OUTPUT",
      "OpenAI daily divination response was not valid JSON.",
    );
  }

  const rawText = extractResponseText(data);
  const slips = rawText ? parseDailyDivinationSet(rawText) : null;

  if (!slips) {
    throw new DivinationGenerationError(
      "INVALID_OUTPUT",
      "OpenAI daily divination set did not satisfy shrine boundaries.",
    );
  }

  return slips;
}

async function getOrCreateDailyDivinationSet(dayKey: string) {
  const startedAt = Date.now();

  while (true) {
    const cached = await getDailyDivinationSet(dayKey);

    if (cached?.status === "READY") {
      const slips = parseDailyDivinationSetValue(cached.slips);

      if (!slips) {
        throw databaseUnavailable("今日签册的字迹暂时无法辨认，请稍后再试。");
      }

      return slips;
    }

    const now = new Date();

    if (
      cached?.status === "FAILED" &&
      cached.nextRetryAt &&
      cached.nextRetryAt.getTime() > now.getTime()
    ) {
      throw aiUnavailable("星轨仍在云后歇息，今日签文暂未落下。请稍后再试。");
    }

    const leaseToken = crypto.randomUUID();
    const claim = await claimDailyDivinationGeneration(
      dayKey,
      leaseToken,
      now,
      new Date(now.getTime() + divinationLeaseMs),
    );

    if (claim) {
      try {
        const slips = await requestDailyDivinationSet(dayKey);
        await completeDailyDivinationGeneration(dayKey, leaseToken, slips);
        return slips;
      } catch (error) {
        if (!(error instanceof DivinationGenerationError)) throw error;

        await failDailyDivinationGeneration(
          dayKey,
          leaseToken,
          error.code,
          new Date(Date.now() + getRetryDelayMs(claim.attemptCount)),
        );
        console.warn("AI daily divination set generation failed.", {
          dayKey,
          code: error.code,
        });
        throw aiUnavailable("星轨刚刚被云遮住，签文没有落下。请稍后再试。");
      }
    }

    if (Date.now() - startedAt >= divinationWaitMs) {
      throw aiUnavailable("今日签册仍在落墨，请稍后再试。");
    }

    await wait(180);
  }
}

export async function generateDailyDivinationOracle(
  input: DivinationOracleInput,
): Promise<OracleResult> {
  const mood = pickFortuneMood(input.selectionSeed);
  const slips = await getOrCreateDailyDivinationSet(input.dayKey);
  const slip = slips[mood];

  return {
    godName: shrineGods.divination.name,
    fortuneName: slip.fortuneName,
    mood,
    resultText: slip.resultText,
  };
}
