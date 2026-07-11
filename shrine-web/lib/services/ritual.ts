import {
  createRitualEvent,
  getRitualEventById,
  hasCompletedDailyThanks,
} from "../db/queries";
import { generateOracle } from "./oracle";
import type { RitualRequestInput } from "../utils/validator";

export async function completeRitual(input: RitualRequestInput) {
  if (input.ritualType === "thanks") {
    if (!input.sessionId) {
      throw new Error("这炷香需要一枚本地参拜印记，请刷新页面后再试。");
    }

    if (await hasCompletedDailyThanks(input.sessionId)) {
      throw new Error("今日的一炷香已经安放。明日再来，殿门仍会为你留灯。");
    }
  }

  const oracle = generateOracle(input.ritualType, input.userMessage);
  const resultLabel = oracle.fortuneName
    ? `${oracle.fortuneName}｜${oracle.mood}｜${oracle.resultText}`
    : oracle.resultText;

  const event = await createRitualEvent({
    sessionId: input.sessionId,
    eventType: input.ritualType,
    godName: oracle.godName,
    userMessage: input.userMessage,
    resultText: resultLabel,
  });

  return {
    id: event.id,
    ritualType: event.eventType,
    godName: oracle.godName,
    userMessage: input.userMessage ?? "",
    resultText: oracle.resultText,
    fortuneName: oracle.fortuneName,
    mood: oracle.mood,
    createdAt: event.createdAt,
  };
}

export async function getDailyThanksStatus(sessionId: string) {
  return { available: !(await hasCompletedDailyThanks(sessionId)) };
}

export async function getRitualResult(id: string) {
  return getRitualEventById(id);
}
