import {
  createRitualEvent,
  DailyRitualAlreadyCompletedError,
  getDailyRitualEvent,
  getRitualEventById,
} from "../db/queries";
import {
  generateDailyDivinationOracle,
  generatePersonalThanksOracle,
} from "./oracle";
import { getTokyoDayKey } from "../utils/time";
import type { RitualRequestInput, RitualType } from "../utils/validator";
import { getDailyIncense } from "./incense";
import { dailyRitualCompleted, invalidRequest } from "../http/errors";

function dailyLimitMessage(ritualType: RitualType) {
  return ritualType === "thanks"
    ? "今日的一炷香已经安放。明日再来，殿门仍会为你留灯。"
    : "今日之签已经落下。先带着这句回音走一段，明日再来。";
}

function createVariationMark(value: string) {
  const hash = Array.from(value).reduce(
    (total, char) => (total * 31 + char.charCodeAt(0)) >>> 0,
    2166136261,
  );
  return hash.toString(36).padStart(7, "0").slice(0, 7);
}

export async function completeRitual(input: RitualRequestInput) {
  if (!input.sessionId) {
    throw invalidRequest("这次仪式需要一枚本地参拜印记，请刷新页面后再试。");
  }

  const dayKey = getTokyoDayKey();
  const existingEvent = await getDailyRitualEvent(
    input.sessionId,
    input.ritualType,
    dayKey,
  );

  if (existingEvent) {
    throw dailyRitualCompleted(dailyLimitMessage(input.ritualType), existingEvent.id);
  }

  if (input.ritualType === "thanks") {
    const menu = await getDailyIncense(input.sessionId);
    const isTodayIncense = menu.incense.some((item) => item.name === input.incenseName);

    if (!input.incenseName || !isTodayIncense) {
      throw invalidRequest("请从今日香单中选一缕香，再轻轻敬上。");
    }
  }

  const oracle =
    input.ritualType === "thanks"
      ? await generatePersonalThanksOracle({
          userMessage: input.userMessage ?? `献上${input.incenseName}，谢谢今日相助。`,
          incenseName: input.incenseName!,
          variationMark: createVariationMark(`${input.sessionId}:${dayKey}`),
          dayKey,
        })
      : await generateDailyDivinationOracle({
          selectionSeed: `${input.sessionId}:${dayKey}`,
          dayKey,
        });
  const resultLabel = oracle.fortuneName
    ? `${oracle.fortuneName}｜${oracle.mood}｜${oracle.resultText}`
    : oracle.resultText;

  let event;

  try {
    event = await createRitualEvent({
      sessionId: input.sessionId,
      eventType: input.ritualType,
      godName: oracle.godName,
      incenseName: input.incenseName,
      userMessage: input.userMessage,
      resultText: resultLabel,
      dailyKey: dayKey,
    });
  } catch (error) {
    if (error instanceof DailyRitualAlreadyCompletedError) {
      const existing = await getDailyRitualEvent(
        input.sessionId,
        input.ritualType,
        dayKey,
      );
      throw dailyRitualCompleted(dailyLimitMessage(input.ritualType), existing?.id);
    }

    throw error;
  }

  return {
    id: event.id,
    ritualType: event.eventType,
    godName: oracle.godName,
    incenseName: event.incenseName,
    userMessage: input.userMessage ?? "",
    resultText: oracle.resultText,
    fortuneName: oracle.fortuneName,
    mood: oracle.mood,
    createdAt: event.createdAt,
  };
}

export async function getDailyRitualStatus(sessionId: string, ritualType: RitualType) {
  const existing = await getDailyRitualEvent(
    sessionId,
    ritualType,
    getTokyoDayKey(),
  );
  return { available: !existing, resultId: existing?.id };
}

export async function getRitualResult(id: string) {
  return getRitualEventById(id);
}
